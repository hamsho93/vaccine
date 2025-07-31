import { CatchUpRequest, CatchUpResult, VaccineRecommendation } from "@shared/schema";

interface VaccineDoseInfo {
  date: Date;
}

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

  private getVaccineRecommendation(
    vaccineName: string,
    birthDate: Date,
    currentDate: Date,
    doses: VaccineDoseInfo[]
  ): VaccineRecommendation {
    const sortedDoses = doses.sort((a, b) => a.date.getTime() - b.date.getTime());
    const numDoses = sortedDoses.length;
    const currentAgeDays = this.getAgeInDays(birthDate, currentDate);
    let recommendation = '';
    let nextDoseDate: string | undefined;
    let seriesComplete = false;
    const notes: string[] = [];

    switch (vaccineName.toLowerCase()) {
      case 'hepb':
      case 'hepatitis b':
        const hepBTotalDoses = 3;
        const hepBMinIntervals = [28, 56]; // 4 weeks, 8 weeks
        const hepBMinFinalAge = 168; // 24 weeks
        
        if (numDoses >= hepBTotalDoses) {
          recommendation = 'Series complete';
          seriesComplete = true;
        } else if (numDoses === 0) {
          if (currentAgeDays >= 0) {
            recommendation = 'Give dose 1 now';
          } else {
            recommendation = 'Wait until birth';
          }
        } else if (numDoses === 1) {
          const nextDate = this.addDays(sortedDoses[0].date, hepBMinIntervals[0]);
          if (currentDate >= nextDate) {
            recommendation = 'Give dose 2 now';
          } else {
            recommendation = `Give dose 2 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
        } else if (numDoses === 2) {
          const minFromDose2 = this.addDays(sortedDoses[1].date, hepBMinIntervals[1]);
          const minFromDose1 = this.addDays(sortedDoses[0].date, 112); // 16 weeks
          const minAge = this.addDays(birthDate, hepBMinFinalAge);
          const nextDate = new Date(Math.max(minFromDose2.getTime(), minFromDose1.getTime(), minAge.getTime()));
          
          if (currentDate >= nextDate) {
            recommendation = 'Give dose 3 now';
          } else {
            recommendation = `Give dose 3 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
        }
        break;

      case 'rotavirus':
        const rotaTotalDoses = 3;
        const rotaMinAge = 42; // 6 weeks
        const rotaMaxFirstAge = 105; // 14 weeks + 6 days
        const rotaMaxFinalAge = 240; // 8 months
        const rotaMinIntervals = [28, 28];
        
        if (currentAgeDays > rotaMaxFinalAge) {
          recommendation = 'Past max age for series; no more doses needed';
          seriesComplete = true;
        } else if (numDoses >= rotaTotalDoses) {
          recommendation = 'Series complete';
          seriesComplete = true;
        } else if (numDoses === 0) {
          if (currentAgeDays > rotaMaxFirstAge) {
            recommendation = 'Past max age for first dose; no series needed';
            seriesComplete = true;
          } else if (currentAgeDays >= rotaMinAge) {
            recommendation = 'Give dose 1 now';
          } else {
            const nextDate = this.addDays(birthDate, rotaMinAge);
            recommendation = `Give dose 1 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
        } else {
          const nextDate = this.addDays(sortedDoses[numDoses - 1].date, rotaMinIntervals[numDoses - 1]);
          if (currentDate >= nextDate && currentAgeDays <= rotaMaxFinalAge) {
            recommendation = `Give dose ${numDoses + 1} now`;
          } else if (currentAgeDays > rotaMaxFinalAge) {
            recommendation = 'Past max age for final dose; series incomplete but no more doses';
            seriesComplete = true;
          } else {
            recommendation = `Give dose ${numDoses + 1} on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
        }
        break;

      case 'dtap':
        const dtapTotalDoses = 5;
        const dtapMinAge = 42; // 6 weeks
        const dtapMinIntervals = [28, 28, 183, 183]; // 4w, 4w, 6m, 6m
        const dtapMinAge4 = 365 * 4; // 4 years for dose 4
        
        if (numDoses >= dtapTotalDoses) {
          recommendation = 'Series complete';
          seriesComplete = true;
        } else if (numDoses === 4) {
          const dose4Age = this.getAgeInDays(birthDate, sortedDoses[3].date);
          const intervalFromDose3 = this.getAgeInDays(sortedDoses[2].date, sortedDoses[3].date);
          
          if (dose4Age >= dtapMinAge4 && intervalFromDose3 >= 183) {
            recommendation = 'Series complete (no 5th dose needed)';
            seriesComplete = true;
          } else {
            const nextDate = this.addDays(sortedDoses[3].date, dtapMinIntervals[3]);
            if (currentDate >= nextDate) {
              recommendation = 'Give dose 5 now';
            } else {
              recommendation = `Give dose 5 on or after ${this.formatDate(nextDate)}`;
              nextDoseDate = this.formatDate(nextDate);
            }
          }
        } else {
          let nextDate: Date;
          if (numDoses === 0) {
            nextDate = this.addDays(birthDate, dtapMinAge);
          } else {
            nextDate = this.addDays(sortedDoses[numDoses - 1].date, dtapMinIntervals[numDoses - 1]);
          }
          
          if (currentDate >= nextDate) {
            recommendation = `Give dose ${numDoses + 1} now`;
          } else {
            recommendation = `Give dose ${numDoses + 1} on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
        }
        break;

      case 'hib':
        const hibMinAge = 42; // 6 weeks
        if (numDoses >= 4 || (numDoses >= 1 && currentAgeDays >= 450)) { // 15 months
          recommendation = 'Series complete';
          seriesComplete = true;
        } else if (numDoses === 0) {
          if (currentAgeDays >= hibMinAge) {
            recommendation = 'Give dose 1 now';
          } else {
            const nextDate = this.addDays(birthDate, hibMinAge);
            recommendation = `Give dose 1 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
        } else {
          const firstDoseAge = this.getAgeInDays(birthDate, sortedDoses[0].date);
          const interval = firstDoseAge < 365 ? 28 : 56;
          const nextDate = this.addDays(sortedDoses[numDoses - 1].date, interval);
          
          if (currentDate >= nextDate) {
            recommendation = 'Give next dose now (consult brand for total doses)';
          } else {
            recommendation = `Give next dose on or after ${this.formatDate(nextDate)} (consult brand for total doses)`;
            nextDoseDate = this.formatDate(nextDate);
          }
          notes.push('Specific schedule depends on vaccine brand and age at first dose');
        }
        break;

      case 'pcv':
      case 'pcv20':
      case 'pneumococcal':
        const pcvMinAge = 42; // 6 weeks
        if (numDoses >= 4 || (numDoses >= 1 && currentAgeDays >= 730)) { // 24 months
          recommendation = 'Series complete';
          seriesComplete = true;
        } else if (numDoses === 0) {
          if (currentAgeDays >= pcvMinAge) {
            recommendation = 'Give dose 1 now';
          } else {
            const nextDate = this.addDays(birthDate, pcvMinAge);
            recommendation = `Give dose 1 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
        } else {
          const interval = numDoses < 3 && currentAgeDays < 365 ? 28 : 56;
          const nextDate = this.addDays(sortedDoses[numDoses - 1].date, interval);
          
          if (currentDate >= nextDate) {
            recommendation = 'Give next dose now';
          } else {
            recommendation = `Give next dose on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
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
          recommendation = 'Series complete';
          seriesComplete = true;
        } else if (numDoses === 0) {
          if (currentAgeDays >= mmrMinAge) {
            recommendation = 'Give dose 1 now';
          } else {
            const nextDate = this.addDays(birthDate, mmrMinAge);
            recommendation = `Give dose 1 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
        } else {
          const nextDate = this.addDays(sortedDoses[0].date, mmrInterval);
          if (currentDate >= nextDate) {
            recommendation = 'Give dose 2 now';
          } else {
            recommendation = `Give dose 2 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
        }
        break;

      case 'var':
      case 'varicella':
        const varTotalDoses = 2;
        const varMinAge = 365; // 12 months
        const varInterval = currentAgeDays >= 4745 ? 28 : 84; // 13 yrs, 4 weeks vs 12 weeks
        
        if (numDoses >= varTotalDoses) {
          recommendation = 'Series complete';
          seriesComplete = true;
        } else if (numDoses === 0) {
          if (currentAgeDays >= varMinAge) {
            recommendation = 'Give dose 1 now';
          } else {
            const nextDate = this.addDays(birthDate, varMinAge);
            recommendation = `Give dose 1 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
        } else {
          const nextDate = this.addDays(sortedDoses[0].date, varInterval);
          if (currentDate >= nextDate) {
            recommendation = 'Give dose 2 now';
          } else {
            recommendation = `Give dose 2 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
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
        const hpvTotalDoses = currentAgeDays > 5475 ? 3 : 2; // 3 doses if started at 15+ years
        const hpvIntervals = [28, 152]; // 4w, 5m for 3-dose
        
        if (currentAgeDays > 9855) { // >27 years
          recommendation = 'Not routinely recommended after 26 years; discuss shared decision';
          notes.push('Consult CDC guidelines for adults >26 years');
        } else if (numDoses >= hpvTotalDoses) {
          recommendation = 'Series complete';
          seriesComplete = true;
        } else if (numDoses === 0) {
          if (currentAgeDays >= hpvMinAge) {
            recommendation = 'Give dose 1 now';
          } else {
            const nextDate = this.addDays(birthDate, hpvMinAge);
            recommendation = `Give dose 1 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
        } else {
          const nextDate = this.addDays(sortedDoses[numDoses - 1].date, hpvIntervals[numDoses - 1]);
          if (currentDate >= nextDate) {
            recommendation = `Give dose ${numDoses + 1} now`;
          } else {
            recommendation = `Give dose ${numDoses + 1} on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
        }
        break;

      case 'menacwy':
        const menACWYMinAge = 60; // 2 months for catch-up
        const menACWYInterval = 1825; // 5 years for second dose
        
        if (numDoses >= 2) {
          recommendation = 'Series complete; boosters if high-risk';
          seriesComplete = true;
          notes.push('Additional boosters may be needed for high-risk individuals');
        } else if (numDoses === 0) {
          recommendation = 'Give dose 1 now (preferred at 11-12 years)';
          notes.push('Preferred age is 11-12 years for routine immunization');
        } else {
          const nextDate = this.addDays(sortedDoses[0].date, menACWYInterval);
          if (currentDate >= nextDate) {
            recommendation = 'Give dose 2 now';
          } else {
            recommendation = `Give dose 2 on or after ${this.formatDate(nextDate)} (preferred at 16 years)`;
            nextDoseDate = this.formatDate(nextDate);
          }
        }
        break;

      case 'menb':
        const menBMinAge = 3650; // 10 years
        const menBTotalDoses = 2;
        const menBInterval = 183; // 6 months
        
        if (currentAgeDays < menBMinAge) {
          recommendation = 'Not recommended under 10 years unless high-risk';
          notes.push('Only recommended for high-risk individuals under 10 years');
        } else if (numDoses >= menBTotalDoses) {
          recommendation = 'Series complete';
          seriesComplete = true;
        } else if (numDoses === 0) {
          recommendation = 'Give dose 1 now (preferred at 16-18 years)';
          notes.push('Preferred age is 16-18 years');
        } else {
          const nextDate = this.addDays(sortedDoses[0].date, menBInterval);
          if (currentDate >= nextDate) {
            recommendation = 'Give dose 2 now';
          } else {
            recommendation = `Give dose 2 on or after ${this.formatDate(nextDate)}`;
            nextDoseDate = this.formatDate(nextDate);
          }
        }
        break;

      case 'covid-19':
        if (currentAgeDays < 183) { // <6 months
          recommendation = 'Not recommended under 6 months';
        } else if (numDoses >= 1) {
          recommendation = 'Series complete; annual update if eligible';
          seriesComplete = true;
          notes.push('Annual COVID-19 vaccination recommended with current formula');
        } else {
          recommendation = 'Give 1 or more doses of 2024-2025 vaccine now (see notes for exact number)';
          notes.push('Number of doses depends on age and previous vaccination history');
        }
        break;

      case 'influenza':
        recommendation = 'Give 1 dose annually if not given this season (or 2 if <9yrs and first time)';
        notes.push('Annual influenza vaccination recommended for all >6 months old');
        break;

      default:
        recommendation = 'No specific recommendation; consult CDC guidelines';
        notes.push('Vaccine not in standard catch-up schedule or name not recognized');
    }

    return {
      vaccineName,
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
      'MMR', 'VAR', 'HepA', 'Tdap', 'HPV', 'MenACWY', 'MenB'
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
      processedVaccines.add(vaccineHistory.vaccineName.toLowerCase());
    }

    // Add recommendations for vaccines not in history
    for (const vaccine of standardVaccines) {
      if (!processedVaccines.has(vaccine.toLowerCase())) {
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