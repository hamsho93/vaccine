import type { Express } from "express";
import { createServer, type Server } from "http";
import { VaccineParserService } from "./services/vaccine-parser";
import { VaccineCatchUpService } from "./services/vaccine-catchup";
import { ParseVaccineHistoryRequest, CatchUpRequest } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const vaccineParser = new VaccineParserService();
  const vaccineCatchUp = new VaccineCatchUpService();

  // Parse vaccine history endpoint
  app.post("/api/parse-vaccine-history", async (req, res) => {
    try {
      // Validate request body
      const validatedData = ParseVaccineHistoryRequest.parse(req.body);
      
      // Parse the vaccine data using OpenAI
      const result = await vaccineParser.parseVaccineHistory(validatedData.vaccineData);
      
      res.json(result);
    } catch (error) {
      console.error("Error in parse-vaccine-history:", error);
      
      if (error instanceof Error) {
        res.status(400).json({ 
          message: error.message,
          type: "parsing_error"
        });
      } else {
        res.status(500).json({ 
          message: "Internal server error",
          type: "server_error"
        });
      }
    }
  });

  // Catch-up recommendations endpoint
  app.post("/api/vaccine-catchup", async (req, res) => {
    try {
      // Validate request body
      const validatedData = CatchUpRequest.parse(req.body);
      
      // Generate catch-up recommendations
      const result = await vaccineCatchUp.generateCatchUpRecommendations(validatedData);
      
      res.json(result);
    } catch (error) {
      console.error("Error in vaccine-catchup:", error);
      
      if (error instanceof Error) {
        res.status(400).json({ 
          message: error.message,
          type: "catchup_error"
        });
      } else {
        res.status(500).json({ 
          message: "Internal server error",
          type: "server_error"
        });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
