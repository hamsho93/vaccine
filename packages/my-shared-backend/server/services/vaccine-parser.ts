import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { VaccineHistoryResult } from "../../shared/schema";
import { vaccineNameMapper } from "./vaccine-name-mapper";

// Use Claude 3 Haiku on AWS Bedrock for fast structured data extraction
// Haiku is 3-5x faster than Sonnet with comparable accuracy for parsing tasks
const bedrockClient = new BedrockRuntimeClient({ 
  region: process.env.AWS_REGION || "us-east-1"
});

// Use Claude 3 Haiku - optimized for speed while maintaining quality
const CLAUDE_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0";

export class VaccineParserService {
  async parseVaccineHistory(rawData: string, birthDate?: string): Promise<VaccineHistoryResult> {
    // Condensed prompt for faster parsing - keeps all functional requirements
    const currentDate = new Date().toISOString().split('T')[0];
    const prompt = `Parse this vaccine history into JSON. Birth date: ${birthDate || 'unknown'}.

Input:
${rawData}

Return JSON:
{"patientInfo":{"dateOfBirth":"${birthDate || 'YYYY-MM-DD'}","currentAge":"X years Y months","totalVaccines":N},"vaccines":[{"vaccineName":"full name","standardName":"CDC name","abbreviation":"abbrev","doses":[{"date":"YYYY-MM-DD","patientAge":"age"}],"seriesStatus":"Complete|Incomplete|Unknown"}],"processingNotes":["notes"],"cdcVersion":"2025.1","processedAt":"${new Date().toISOString()}"}

Rules: dates as YYYY-MM-DD, CDC nomenclature (DTaP, MMR, etc.), calculate current age from birth date as of ${currentDate}.`;

    try {
      // Prepare the request for Claude on Bedrock
      // max_tokens reduced to 2048 for faster response (sufficient for typical vaccine lists)
      const payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 2048,
        temperature: 0, // Low temperature for consistent parsing
        messages: [
          {
            role: "user",
            content: `Parse vaccine history. Respond with valid JSON only.\n\n${prompt}`
          }
        ]
      };

      const command = new InvokeModelCommand({
        modelId: CLAUDE_MODEL_ID,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(payload)
      });

      const response = await bedrockClient.send(command);
      
      // Parse the response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const content = responseBody.content?.[0]?.text;
      
      if (!content) {
        throw new Error("No response from AWS Bedrock");
      }

      // Extract JSON from the response (Claude might wrap it in markdown)
      let jsonText = content;
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonText);
      
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
