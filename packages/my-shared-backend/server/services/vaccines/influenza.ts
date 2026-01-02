import { VaccineDoseInfo, getAgeInMonths, getAgeInYears, addDays, formatDate } from '../vaccine-catchup';
import type { VaccineRecommendation } from '../../../shared/schema';
import { SpecialConditions } from '../vaccine-cdc-rules';

export function influenzaRecommendation(
  normalizedName: string,
  birthDate: Date,
  currentDate: Date,
  validDoses: VaccineDoseInfo[],
  numDoses: number,
  sortedDoses: VaccineDoseInfo[],
  specialConditions: SpecialConditions,
  immunityEvidence: any
): VaccineRecommendation {
  const doses = validDoses;
  let seriesComplete = false;
  let recommendation = '';
  let nextDoseDate: string | undefined = undefined;
  const notes: string[] = [];
  const getCurrentSeason = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return month >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
  };
  const currentSeason = getCurrentSeason(currentDate);
  const dosesThisSeason = doses.filter(dose => getCurrentSeason(dose.date) === currentSeason).length;
  const currentAgeMonths = getAgeInMonths(birthDate, currentDate);
  const currentAgeYears = getAgeInYears(birthDate, currentDate);
  if (currentAgeMonths < 6) {
    recommendation = 'Influenza vaccine not recommended under 6 months';
    notes.push('Minimum age: 6 months');
    // Set next dose date for when child turns 6 months
    const sixMonthsDate = addDays(birthDate, 6 * 30.44);
    nextDoseDate = formatDate(sixMonthsDate);
  } else if (dosesThisSeason > 0) {
    recommendation = 'Influenza vaccine for current season already received';
    seriesComplete = true;
    notes.push(`Current season (${currentSeason}) dose complete`);
  } else {
    if (currentAgeYears < 9) {
      const totalLifetimeDoses = doses.length;
      if (totalLifetimeDoses < 2) {
        if (dosesThisSeason === 0) {
          recommendation = 'Give first influenza dose of season now';
          notes.push('First-time recipients <9 years need 2 doses, 4 weeks apart');
        } else if (dosesThisSeason === 1) {
          // Calculate next dose date (4 weeks after first dose of season)
          const firstDoseThisSeason = doses.find(dose => getCurrentSeason(dose.date) === currentSeason);
          if (firstDoseThisSeason) {
            const nextDate = addDays(firstDoseThisSeason.date, 28);
            if (currentDate >= nextDate) {
              recommendation = 'Give second influenza dose now';
            } else {
              recommendation = `Give second influenza dose on or after ${formatDate(nextDate)}`;
              nextDoseDate = formatDate(nextDate);
            }
            notes.push('Second dose needed 4 weeks after first dose');
          }
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
  return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
} 