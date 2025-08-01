import { CatchUpRequest, CatchUpResult, VaccineRecommendation } from "@shared/schema";
import { vaccineNameMapper } from "./vaccine-name-mapper";

interface VaccineDoseInfo {
  date: Date;
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

  private getVaccineRecommendation(
    vaccineName: string,
    birthDate: Date,
    currentDate: Date,
    doses: VaccineDoseInfo[]
  ): VaccineRecommendation {
    const normalizedName = this.normalizeVaccineName(vaccineName);
    const sortedDoses = doses.sort((a, b) => a.date.getTime() - b.date.getTime());
    const numDoses = sortedDoses.length;
    const currentAgeDays = this.getAgeInDays(birthDate, currentDate);
    const currentAgeMonths = this.getAgeInMonths(birthDate, currentDate);
    const currentAgeYears = this.getAgeInYears(birthDate, currentDate);
    
    let recommendation = '';
    let nextDoseDate: string | undefined;
    let seriesComplete = false;
    const notes: string[] = [];

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
        if (currentAgeMonths > 8) {
          recommendation = 'Past maximum age (8 months) for rotavirus series';
          seriesComplete = true;
          notes.push('Rotavirus vaccine not recommended after 8 months of age');
        } else if (numDoses >= 3) {
          recommendation = 'Rotavirus series complete';
          seriesComplete = true;
        } else if (numDoses >= 2 && currentAgeMonths >= 6) {
          // Some brands only need 2 doses
          recommendation = 'Rotavirus series may be complete (depends on vaccine brand)';
          seriesComplete = true;
          notes.push('RotaTeq requires 3 doses, Rotarix requires 2 doses');
        } else if (numDoses === 0) {
          if (currentAgeMonths > 3.5) { // 14 weeks + 6 days
            recommendation = 'Past maximum age for first rotavirus dose';
            seriesComplete = true;
            notes.push('First dose must be given by 14 weeks 6 days of age');
          } else if (currentAgeMonths >= 1.5) { // 6 weeks
            recommendation = 'Give rotavirus dose 1 now';
            notes.push('Minimum age: 6 weeks');
          } else {
            const nextDate = this.addDays(birthDate, 42); // 6 weeks
            recommendation = `Give rotavirus dose 1 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
            notes.push('Wait until 6 weeks of age');
          }
        } else {
          const nextDate = this.addDays(sortedDoses[numDoses - 1].date, 28); // 4 weeks minimum
          if (currentDate >= nextDate && currentAgeMonths <= 8) {
            recommendation = `Give rotavirus dose ${numDoses + 1} now`;
            if (numDoses === 2) {
              notes.push('This may be the final dose depending on vaccine brand');
            }
          } else if (currentAgeMonths > 8) {
            recommendation = 'Past maximum age for rotavirus; series incomplete';
            seriesComplete = true;
          } else {
            recommendation = `Give rotavirus dose ${numDoses + 1} on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
            notes.push('Minimum 4 weeks between doses');
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
        if (currentAgeYears >= 5) {
          recommendation = 'HIB vaccine not routinely recommended after 5 years';
          seriesComplete = true;
          notes.push('HIB vaccine generally not needed for healthy children 5 years and older');
        } else if (numDoses >= 4) {
          recommendation = 'HIB series complete';
          seriesComplete = true;
        } else if (currentAgeMonths >= 15 && numDoses >= 1) {
          recommendation = 'HIB series may be complete (depends on vaccine brand and timing)';
          seriesComplete = true;
          notes.push('Children who received at least 1 dose after 15 months may not need additional doses');
        } else if (numDoses === 0) {
          if (currentAgeMonths >= 1.5) { // 6 weeks
            recommendation = 'Give HIB dose 1 now';
          } else {
            const nextDate = this.addDays(birthDate, 42); // 6 weeks
            recommendation = `Give HIB dose 1 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
          notes.push('Minimum age: 6 weeks');
        } else {
          const firstDoseAgeMonths = this.getAgeInMonths(birthDate, sortedDoses[0].date);
          let interval = 28; // 4 weeks default
          
          // Adjust interval based on age at first dose
          if (firstDoseAgeMonths >= 12) {
            interval = 56; // 8 weeks if first dose at 12+ months
          }
          
          const nextDate = this.addDays(sortedDoses[numDoses - 1].date, interval);
          if (currentDate >= nextDate) {
            recommendation = `Give HIB dose ${numDoses + 1} now`;
          } else {
            recommendation = `Give HIB dose ${numDoses + 1} on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
          
          notes.push('Schedule varies by vaccine brand (ActHIB/Hiberix vs PedvaxHIB)');
          if (numDoses === 3 && currentAgeMonths >= 12) {
            notes.push('Final booster dose at 12-15 months');
          }
        }
        break;

      case 'pneumococcal':
        if (currentAgeYears >= 5 && numDoses >= 1) {
          recommendation = 'Pneumococcal series complete (healthy children)';
          seriesComplete = true;
          notes.push('Additional doses may be needed for high-risk conditions');
        } else if (numDoses >= 4) {
          recommendation = 'Pneumococcal (PCV) series complete';
          seriesComplete = true;
        } else if (currentAgeMonths >= 24 && numDoses >= 1) {
          recommendation = 'Pneumococcal series may be complete (depends on timing)';
          seriesComplete = true;
          notes.push('Children who received doses after 24 months may not need additional PCV doses');
        } else if (numDoses === 0) {
          if (currentAgeMonths >= 1.5) { // 6 weeks
            recommendation = 'Give pneumococcal (PCV) dose 1 now';
            notes.push('Schedule: Doses at 2, 4, 6, and 12-15 months (4-dose series)');
          } else {
            const nextDate = this.addDays(birthDate, 42); // 6 weeks
            recommendation = `Give pneumococcal (PCV) dose 1 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
            notes.push('Minimum age: 6 weeks');
          }
          notes.push('Use PCV15 or PCV20; routine schedule at 2, 4, 6, 12-15 months');
        } else {
          let interval = 28; // 4 weeks for doses 1-3 under 12 months
          
          if (numDoses >= 3 || currentAgeMonths >= 12) {
            interval = 56; // 8 weeks for booster or if over 12 months
          }
          
          const nextDate = this.addDays(sortedDoses[numDoses - 1].date, interval);
          if (currentDate >= nextDate) {
            recommendation = `Give pneumococcal (PCV) dose ${numDoses + 1} now`;
          } else {
            recommendation = `Give pneumococcal (PCV) dose ${numDoses + 1} on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
          
          if (numDoses < 3) {
            notes.push('Primary series: minimum 4 weeks between doses if <12 months old');
          } else if (numDoses === 3 && currentAgeMonths >= 12) {
            notes.push('Final booster: minimum 8 weeks after dose 3, given at 12-15 months');
          }
        }
        break;

      case 'ipv':
      case 'polio':
        const ipvTotalDoses = 4;
        const ipvMinAge = 42; // 6 weeks
        const ipvMinIntervals = [28, 28, 183]; // 4w, 4w, 6m for dose 3-4 if >4yrs
        
        if (numDoses >= ipvTotalDoses) {
          recommendation = 'Series complete';
          seriesComplete = true;
        } else if (numDoses === 0) {
          if (currentAgeDays >= ipvMinAge) {
            recommendation = 'Give dose 1 now';
          } else {
            const nextDate = this.addDays(birthDate, ipvMinAge);
            recommendation = `Give dose 1 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
        } else {
          const interval = numDoses < 3 ? ipvMinIntervals[numDoses - 1] : 
                          (currentAgeDays >= 1460 ? 183 : 28); // 4 years
          const nextDate = this.addDays(sortedDoses[numDoses - 1].date, interval);
          
          if (currentDate >= nextDate) {
            recommendation = 'Give next dose now';
          } else {
            recommendation = `Give next dose on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
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
        const varTotalDoses = 2;
        const varMinAge = 365; // 12 months
        const varInterval = currentAgeDays >= 4745 ? 28 : 84; // 13 yrs, 4 weeks vs 12 weeks
        
        if (numDoses >= varTotalDoses) {
          recommendation = 'Varicella series complete';
          seriesComplete = true;
          notes.push('Two doses provide excellent protection against chickenpox');
        } else if (numDoses === 0) {
          if (currentAgeDays >= varMinAge) {
            recommendation = 'Give varicella dose 1 now';
            if (currentAgeYears >= 13) {
              notes.push('Schedule for ≥13 years: Dose 1 → 4 weeks → Dose 2');
            } else {
              notes.push('Schedule for <13 years: Dose 1 → 3 months → Dose 2');
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
          if (currentAgeYears >= 13) {
            notes.push('Minimum interval for ≥13 years: 4 weeks between doses');
          } else {
            notes.push('Minimum interval for <13 years: 3 months between doses');
          }
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
              notes.push('2-dose schedule: Dose 1 → 6-12 months → Dose 2');
            } else {
              notes.push('3-dose schedule (≥15 years): Dose 1 → 1-2 months → Dose 2 → 6 months → Dose 3');
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
            // 2-dose schedule: 6-12 months after dose 1
            const nextDate = this.addDays(sortedDoses[0].date, 183); // 6 months
            if (currentDate >= nextDate) {
              recommendation = 'Give HPV dose 2 now (final dose)';
            } else {
              recommendation = `Give HPV dose 2 on or after ${this.formatDate(nextDate)} (final dose)`;
              nextDoseDate = this.formatDate(nextDate);
            }
            notes.push('2-dose schedule: 6-12 months between doses');
          }
        } else if (numDoses === 2 && isOlderStart) {
          // Final dose for 3-dose schedule: 6 months after dose 1
          const nextDate = this.addDays(sortedDoses[0].date, 183); // 6 months from dose 1
          if (currentDate >= nextDate) {
            recommendation = 'Give HPV dose 3 now (final dose)';
          } else {
            recommendation = `Give HPV dose 3 on or after ${this.formatDate(nextDate)} (final dose)`;
            nextDoseDate = this.formatDate(nextDate);
          }
          notes.push('Final dose: minimum 6 months after dose 1');
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
            // Only show routine guidance if patient is close to routine age
            if (currentAgeYears <= 13) {
              notes.push('Routine immunization at 11-12 years');
            } else {
              notes.push('Catch-up vaccination for missed MenACWY dose');
            }
          } else if (numDoses === 1) {
            if (currentAgeYears >= 16) {
              recommendation = 'Give MenACWY dose 2 now (booster)';
            } else {
              const boosterDate = this.addDays(birthDate, 16 * 365);
              recommendation = `Give MenACWY booster on or after ${this.formatDate(boosterDate)}`;
              nextDoseDate = this.formatDate(boosterDate);
            }
            notes.push('Booster dose at 16 years');
          }
        } else if (currentAgeMonths >= 2) {
          recommendation = 'MenACWY available for high-risk children';
          notes.push('Routine vaccination begins at 11-12 years');
          notes.push('May be given to high-risk children as early as 2 months');
        } else {
          recommendation = 'MenACWY not recommended under 2 months';
          notes.push('Routine vaccination begins at 11-12 years');
        }
        break;

      case 'meningococcal_b':
        if (currentAgeYears >= 16 && currentAgeYears <= 23) {
          if (numDoses >= 2) {
            recommendation = 'MenB series complete';
            seriesComplete = true;
          } else if (numDoses === 0) {
            recommendation = 'Give MenB dose 1 now (preferred at 16-18 years)';
            notes.push('Category B recommendation: individual clinical decision');
          } else if (numDoses === 1) {
            const nextDate = this.addDays(sortedDoses[0].date, 183); // 6 months
            if (currentDate >= nextDate) {
              recommendation = 'Give MenB dose 2 now';
            } else {
              recommendation = `Give MenB dose 2 on or after ${this.formatDate(nextDate)}`;
              nextDoseDate = this.formatDate(nextDate);
            }
            notes.push('Minimum 6 months between doses');
          }
        } else if (currentAgeYears >= 10) {
          recommendation = 'MenB available for high-risk individuals';
          // Only show routine guidance if patient is close to routine age
          if (currentAgeYears <= 18) {
            notes.push('Routine vaccination preferred at 16-18 years');
          } else {
            notes.push('MenB vaccination generally not recommended after age 23');
          }
          notes.push('May be given to high-risk individuals ≥10 years');
        } else {
          recommendation = 'MenB not routinely recommended under 10 years';
          notes.push('May be considered for high-risk children');
        }
        break;

      case 'covid19':
        if (currentAgeMonths < 6) {
          recommendation = 'COVID-19 vaccine not recommended under 6 months';
          notes.push('Minimum age: 6 months');
        } else {
          recommendation = 'Give COVID-19 vaccine per current CDC guidance';
          notes.push('COVID-19 vaccine recommendations update frequently - check current CDC guidance');
          notes.push('Consider patient age, previous vaccination history, and current circulating variants');
        }
        break;

      case 'influenza':
        if (currentAgeMonths < 6) {
          recommendation = 'Influenza vaccine not recommended under 6 months';
          notes.push('Minimum age: 6 months');
        } else {
          recommendation = 'Give annual influenza vaccine (current season)';
          notes.push('Annual influenza vaccination recommended for all ≥6 months');
          if (currentAgeYears < 9) {
            notes.push('Children <9 years may need 2 doses if first time receiving or incomplete previous season');
          }
        }
        break;

      default:
        recommendation = 'No specific recommendation; consult CDC guidelines';
        notes.push('Vaccine not in standard catch-up schedule or name not recognized');
    }

    // Display user-friendly vaccine names using centralized mapper
    const displayName = vaccineNameMapper.getAgeSpecificDisplay(normalizedName, currentAgeYears);

    return {
      vaccineName: displayName,
      recommendation,
      nextDoseDate,
      seriesComplete,
      notes
    };
  }

  async generateCatchUpRecommendations(request: CatchUpRequest): Promise<CatchUpResult> {
    const birthDate = this.parseDate(request.birthDate);
    const currentDate = request.currentDate ? this.parseDate(request.currentDate) : new Date();
    
    const patientAge = this.calculateAge(birthDate, currentDate);
    const recommendations: VaccineRecommendation[] = [];

    // Standard vaccine list for catch-up schedules
    const standardVaccines = [
      'HepB', 'Rotavirus', 'DTaP', 'Hib', 'PCV', 'IPV', 'COVID-19', 'Influenza', 
      'MMR', 'VAR', 'HepA', 'HPV', 'MenACWY', 'MenB'
    ];

    // Process each vaccine in the history
    const processedVaccines = new Set<string>();
    
    for (const vaccineHistory of request.vaccineHistory) {
      const doses = vaccineHistory.doses.map(dose => ({
        date: this.parseDate(dose.date)
      }));
      
      const recommendation = this.getVaccineRecommendation(
        vaccineHistory.vaccineName,
        birthDate,
        currentDate,
        doses
      );
      
      recommendations.push(recommendation);
      processedVaccines.add(this.normalizeVaccineName(vaccineHistory.vaccineName));
    }

    // Add recommendations for vaccines not in history
    for (const vaccine of standardVaccines) {
      const normalizedVaccine = this.normalizeVaccineName(vaccine);
      if (!processedVaccines.has(normalizedVaccine)) {
        const recommendation = this.getVaccineRecommendation(
          vaccine,
          birthDate,
          currentDate,
          []
        );
        recommendations.push(recommendation);
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