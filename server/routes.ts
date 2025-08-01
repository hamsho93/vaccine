import type { Express } from "express";
import { createServer, type Server } from "http";
import { VaccineParserService } from "./services/vaccine-parser";
import { VaccineCatchUpService } from "./services/vaccine-catchup";
import { storage } from "./storage";
import { ParseVaccineHistoryRequest, CatchUpRequest } from "@shared/schema";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  const vaccineParser = new VaccineParserService();
  const vaccineCatchUp = new VaccineCatchUpService();

  // Parse vaccine history endpoint
  app.post("/api/parse-vaccine-history", async (req, res) => {
    try {
      // Validate request body
      const validatedData = ParseVaccineHistoryRequest.parse(req.body);
      
      // Generate session ID for tracking
      const sessionId = req.headers['x-session-id'] as string || randomUUID();
      
      // Parse the vaccine data using OpenAI
      const result = await vaccineParser.parseVaccineHistory(
        validatedData.vaccineData,
        validatedData.ageYears,
        validatedData.ageMonths
      );
      
      // Save to database
      await storage.saveVaccineHistory(sessionId, validatedData.vaccineData, result);
      
      // Return result with session ID
      res.json({ ...result, sessionId });
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
      
      // Get session ID
      const sessionId = req.headers['x-session-id'] as string || randomUUID();
      
      // Generate catch-up recommendations
      const result = await vaccineCatchUp.generateCatchUpRecommendations(validatedData);
      
      // Get the related vaccine history record
      const historyRecord = await storage.getVaccineHistoryBySession(sessionId);
      
      // Save catch-up recommendations to database
      await storage.saveCatchUpRecommendations(sessionId, result, historyRecord?.id);
      
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

  // Get vaccine history by session
  app.get("/api/vaccine-history/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const record = await storage.getVaccineHistoryBySession(sessionId);
      
      if (!record) {
        return res.status(404).json({ message: "Vaccine history not found" });
      }
      
      res.json(record);
    } catch (error) {
      console.error("Error getting vaccine history:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get catch-up recommendations by session
  app.get("/api/catch-up-recommendations/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const record = await storage.getCatchUpRecommendationsBySession(sessionId);
      
      if (!record) {
        return res.status(404).json({ message: "Catch-up recommendations not found" });
      }
      
      res.json(record);
    } catch (error) {
      console.error("Error getting catch-up recommendations:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
