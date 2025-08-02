import { CatchUpRequest, CatchUpResult, VaccineRecommendation } from "@shared/schema";
import { vaccineNameMapper } from "./vaccine-name-mapper";
import { 
  getVaccineRules, 
  addCalendarMonths,
  checkContraindications,
  checkPrecautions,
  getSpecialSituationModifications,
  type SpecialConditions
} from "./vaccine-cdc-rules";

interface VaccineDoseInfo {
  date: Date;
  product?: string; // Optional product information
}

// Vaccine name normalization is now handled by the centralized vaccine-name-mapper

export class VaccineCatchUpService {
  private parseDate(dateStr: string): Date {
    return new Date(dateStr);
  }

  private getAgeInDays(birthDate: Date, currentDate: Date): number {
    return Math.floor((currentDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private calculateAge(birthDate: Date, currentDate: Date): string {
    const ageInDays = this.getAgeInDays(birthDate, currentDate);
    const years = Math.floor(ageInDays / 365);
    const months = Math.floor((ageInDays % 365) / 30);
    
    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''}`;
    } else {
      return `${months} month${months > 1 ? 's' : ''}`;
    }
  }

  // Normalize vaccine name using the centralized mapper
  private normalizeVaccineName(name: string): string {
    return vaccineNameMapper.toInternal(name);
  }

  // Get age in months for easier calculations
  private getAgeInMonths(birthDate: Date, currentDate: Date): number {
    const ageInDays = this.getAgeInDays(birthDate, currentDate);
    return Math.floor(ageInDays / 30.44); // More accurate month calculation
  }

  // Get age in years
  private getAgeInYears(birthDate: Date, currentDate: Date): number {
    const ageInDays = this.getAgeInDays(birthDate, currentDate);
    return Math.floor(ageInDays / 365.25); // Account for leap years
  }

  // Check if dose was given too early according to CDC guidelines
  private isDoseTooEarly(
    vaccineName: string,
    doseNumber: number,
    birthDate: Date,
    doseDate: Date,
    previousDoseDate: Date | null
  ): boolean {
    const rules = getVaccineRules(vaccineName);
    if (!rules) return false;

    const GRACE_PERIOD_DAYS = 4;

    // Check minimum age for first dose
    if (doseNumber === 1) {
      const ageAtDose = this.getAgeInDays(birthDate, doseDate);
      const daysDiff = rules.minimumAge - ageAtDose;
      return daysDiff > GRACE_PERIOD_DAYS;
    }

    // Check minimum interval from previous dose
    if (previousDoseDate && doseNumber > 1) {
      const daysBetween = this.getAgeInDays(previousDoseDate, doseDate);
      const requiredInterval = Array.isArray(rules.minimumIntervals) 
        ? rules.minimumIntervals[doseNumber - 2] || 28
        : 28;
      const daysDiff = requiredInterval - daysBetween;
      return daysDiff > GRACE_PERIOD_DAYS;
    }

    return false;
  }

  private getVaccineRecommendation(
    vaccineName: string,
    birthDate: Date,
    currentDate: Date,
    doses: VaccineDoseInfo[],
    specialConditions?: SpecialConditions,
    immunityEvidence?: Record<string, boolean>
  ): VaccineRecommendation {
    const normalizedName = this.normalizeVaccineName(vaccineName);
    const sortedDoses = doses.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Validate doses for early administration
    const validDoses: VaccineDoseInfo[] = [];
    const earlyDoses: number[] = [];
    
    sortedDoses.forEach((dose, index) => {
      const previousDose = index > 0 ? validDoses[validDoses.length - 1] : null;
      const isEarly = this.isDoseTooEarly(
        normalizedName,
        index + 1,
        birthDate,
        dose.date,
        previousDose?.date || null
      );
      
      if (isEarly) {
        earlyDoses.push(index + 1);
      } else {
        validDoses.push(dose);
      }
    });
    
    const numDoses = validDoses.length;
    const currentAgeDays = this.getAgeInDays(birthDate, currentDate);
    const currentAgeMonths = this.getAgeInMonths(birthDate, currentDate);
    const currentAgeYears = this.getAgeInYears(birthDate, currentDate);
    
    let recommendation = '';
    let nextDoseDate: string | undefined;
    let seriesComplete = false;
    const notes: string[] = [];
    let decisionType: VaccineRecommendation['decisionType'] = 'routine';
    const contraindications: string[] = [];
    const precautions: string[] = [];
    const specialSituations: string[] = [];
    
    // Add notes about early doses
    if (earlyDoses.length > 0) {
      notes.push(`⚠️ Dose(s) ${earlyDoses.join(', ')} given too early per CDC guidelines - not counted`);
    }
    
    // Check for evidence of immunity
    if (immunityEvidence?.[normalizedName]) {
      seriesComplete = true;
      recommendation = 'Series complete due to evidence of immunity';
      notes.push('Immunity confirmed (e.g., lab results or disease history); no further doses needed per CDC');
      
      return {
        vaccineName: vaccineNameMapper.getAgeSpecificDisplay(normalizedName, currentAgeYears),
        recommendation,
        nextDoseDate,
        seriesComplete,
        notes,
        decisionType: 'not-recommended',
        contraindications,
        precautions,
        specialSituations
      };
    }

    switch (normalizedName) {
      case 'hepatitis_b':
        if (numDoses >= 3) {
          recommendation = 'Hepatitis B series complete';
          seriesComplete = true;
        } else if (numDoses === 0) {
          if (currentAgeMonths >= 0) {
            recommendation = 'Give Hepatitis B dose 1 now (birth dose or catch-up)';
            notes.push('Hepatitis B should be given at birth or as soon as possible');
          }
        } else if (numDoses === 1) {
          const nextDate = this.addDays(sortedDoses[0].date, 28); // 4 weeks minimum
          if (currentDate >= nextDate) {
            recommendation = 'Give Hepatitis B dose 2 now';
          } else {
            recommendation = `Give Hepatitis B dose 2 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
          notes.push('Minimum 4 weeks after dose 1');
        } else if (numDoses === 2) {
          const minFromDose2 = this.addDays(sortedDoses[1].date, 56); // 8 weeks from dose 2
          const minFromDose1 = this.addDays(sortedDoses[0].date, 112); // 16 weeks from dose 1
          const minAge = this.addDays(birthDate, 168); // 24 weeks of age
          const nextDate = new Date(Math.max(minFromDose2.getTime(), minFromDose1.getTime(), minAge.getTime()));
          
          if (currentDate >= nextDate) {
            recommendation = 'Give Hepatitis B dose 3 now (final dose)';
          } else {
            recommendation = `Give Hepatitis B dose 3 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
          notes.push('Final dose: minimum 8 weeks after dose 2, 16 weeks after dose 1, and at least 24 weeks of age');
        }
        break;

      case 'rotavirus':
        // Get CDC rules for rotavirus
        const rotavirusCdcRules = getVaccineRules(normalizedName);
        
        // Determine product from history or default to unknown
        const rotavirusProduct = doses.length > 0 && doses[0].product ? doses[0].product : 'Unknown';
        const productVariant = rotavirusCdcRules?.productVariants?.[rotavirusProduct] || rotavirusCdcRules?.productVariants?.['Unknown'];
        const requiredDoses = productVariant?.doses || 3; // Default to 3 per CDC
        
        if (currentAgeMonths > 8) {
          recommendation = 'Past maximum age (8 months) for rotavirus series';
          seriesComplete = true;
          notes.push('Rotavirus vaccine not recommended after 8 months of age');
        } else if (numDoses >= requiredDoses) {
          recommendation = 'Rotavirus series complete';
          seriesComplete = true;
          if (productVariant?.notes) {
            notes.push(...productVariant.notes);
          }
        } else if (numDoses === 0) {
          if (currentAgeMonths > 3.5) { // 14 weeks + 6 days
            recommendation = 'Past maximum age for first rotavirus dose';
            seriesComplete = true;
            notes.push('First dose must be given by 14 weeks 6 days of age');
          } else if (currentAgeMonths >= 1.5) { // 6 weeks
            recommendation = 'Give rotavirus dose 1 now';
            notes.push('Minimum age: 6 weeks');
            if (productVariant?.notes) {
              notes.push(...productVariant.notes);
            }
          } else {
            const nextDate = this.addDays(birthDate, 42); // 6 weeks
            recommendation = `Give rotavirus dose 1 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
            notes.push('Wait until 6 weeks of age');
          }
        } else {
          const intervals = productVariant?.minimumIntervals || [28, 28];
          const nextInterval = intervals[numDoses - 1] || 28;
          const nextDate = this.addDays(sortedDoses[numDoses - 1].date, nextInterval);
          
          if (currentDate >= nextDate && currentAgeMonths <= 8) {
            recommendation = `Give rotavirus dose ${numDoses + 1} now`;
            if (productVariant?.notes) {
              notes.push(...productVariant.notes);
            }
          } else if (currentAgeMonths > 8) {
            recommendation = 'Past maximum age for rotavirus; series incomplete';
            seriesComplete = true;
          } else {
            recommendation = `Give rotavirus dose ${numDoses + 1} on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
            notes.push(`Minimum ${nextInterval} days between doses`);
          }
        }
        break;

      case 'dtap_tdap':
        // Smart DTaP/Tdap logic based on age and previous doses
        if (currentAgeYears >= 7) {
          // Age 7+ uses Tdap/Td schedule
          if (numDoses >= 3) {
            // Check if they've had Tdap (after age 7)
            const tdapDoses = sortedDoses.filter(dose => {
              const ageAtDose = this.getAgeInYears(birthDate, dose.date);
              return ageAtDose >= 7;
            });
            
            if (tdapDoses.length >= 1) {
              // Already had Tdap, check for Td booster needs
              const lastTdapDate = tdapDoses[tdapDoses.length - 1].date;
              const tenYearsLater = this.addDays(lastTdapDate, 3650); // 10 years
              
              if (currentDate >= tenYearsLater) {
                recommendation = 'Give Td booster now (10 years since last dose)';
                notes.push('Td booster every 10 years after Tdap');
              } else {
                recommendation = 'Tdap/Td series up to date';
                seriesComplete = true;
                notes.push(`Next Td booster due ${this.formatDate(tenYearsLater)}`);
              }
            } else {
              // Had DTaP doses but no Tdap yet
              recommendation = 'Give Tdap now (one-time adolescent/adult dose)';
              notes.push('Tdap replaces one Td booster for adolescents/adults');
              notes.push('Previous DTaP doses count toward primary series');
            }
          } else if (numDoses === 0) {
            // No previous doses, start catch-up
            recommendation = 'Give Tdap dose 1 now';
            notes.push('Catch-up schedule for 7-18 years: 3 doses total');
            notes.push('Schedule: Dose 1 → 4 weeks → Dose 2 → 6 months → Dose 3');
          } else {
            // Partial series, continue catch-up per CDC
            const nextInterval = numDoses === 1 ? 28 : 183; // 4 weeks after dose 1, 6 months after dose 2
            const nextDate = this.addDays(sortedDoses[numDoses - 1].date, nextInterval);
            
            if (currentDate >= nextDate) {
              recommendation = `Give Tdap dose ${numDoses + 1} now`;
            } else {
              recommendation = `Give Tdap dose ${numDoses + 1} on or after ${this.formatDate(nextDate)}`;
              nextDoseDate = this.formatDate(nextDate);
            }
            
            if (numDoses === 1) {
              notes.push('Minimum 4 weeks between doses 1-2');
            } else if (numDoses === 2) {
              notes.push('Minimum 6 months between doses 2-3 (final dose)');
            }
          }
        } else {
          // Under age 7 - use DTaP schedule
          if (numDoses >= 5) {
            recommendation = 'DTaP series complete';
            seriesComplete = true;
            notes.push('Will need Tdap at age 11-12 years');
          } else if (numDoses === 4) {
            const fourthDoseAge = this.getAgeInDays(birthDate, sortedDoses[3].date) / 365.25;
            const intervalFromDose3 = Math.floor((sortedDoses[3].date.getTime() - sortedDoses[2].date.getTime()) / (1000 * 60 * 60 * 24));
            
            if (fourthDoseAge >= 4 && intervalFromDose3 >= 183) {
              recommendation = 'DTaP series complete (4 doses sufficient if dose 4 given after 4th birthday)';
              seriesComplete = true;
              notes.push('Will need Tdap at age 11-12 years');
            } else {
              // Need 5th dose at 4-6 years
              const fifthDoseDate = this.addDays(birthDate, 4 * 365);
              const minFromFourth = this.addDays(sortedDoses[3].date, 183); // 6 months
              const finalDate = new Date(Math.max(fifthDoseDate.getTime(), minFromFourth.getTime()));
              
              if (currentDate >= finalDate) {
                recommendation = 'Give DTaP dose 5 now (school entry dose)';
              } else {
                recommendation = `Give DTaP dose 5 on or after ${this.formatDate(finalDate)}`;
                nextDoseDate = this.formatDate(finalDate);
              }
              notes.push('5th dose at 4-6 years for school entry');
            }
          } else if (numDoses === 0) {
            if (currentAgeMonths >= 1.5) { // 6 weeks
              recommendation = 'Give DTaP dose 1 now';
              notes.push('Schedule: 2, 4, 6, 15-18 months, 4-6 years');
            } else {
              const nextDate = this.addDays(birthDate, 42); // 6 weeks
              recommendation = `Give DTaP dose 1 on or after ${this.formatDate(nextDate)}`;
              nextDoseDate = this.formatDate(nextDate);
            }
          } else {
            // CDC minimum intervals for ages 4 months-6 years
            const minIntervals = [28, 28, 183, 183]; // 4 weeks, 4 weeks, 6 months, 6 months
            const nextInterval = minIntervals[numDoses - 1] || 28;
            const nextDate = this.addDays(sortedDoses[numDoses - 1].date, nextInterval);
            
            if (currentDate >= nextDate) {
              recommendation = `Give DTaP dose ${numDoses + 1} now`;
            } else {
              recommendation = `Give DTaP dose ${numDoses + 1} on or after ${this.formatDate(nextDate)}`;
              nextDoseDate = this.formatDate(nextDate);
            }
            
            // Add specific interval guidance per CDC
            if (numDoses === 1) {
              notes.push('Dose 2: Minimum 4 weeks after dose 1');
            } else if (numDoses === 2) {
              notes.push('Dose 3: Minimum 4 weeks after dose 2');
            } else if (numDoses === 3) {
              notes.push('Dose 4: Minimum 6 months after dose 3');
            } else if (numDoses === 4) {
              notes.push('Dose 5: Minimum 6 months after dose 4');
            }
          }
        }
        break;



      case 'hib':
        // Enhanced Hib logic using catch-up rules
        const hibRules = getVaccineRules(normalizedName);
        
        if (currentAgeYears >= 5) {
          recommendation = 'HIB vaccine not routinely recommended after 5 years';
          seriesComplete = true;
          notes.push('HIB vaccine generally not needed for healthy children 5 years and older');
          
          // Check special conditions
          if (specialConditions?.immunocompromised || specialConditions?.asplenia) {
            recommendation = 'Consider HIB vaccine for high-risk condition';
            seriesComplete = false;
            notes.push('May give 1 dose to older children/adults with asplenia or immunocompromised if unvaccinated');
          }
        } else {
          // Determine age at first dose or current age if no doses
          const ageAtFirst = numDoses > 0 ? this.getAgeInMonths(birthDate, validDoses[0].date) : currentAgeMonths;
          
          // Select appropriate catch-up rule based on age at first dose
          let ageKey: string;
          if (ageAtFirst < 7) ageKey = '<7m';
          else if (ageAtFirst < 12) ageKey = '7-11m';
          else if (ageAtFirst < 15) ageKey = '12-14m';
          else if (ageAtFirst < 60) ageKey = '15-59m';
          else ageKey = '15-59m'; // Default to single dose for older
          
          const catchUp = hibRules?.catchUpRules?.[ageKey] || { doses: 1, intervals: [] };
          const requiredDoses = catchUp.doses;
          
          if (numDoses >= requiredDoses) {
            recommendation = 'HIB series complete';
            seriesComplete = true;
            if (catchUp.notes?.length) {
              notes.push(...catchUp.notes);
            }
          } else if (numDoses === 0) {
            if (currentAgeMonths >= 1.5) { // 6 weeks
              recommendation = 'Give HIB dose 1 now';
              if (catchUp.notes?.length) {
                notes.push(...catchUp.notes);
              }
            } else {
              const nextDate = this.addDays(birthDate, 42); // 6 weeks
              recommendation = `Give HIB dose 1 on or after ${this.formatDate(nextDate)}`;
              nextDoseDate = this.formatDate(nextDate);
              notes.push('Minimum age: 6 weeks');
            }
          } else {
            // Calculate next dose using catch-up intervals
            const nextInterval = catchUp.intervals[numDoses - 1] || 28;
            const nextDate = this.addDays(validDoses[numDoses - 1].date, nextInterval);
            
            if (currentDate >= nextDate) {
              recommendation = `Give HIB dose ${numDoses + 1} now`;
            } else {
              recommendation = `Give HIB dose ${numDoses + 1} on or after ${this.formatDate(nextDate)}`;
              nextDoseDate = this.formatDate(nextDate);
            }
            
            if (catchUp.notes?.length) {
              notes.push(...catchUp.notes);
            }
            notes.push(`Minimum interval: ${nextInterval} days`);
          }
        }
        break;

      case 'pneumococcal':
        // Enhanced PCV logic using catch-up rules
        const pcvRules = getVaccineRules(normalizedName);
        
        if (currentAgeYears >= 5) {
          if (numDoses >= 1) {
            recommendation = 'Pneumococcal series complete (healthy children)';
            seriesComplete = true;
            notes.push('Additional doses may be needed for high-risk conditions');
            
            // Check special conditions
            if (specialConditions?.immunocompromised || specialConditions?.asplenia || 
                specialConditions?.cochlearImplant || specialConditions?.csfLeak) {
              recommendation = 'Consider additional pneumococcal vaccines for high-risk condition';
              seriesComplete = false;
              notes.push('High-risk individuals may need PCV and PPSV23 vaccines');
            }
          } else {
            recommendation = 'PCV not routinely recommended after 5 years';
            notes.push('May be indicated for high-risk conditions');
          }
        } else {
          // Determine age at first dose or current age if no doses
          const ageAtFirst = numDoses > 0 ? this.getAgeInMonths(birthDate, validDoses[0].date) : currentAgeMonths;
          
          // Select appropriate catch-up rule based on age at first dose
          let ageKey: string;
          if (ageAtFirst < 7) ageKey = '<7m';
          else if (ageAtFirst < 12) ageKey = '7-11m';
          else if (ageAtFirst < 24) ageKey = '12-23m';
          else if (ageAtFirst < 60) ageKey = '24-59m';
          else ageKey = '24-59m'; // Default to single dose for older
          
          const catchUp = pcvRules?.catchUpRules?.[ageKey] || { doses: 1, intervals: [] };
          const requiredDoses = catchUp.doses;
          
          if (numDoses >= requiredDoses) {
            recommendation = 'Pneumococcal (PCV) series complete';
            seriesComplete = true;
            if (catchUp.notes?.length) {
              notes.push(...catchUp.notes);
            }
          } else if (numDoses === 0) {
            if (currentAgeMonths >= 1.5) { // 6 weeks
              recommendation = 'Give pneumococcal (PCV) dose 1 now';
              notes.push('Use PCV15 or PCV20');
              if (catchUp.notes?.length) {
                notes.push(...catchUp.notes);
              }
            } else {
              const nextDate = this.addDays(birthDate, 42); // 6 weeks
              recommendation = `Give pneumococcal (PCV) dose 1 on or after ${this.formatDate(nextDate)}`;
              nextDoseDate = this.formatDate(nextDate);
              notes.push('Minimum age: 6 weeks');
            }
          } else {
            // Calculate next dose using catch-up intervals
            const nextInterval = catchUp.intervals[numDoses - 1] || 28;
            const nextDate = this.addDays(validDoses[numDoses - 1].date, nextInterval);
            
            if (currentDate >= nextDate) {
              recommendation = `Give pneumococcal (PCV) dose ${numDoses + 1} now`;
            } else {
              recommendation = `Give pneumococcal (PCV) dose ${numDoses + 1} on or after ${this.formatDate(nextDate)}`;
              nextDoseDate = this.formatDate(nextDate);
            }
            
            if (catchUp.notes?.length) {
              notes.push(...catchUp.notes);
            }
            notes.push(`Minimum interval: ${nextInterval} days`);
          }
        }
        break;

      case 'ipv':
      case 'polio':
        const ipvTotalDoses = 4;
        const ipvMinAge = 42; // 6 weeks
        
        if (numDoses >= ipvTotalDoses) {
          recommendation = 'Polio (IPV) series complete';
          seriesComplete = true;
          notes.push('Four doses provide lifelong protection against polio');
        } else if (numDoses === 0) {
          if (currentAgeDays >= ipvMinAge) {
            recommendation = 'Give polio (IPV) dose 1 now';
            notes.push('Schedule: 2, 4, 6-18 months, 4-6 years');
            notes.push('Minimum age: 6 weeks');
          } else {
            const nextDate = this.addDays(birthDate, ipvMinAge);
            recommendation = `Give polio (IPV) dose 1 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
            notes.push('Minimum age: 6 weeks');
          }
        } else if (numDoses === 1) {
          const nextDate = this.addDays(sortedDoses[0].date, 28); // 4 weeks
          if (currentDate >= nextDate) {
            recommendation = 'Give polio (IPV) dose 2 now';
          } else {
            recommendation = `Give polio (IPV) dose 2 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
          notes.push('Minimum interval: 4 weeks between doses 1-2');
        } else if (numDoses === 2) {
          const nextDate = this.addDays(sortedDoses[1].date, 28); // 4 weeks
          if (currentDate >= nextDate) {
            recommendation = 'Give polio (IPV) dose 3 now';
          } else {
            recommendation = `Give polio (IPV) dose 3 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
          notes.push('Minimum interval: 4 weeks between doses 2-3');
        } else if (numDoses === 3) {
          // Final dose must be at age 4+ AND 6 months after dose 3
          const ageDate = this.addDays(birthDate, 4 * 365); // 4 years
          const intervalDate = this.addDays(sortedDoses[2].date, 183); // 6 months
          const nextDate = new Date(Math.max(ageDate.getTime(), intervalDate.getTime()));
          
          if (currentDate >= nextDate) {
            recommendation = 'Give polio (IPV) dose 4 now (final dose)';
          } else {
            recommendation = `Give polio (IPV) dose 4 on or after ${this.formatDate(nextDate)} (final dose)`;
            nextDoseDate = this.formatDate(nextDate);
          }
          notes.push('Final dose: must be given at age 4+ years AND 6 months after dose 3');
        }
        break;

      case 'mmr':
        const mmrTotalDoses = 2;
        const mmrMinAge = 365; // 12 months
        const mmrInterval = 28; // 4 weeks
        
        if (numDoses >= mmrTotalDoses) {
          recommendation = 'MMR series complete';
          seriesComplete = true;
          notes.push('Two doses provide lifelong protection');
        } else if (numDoses === 0) {
          if (currentAgeDays >= mmrMinAge) {
            recommendation = 'Give MMR dose 1 now';
            notes.push('Schedule: Dose 1 at 12-15 months → 4 weeks → Dose 2 at 4-6 years');
          } else {
            const nextDate = this.addDays(birthDate, mmrMinAge);
            recommendation = `Give MMR dose 1 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
            notes.push('Minimum age: 12 months');
          }
          // Only show routine guidance if patient is close to routine age for MMR
          if (currentAgeYears <= 6) {
            notes.push('Routine schedule: 12-15 months and 4-6 years');
          } else {
            notes.push('Catch-up vaccination for missed MMR doses');
          }
        } else {
          const nextDate = this.addDays(sortedDoses[0].date, mmrInterval);
          if (currentDate >= nextDate) {
            recommendation = 'Give MMR dose 2 now (final dose)';
          } else {
            recommendation = `Give MMR dose 2 on or after ${this.formatDate(nextDate)} (final dose)`;
            nextDoseDate = this.formatDate(nextDate);
          }
          notes.push('Minimum interval: 4 weeks between doses');
        }
        break;

      case 'var':
      case 'varicella':
        // Get CDC rules for varicella
        const varicellaRules = getVaccineRules('varicella');
        const varTotalDoses = 2;
        const varMinAge = 365; // 12 months
        
        // Get age-dependent interval - 3 months if <13y, 4 weeks if ≥13y
        const getVaricellaInterval = () => {
          if (typeof varicellaRules?.minimumIntervals === 'function') {
            const intervals = varicellaRules.minimumIntervals(currentAgeYears);
            return intervals[0] || 28;
          }
          return 28; // Default to 4 weeks
        };
        
        const varInterval = getVaricellaInterval();
        
        if (numDoses >= varTotalDoses) {
          recommendation = 'Varicella series complete';
          seriesComplete = true;
          notes.push('Two doses provide excellent protection against chickenpox');
        } else if (numDoses === 0) {
          if (currentAgeDays >= varMinAge) {
            recommendation = 'Give varicella dose 1 now';
            if (currentAgeYears < 13) {
              notes.push('Schedule: Dose 1 → 3 months minimum → Dose 2');
            } else {
              notes.push('Schedule: Dose 1 → 4 weeks minimum → Dose 2');
            }
          } else {
            const nextDate = this.addDays(birthDate, varMinAge);
            recommendation = `Give varicella dose 1 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
            notes.push('Minimum age: 12 months');
          }
          // Only show routine guidance if patient is close to routine age for Varicella
          if (currentAgeYears <= 6) {
            notes.push('Routine schedule: 12-15 months and 4-6 years');
          } else {
            notes.push('Catch-up vaccination for missed varicella doses');
          }
        } else {
          const nextDate = this.addDays(sortedDoses[0].date, varInterval);
          if (currentDate >= nextDate) {
            recommendation = 'Give varicella dose 2 now (final dose)';
          } else {
            recommendation = `Give varicella dose 2 on or after ${this.formatDate(nextDate)} (final dose)`;
            nextDoseDate = this.formatDate(nextDate);
          }
          const intervalText = currentAgeYears < 13 ? '3 months' : '4 weeks';
          notes.push(`Minimum interval: ${intervalText} between doses`);
        }
        break;

      case 'hepa':
      case 'hepatitis a':
        const hepATotalDoses = 2;
        const hepAMinAge = 365; // 12 months
        const hepAInterval = 183; // 6 months
        
        if (numDoses >= hepATotalDoses) {
          recommendation = 'Series complete';
          seriesComplete = true;
        } else if (numDoses === 0) {
          if (currentAgeDays >= hepAMinAge) {
            recommendation = 'Give dose 1 now';
          } else {
            const nextDate = this.addDays(birthDate, hepAMinAge);
            recommendation = `Give dose 1 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
        } else {
          const nextDate = this.addDays(sortedDoses[0].date, hepAInterval);
          if (currentDate >= nextDate) {
            recommendation = 'Give dose 2 now';
          } else {
            recommendation = `Give dose 2 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
        }
        break;

      case 'tdap':
        const tdapMinAge = 2555; // 7 years
        if (currentAgeDays < tdapMinAge) {
          recommendation = 'Use DTaP instead';
          notes.push('Tdap is for patients 7 years and older');
        } else if (numDoses >= 1) {
          recommendation = 'Series complete (one lifetime dose for catch-up)';
          seriesComplete = true;
        } else {
          recommendation = 'Give 1 dose now';
        }
        break;

      case 'hpv':
        const hpvMinAge = 3285; // 9 years
        const isOlderStart = currentAgeYears >= 15; // Started at 15+ years needs 3 doses
        const hpvTotalDoses = isOlderStart ? 3 : 2;
        
        if (currentAgeYears > 26) {
          recommendation = 'Not routinely recommended after 26 years; discuss shared decision';
          notes.push('HPV vaccine most effective when given before exposure to HPV');
          notes.push('Adults 27-45 years: shared clinical decision-making with provider');
        } else if (numDoses >= hpvTotalDoses) {
          recommendation = 'HPV series complete';
          seriesComplete = true;
          notes.push('Provides protection against HPV types that cause most cancers and genital warts');
        } else if (numDoses === 0) {
          if (currentAgeYears >= 9) {
            recommendation = 'Give HPV dose 1 now';
            if (currentAgeYears < 15) {
              notes.push('2-dose schedule: Dose 1 → 5+ months → Dose 2');
            } else {
              notes.push('3-dose schedule (≥15 years): Dose 1 → 1-2 months → Dose 2 → 5 months → Dose 3');
            }
            // Only show routine guidance if patient is close to routine age
            if (currentAgeYears <= 12) {
              notes.push('Routine vaccination: 11-12 years (can start at 9 years)');
            } else {
              notes.push('Catch-up vaccination recommended through age 26');
            }
          } else {
            const nextDate = this.addDays(birthDate, hpvMinAge);
            recommendation = `Give HPV dose 1 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
            notes.push('Minimum age: 9 years');
            notes.push('Routine vaccination: 11-12 years (can start at 9 years)');
          }
        } else if (numDoses === 1) {
          if (isOlderStart) {
            // 3-dose schedule: 1-2 months after dose 1
            const nextDate = this.addDays(sortedDoses[0].date, 28); // minimum 1 month
            if (currentDate >= nextDate) {
              recommendation = 'Give HPV dose 2 now';
              notes.push('Next: Wait 6 months after dose 1 for dose 3 (final)');
            } else {
              recommendation = `Give HPV dose 2 on or after ${this.formatDate(nextDate)}`;
              nextDoseDate = this.formatDate(nextDate);
            }
            notes.push('3-dose schedule: minimum 1 month between doses 1-2');
          } else {
            // 2-dose schedule: 5 months minimum after dose 1 per CDC 2025
            const nextDate = this.addDays(sortedDoses[0].date, 150); // 5 months minimum
            if (currentDate >= nextDate) {
              recommendation = 'Give HPV dose 2 now (final dose)';
            } else {
              recommendation = `Give HPV dose 2 on or after ${this.formatDate(nextDate)} (final dose)`;
              nextDoseDate = this.formatDate(nextDate);
            }
            notes.push('2-dose schedule: minimum 5 months between doses');
          }
        } else if (numDoses === 2 && isOlderStart) {
          // Final dose for 3-dose schedule: 5 months after dose 1 AND 12 weeks after dose 2
          const fiveMonthsFromDose1 = this.addDays(sortedDoses[0].date, 150); // 5 months from dose 1
          const twelveWeeksFromDose2 = this.addDays(sortedDoses[1].date, 84); // 12 weeks from dose 2
          const nextDate = new Date(Math.max(fiveMonthsFromDose1.getTime(), twelveWeeksFromDose2.getTime()));
          
          if (currentDate >= nextDate) {
            recommendation = 'Give HPV dose 3 now (final dose)';
          } else {
            recommendation = `Give HPV dose 3 on or after ${this.formatDate(nextDate)} (final dose)`;
            nextDoseDate = this.formatDate(nextDate);
          }
          notes.push('Final dose: minimum 5 months after dose 1 AND 12 weeks after dose 2');
        }
        break;

      case 'meningococcal_acwy':
        if (currentAgeYears >= 11) {
          if (numDoses >= 2) {
            recommendation = 'MenACWY series complete';
            seriesComplete = true;
            notes.push('Booster may be needed for high-risk individuals');
          } else if (numDoses === 0) {
            recommendation = 'Give MenACWY dose 1 now';
            // Only show age-appropriate notes
            if (currentAgeYears <= 13) {
              notes.push('Routine immunization at 11-12 years');
            } else if (currentAgeYears >= 16) {
              notes.push('Catch-up vaccination - giving first dose now');
              notes.push('Will need second dose at least 8 weeks later');
            } else {
              notes.push('Catch-up vaccination for missed MenACWY dose');
              notes.push(`Booster dose scheduled at age 16`);
            }
          } else if (numDoses === 1) {
            if (currentAgeYears >= 16) {
              recommendation = 'Give MenACWY dose 2 now (booster)';
              notes.push('Second dose completing the series');
            } else {
              const boosterDate = this.addDays(birthDate, 16 * 365);
              recommendation = `Give MenACWY booster on or after ${this.formatDate(boosterDate)}`;
              nextDoseDate = this.formatDate(boosterDate);
              notes.push(`Booster dose scheduled at age 16 (${this.formatDate(boosterDate)})`);
            }
          }
        } else if (currentAgeMonths >= 2) {
          recommendation = 'MenACWY available for high-risk children';
          if (currentAgeYears < 11) {
            notes.push('Routine vaccination begins at 11-12 years');
            if (specialConditions && (specialConditions.asplenia || specialConditions.immunocompromised)) {
              notes.push('High-risk condition present - consider vaccination now');
            }
          }
        } else {
          recommendation = 'MenACWY not recommended under 2 months';
          notes.push('Minimum age: 2 months for high-risk, 11 years for routine');
        }
        break;

      case 'meningococcal_b':
        // Enhanced MenB logic with product variants
        const menBRules = getVaccineRules(normalizedName);
        const menBProduct = doses.length > 0 && doses[0].product ? doses[0].product : 'Unknown';
        const menBVariant = menBRules?.productVariants?.[menBProduct] || menBRules?.productVariants?.['Unknown'];
        
        // Standard doses based on product and risk status
        let menBDosesRequired = menBVariant?.doses || 2;
        const menBIntervals = menBVariant?.minimumIntervals || [183]; // Default 6 months
        
        // Adjust for high-risk conditions with Trumenba
        if (menBProduct === 'Trumenba' && (specialConditions?.asplenia || specialConditions?.immunocompromised)) {
          menBDosesRequired = 3; // 3-dose series for high-risk
          notes.push('High-risk: Using 3-dose Trumenba schedule (0, 1-2 months, 6 months)');
        }
        
        if (currentAgeYears >= 16 && currentAgeYears <= 23) {
          if (numDoses >= menBDosesRequired) {
            recommendation = 'MenB series complete';
            seriesComplete = true;
          } else if (numDoses === 0) {
            recommendation = 'Give MenB dose 1 now (preferred at 16-18 years)';
            notes.push('Category B recommendation: individual clinical decision');
            if (menBVariant?.notes) {
              notes.push(...menBVariant.notes);
            }
          } else {
            // Calculate next dose based on product-specific intervals
            const intervalIndex = Math.min(numDoses - 1, menBIntervals.length - 1);
            const nextInterval = menBIntervals[intervalIndex] || 183;
            const lastDoseDate = sortedDoses[numDoses - 1].date;
            const nextDate = this.addDays(lastDoseDate, nextInterval);
            
            if (currentDate >= nextDate) {
              recommendation = `Give MenB dose ${numDoses + 1} now`;
            } else {
              recommendation = `Give MenB dose ${numDoses + 1} on or after ${this.formatDate(nextDate)}`;
              nextDoseDate = this.formatDate(nextDate);
            }
            
            // Add interval notes
            if (menBProduct === 'Bexsero') {
              notes.push('Minimum 1 month between doses');
            } else if (menBProduct === 'Trumenba') {
              if (menBDosesRequired === 3) {
                notes.push(numDoses === 1 ? 'Next dose: 1-2 months after dose 1' : 'Final dose: 6 months after dose 1');
              } else {
                notes.push('Minimum 6 months between doses');
              }
            }
          }
        } else if (currentAgeYears >= 10) {
          if (specialConditions?.asplenia || specialConditions?.immunocompromised) {
            recommendation = 'Recommended: Give MenB dose 1 for high-risk condition';
            decisionType = 'risk-based';
            notes.push('High-risk individuals should receive MenB vaccine');
          } else {
            recommendation = 'MenB available for high-risk individuals';
            if (currentAgeYears <= 18) {
              notes.push('Routine vaccination preferred at 16-18 years');
            } else {
              notes.push('MenB vaccination generally not recommended after age 23');
            }
          }
          notes.push('May be given to high-risk individuals ≥10 years');
        } else {
          recommendation = 'MenB not routinely recommended under 10 years';
          notes.push('May be considered for high-risk children');
        }
        break;

      case 'covid19':
        // Enhanced COVID-19 logic with product variants and shared clinical decision-making
        const covidRules = getVaccineRules(normalizedName);
        const covidProduct = doses.length > 0 && doses[0].product ? doses[0].product : 'Unknown';
        const covidVariant = covidRules?.productVariants?.[covidProduct] || covidRules?.productVariants?.['Unknown'];
        
        // Calculate doses required based on age and product
        let covidDosesRequired = covidVariant?.doses || 1;
        let covidIntervals = covidVariant?.minimumIntervals || [28];
        
        // Age-based adjustments
        if (currentAgeYears >= 5) {
          covidDosesRequired = 1; // ≥5 years: 1 dose per CDC
        }
        
        // Special conditions adjustments
        if (specialConditions?.immunocompromised) {
          covidDosesRequired = Math.max(covidDosesRequired, 3); // At least 3 for immunocompromised
          notes.push('Immunocompromised patients: 3-dose primary series + additional doses');
          decisionType = 'risk-based';
        }
        
        // Age-based decision type
        if (currentAgeMonths < 6) {
          recommendation = 'COVID-19 vaccine not recommended under 6 months';
          notes.push('Minimum age: 6 months');
          decisionType = 'not-recommended';
        } else if (currentAgeYears < 18 && !specialConditions?.immunocompromised) {
          // Shared clinical decision-making for ages 6 months-17 years (unless immunocompromised)
          decisionType = 'shared-clinical-decision';
        } else if (currentAgeYears >= 18) {
          decisionType = 'routine';
        }
        
        // Calculate recommendation based on doses received
        if (currentAgeMonths >= 6) {
          if (numDoses >= covidDosesRequired) {
            seriesComplete = true;
            recommendation = 'COVID-19 series complete per current guidelines';
            notes.push('Continue to follow CDC guidance for updated vaccines');
          } else if (numDoses === 0) {
            if (decisionType === 'shared-clinical-decision') {
              recommendation = 'COVID-19 vaccine available through shared clinical decision-making';
              notes.push('Discuss benefits and risks with healthcare provider');
            } else {
              recommendation = 'Give COVID-19 vaccine dose 1 now';
              nextDoseDate = this.formatDate(currentDate);
            }
          } else {
            // Calculate next dose date based on product intervals
            const intervalIndex = Math.min(numDoses - 1, covidIntervals.length - 1);
            const nextInterval = covidIntervals[intervalIndex] || 28;
            const lastDoseDate = sortedDoses[numDoses - 1]?.date || currentDate;
            const nextDate = this.addDays(lastDoseDate, nextInterval);
            
            if (currentDate >= nextDate) {
              recommendation = `Give COVID-19 dose ${numDoses + 1} now`;
              nextDoseDate = this.formatDate(currentDate);
            } else {
              recommendation = `Give COVID-19 dose ${numDoses + 1} on or after ${this.formatDate(nextDate)}`;
              nextDoseDate = this.formatDate(nextDate);
            }
          }
          
          // Add product-specific notes
          if (covidVariant?.notes && numDoses < covidDosesRequired) {
            notes.push(...covidVariant.notes);
          }
          
          // Add shared decision notes if applicable
          if (decisionType === 'shared-clinical-decision' && numDoses === 0) {
            notes.push('Vaccination decision should be based on individual circumstances');
          }
        }
        break;

      case 'influenza':
        // Get CDC rules for influenza
        const fluRules = getVaccineRules(normalizedName);
        
        // Determine current flu season (July 1 - June 30)
        const getCurrentSeason = (date: Date) => {
          const year = date.getFullYear();
          const month = date.getMonth();
          return month >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
        };
        
        const currentSeason = getCurrentSeason(currentDate);
        const dosesThisSeason = doses.filter(dose => {
          const doseSeason = getCurrentSeason(dose.date);
          return doseSeason === currentSeason;
        }).length;
        
        if (currentAgeMonths < 6) {
          recommendation = 'Influenza vaccine not recommended under 6 months';
          notes.push('Minimum age: 6 months');
        } else if (dosesThisSeason > 0) {
          recommendation = 'Influenza vaccine for current season already received';
          seriesComplete = true;
          notes.push(`Current season (${currentSeason}) dose complete`);
        } else {
          // Check if child <9 years needs 2 doses
          if (currentAgeYears < 9) {
            const totalLifetimeDoses = doses.length;
            if (totalLifetimeDoses < 2) {
              if (dosesThisSeason === 0) {
                recommendation = 'Give first influenza dose of season now';
                notes.push('First-time recipients <9 years need 2 doses, 4 weeks apart');
              }
            } else {
              recommendation = 'Give annual influenza vaccine now';
              notes.push('Previously vaccinated: only 1 dose needed this season');
            }
          } else {
            recommendation = 'Give annual influenza vaccine now';
          }
          notes.push(`Annual vaccination recommended for ${currentSeason} season`);
        }
        break;

      case 'hepatitis_a':
        // Hepatitis A vaccine - 2 dose series
        if (numDoses === 0) {
          if (currentAgeMonths >= 12) {
            recommendation = 'Give Hepatitis A dose 1 now';
            nextDoseDate = this.formatDate(currentDate);
            notes.push('Hepatitis A recommended for all children ≥12 months');
            notes.push('Catch-up vaccination through age 18 years');
          } else {
            const nextDate = this.addDays(birthDate, 365); // 12 months
            recommendation = `Give Hepatitis A dose 1 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
            notes.push('Minimum age: 12 months');
          }
        } else if (numDoses === 1) {
          // Need 6 months between doses
          const daysSinceLast = this.getAgeInDays(sortedDoses[0].date, currentDate);
          const minInterval = 180; // 6 months
          
          if (daysSinceLast >= minInterval) {
            recommendation = 'Give Hepatitis A dose 2 now (final dose)';
            nextDoseDate = this.formatDate(currentDate);
          } else {
            const nextDate = this.addDays(sortedDoses[0].date, minInterval);
            recommendation = `Give Hepatitis A dose 2 on or after ${this.formatDate(nextDate)} (final dose)`;
            nextDoseDate = this.formatDate(nextDate);
          }
          notes.push('Minimum interval: 6 months between doses');
        } else {
          seriesComplete = true;
          recommendation = 'Hepatitis A series complete';
          notes.push('Two doses provide long-term protection');
        }
        break;

      default:
        recommendation = 'No specific recommendation; consult CDC guidelines';
        notes.push('Vaccine not in standard catch-up schedule or name not recognized');
    }

    // Display user-friendly vaccine names using centralized mapper
    const displayName = vaccineNameMapper.getAgeSpecificDisplay(normalizedName, currentAgeYears);

    // Get CDC rules for enhanced recommendations
    const cdcRules = getVaccineRules(normalizedName);
    if (cdcRules) {
      // Check for contraindications and precautions only if they actually apply
      const foundContraindications = checkContraindications(normalizedName, undefined, specialConditions);
      contraindications.push(...foundContraindications);
      
      // Don't add general precautions unless specifically relevant
      // precautions.push(...checkPrecautions(normalizedName));
      
      // Block vaccine if contraindications present
      if (contraindications.length > 0 && !seriesComplete) {
        recommendation = 'Do not give - contraindication present';
        decisionType = 'not-recommended';
        notes.unshift('⚠️ This vaccine is contraindicated for this patient');
        
        // Check if it's a specific contraindication like pregnancy
        if (normalizedName === 'mmr' || normalizedName === 'varicella') {
          if (specialConditions?.pregnancy) {
            notes.push('Live vaccines contraindicated during pregnancy');
          }
          if (specialConditions?.immunocompromised) {
            notes.push('Live vaccines contraindicated for immunocompromised patients');
          }
        }
      }
      
      // Get special situation modifications
      if (specialConditions) {
        const modifications = getSpecialSituationModifications(normalizedName, specialConditions);
        specialSituations.push(...modifications);
      }
      
      // Don't add generic CDC notes - they're now handled specifically in each vaccine case
      // Age-appropriate notes are generated dynamically based on patient's current situation
    }
    
    // Set decision type for COVID-19 based on age
    if (normalizedName === 'covid19' && currentAgeYears < 18) {
      decisionType = 'shared-clinical-decision';
      notes.unshift('Shared clinical decision-making recommended for ages 6 months-17 years');
    }

    return {
      vaccineName: displayName,
      recommendation,
      nextDoseDate,
      seriesComplete,
      notes,
      decisionType,
      contraindications: contraindications.length > 0 ? contraindications : undefined,
      precautions: precautions.length > 0 ? precautions : undefined,
      specialSituations: specialSituations.length > 0 ? specialSituations : undefined
    };
  }

  async generateCatchUpRecommendations(request: CatchUpRequest): Promise<CatchUpResult> {
    const birthDate = this.parseDate(request.birthDate);
    const currentDate = request.currentDate ? this.parseDate(request.currentDate) : new Date();
    const specialConditions = request.specialConditions || {};
    
    const patientAge = this.calculateAge(birthDate, currentDate);
    const recommendations: VaccineRecommendation[] = [];

    // Standard vaccine list for catch-up schedules
    const standardVaccines = [
      'HepB', 'Rotavirus', 'DTaP', 'Hib', 'PCV', 'IPV', 'COVID-19', 'Influenza', 
      'MMR', 'VAR', 'HepA', 'HPV', 'MenACWY', 'MenB'
    ];

    // Process each vaccine in the history
    const processedVaccines = new Set<string>();
    
    // First, combine vaccine histories that should be treated as the same series
    const combinedHistories = new Map<string, any>();
    
    for (const vaccineHistory of request.vaccineHistory) {
      const normalizedName = this.normalizeVaccineName(vaccineHistory.vaccineName);
      
      if (!combinedHistories.has(normalizedName)) {
        // Use age-appropriate vaccine name for DTaP/Tdap
        let appropriateVaccineName = vaccineHistory.vaccineName;
        if (normalizedName === 'dtap_tdap') {
          const ageInYears = this.getAgeInYears(birthDate, currentDate);
          appropriateVaccineName = ageInYears >= 7 ? 'Tdap' : 'DTaP';
        }
        
        combinedHistories.set(normalizedName, {
          vaccineName: appropriateVaccineName,
          doses: []
        });
      }
      
      // Add doses to the combined history
      const doses = vaccineHistory.doses.map(dose => ({
        date: this.parseDate(dose.date),
        product: dose.product
      }));
      
      combinedHistories.get(normalizedName).doses.push(...doses);
    }
    
    // Now process the combined histories
    for (const [normalizedName, history] of Array.from(combinedHistories)) {
      // Sort doses by date
      history.doses.sort((a: any, b: any) => a.date.getTime() - b.date.getTime());
      
      const recommendation = this.getVaccineRecommendation(
        history.vaccineName,
        birthDate,
        currentDate,
        history.doses,
        specialConditions,
        request.immunityEvidence
      );
      
      recommendations.push(recommendation);
      processedVaccines.add(normalizedName);
    }

    // Add recommendations for vaccines not in history
    for (const vaccine of standardVaccines) {
      const normalizedVaccine = this.normalizeVaccineName(vaccine);
      
      // Skip if already processed (including DTaP/Tdap which share the same normalized name)
      if (!processedVaccines.has(normalizedVaccine)) {
        const recommendation = this.getVaccineRecommendation(
          vaccine,
          birthDate,
          currentDate,
          [],
          specialConditions,
          request.immunityEvidence
        );
        
        // Only add if not a duplicate (check by vaccine name)
        const isDuplicate = recommendations.some(r => 
          this.normalizeVaccineName(r.vaccineName) === normalizedVaccine
        );
        
        if (!isDuplicate) {
          recommendations.push(recommendation);
        }
      }
    }

    return {
      patientAge,
      recommendations: recommendations.sort((a, b) => a.vaccineName.localeCompare(b.vaccineName)),
      cdcVersion: "2025.1",
      processedAt: new Date().toISOString()
    };
  }
}