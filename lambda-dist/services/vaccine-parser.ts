import OpenAI from "openai";
import fetch from "node-fetch";
import { VaccineHistoryResult } from "@shared/schema";
import { vaccineNameMapper } from "./vaccine-name-mapper";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key",
  fetch: fetch as any
});

export class VaccineParserService {
  async parseVaccineHistory(rawData: string, birthDate?: string): Promise<VaccineHistoryResult> {
    const prompt = `You are a medical AI assistant specializing in parsing vaccine history data. Parse the following unstructured vaccine history text and return structured data in JSON format.

The input contains vaccine information with dates and patient ages. Parse each vaccine entry and extract:
1. Vaccine name (standardize to CDC nomenclature)
2. All administration dates
3. Patient age at each dose
4. Determine series completion status based on typical vaccine schedules

Input text:
${rawData}

Please return a JSON object with this exact structure:
{
  "patientInfo": {
    "dateOfBirth": "${birthDate || 'YYYY-MM-DD or null if cannot determine'}",
    "currentAge": "readable age string calculated from birth date",
    "totalVaccines": number_of_vaccine_types
  },
  "vaccines": [
    {
      "vaccineName": "full vaccine name",
      "standardName": "CDC standard name",
      "abbreviation": "common abbreviation if applicable",
      "doses": [
        {
          "date": "YYYY-MM-DD",
          "patientAge": "readable age string"
        }
      ],
      "seriesStatus": "Complete|Incomplete|Unknown"
    }
  ],
  "processingNotes": [
    "list of any processing notes, standardizations made, or issues encountered"
  ],
  "cdcVersion": "2025.1",
  "processedAt": "${new Date().toISOString()}"
}

Important parsing rules:
- Convert all dates to YYYY-MM-DD format
- Standardize vaccine names to CDC nomenclature (e.g., "DTaP" for diphtheria/tetanus/pertussis)
- Extract age information in readable format (e.g., "3 months", "4 years")
- Determine series status based on standard vaccine schedules
${birthDate ? `- Use the provided birth date: ${birthDate}` : '- If birth date can be calculated from first vaccine and age, include it'}
- Calculate the current age from birth date (as of ${new Date().toISOString().split('T')[0]})
- Add processing notes for any ambiguities or assumptions made`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a medical AI assistant that parses vaccine history data. Always respond with valid JSON in the exact format requested."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1, // Low temperature for consistent parsing
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      const parsed = JSON.parse(content);
      
      // Normalize vaccine names using centralized mapper
      if (parsed.vaccines) {
        parsed.vaccines = parsed.vaccines.map((vaccine: any) => {
          const internalCode = vaccineNameMapper.toInternal(vaccine.vaccineName || vaccine.standardName);
          const mapping = vaccineNameMapper.getMapping(internalCode);
          
          return {
            ...vaccine,
            vaccineName: vaccine.vaccineName || mapping?.standardName || vaccine.standardName,
            standardName: mapping?.standardName || vaccine.standardName,
            abbreviation: vaccine.abbreviation || (mapping?.abbreviations[0] || '')
          };
        });
      }
      
      // Validate the structure matches our schema
      const result = VaccineHistoryResult.parse(parsed);
      
      // Ensure timestamp is properly formatted
      result.processedAt = new Date().toISOString();
      result.cdcVersion = "2025.1";
      
      return result;

    } catch (error) {
      console.error("Error parsing vaccine history:", error);
      throw new Error(`Failed to parse vaccine history: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
