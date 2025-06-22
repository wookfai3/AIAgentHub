import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertAgentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);

      // Prepare form data for external API
      const formData = new URLSearchParams({
        grant_type: "password",
        username,
        password,
        client_id: process.env.CLIENT_ID || "mywebclient",
        client_secret: process.env.CLIENT_SECRET || "mysecretclientpassword",
        scope: "openid profile email"
      });

      console.log("Calling external API with form data:", formData.toString());

      // Call external authentication API
      const response = await fetch("https://ai.metqm.com/api/adminportal/get_accesstoken.cfm", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      console.log("API Response status:", response.status, response.statusText);

      if (!response.ok) {
        return res.status(401).json({ 
          message: "Authentication failed. Please check your credentials." 
        });
      }

      const responseText = await response.text();
      console.log("API Response:", responseText);
      
      let authData;
      try {
        authData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error("Response text:", responseText);
        return res.status(401).json({ 
          message: "Authentication server returned invalid response format." 
        });
      }
      
      // Check for access token in the nested data structure
      const accessToken = authData.data?.accessToken || authData.access_token;
      const refreshToken = authData.data?.refreshToken || authData.refresh_token;
      
      if (!accessToken) {
        return res.status(401).json({ 
          message: "Authentication failed. No access token received." 
        });
      }

      // Create or get user
      let user = await storage.getUserByUsername(username);
      if (!user) {
        user = await storage.createUser({ username, password });
      }

      // Create session
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

      await storage.createSession({
        userId: user.id,
        accessToken: accessToken,
        refreshToken: refreshToken || null,
        expiresAt,
      });

      // Set secure HTTP-only cookie
      res.cookie("auth_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.json({ 
        success: true, 
        message: "Login successful",
        user: { id: user.id, username: user.username }
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }

      console.error("Login error:", error);
      res.status(500).json({ 
        message: "Internal server error. Please try again later." 
      });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req, res) => {
    try {
      res.clearCookie("auth_token");
      res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Error during logout" });
    }
  });

  // Check authentication status
  app.get("/api/auth/me", async (req, res) => {
    try {
      const token = req.cookies?.auth_token;
      
      if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Here you could validate the token with the external API if needed
      res.json({ authenticated: true });
      
    } catch (error) {
      console.error("Auth check error:", error);
      res.status(500).json({ message: "Error checking authentication" });
    }
  });

  // Agent management endpoints
  
  // Get all agents - calls external API with auth token
  app.get("/api/agents", async (req, res) => {
    try {
      const token = req.cookies?.auth_token;
      
      if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Call external API to get agent list with auth token
      try {
        const response = await fetch("https://ai.metqm.com/api/adminportal/get_agentlist_r1.cfm", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error("External API error:", response.status, response.statusText);
          return res.status(response.status).json({ 
            message: "Failed to fetch agents from API" 
          });
        }

        const agents = await response.json();
        res.json(agents);
      } catch (apiError) {
        console.error("External API call failed:", apiError);
        res.status(500).json({ message: "Error connecting to agent API" });
      }

    } catch (error) {
      console.error("Get agents error:", error);
      res.status(500).json({ message: "Error fetching agents" });
    }
  });

  // Create new agent
  app.post("/api/agents", async (req, res) => {
    try {
      const token = req.cookies?.auth_token;
      
      if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const agentData = insertAgentSchema.parse(req.body);
      
      // Prepare form data for external API
      const formData = new URLSearchParams({
        prompt: agentData.name,
        first_message: agentData.firstMessage,
        descp: agentData.description
      });

      console.log("Creating agent with external API, form data:", formData.toString());

      // Call external API to create agent
      const response = await fetch("https://ai.metqm.com/api/adminportal/put_addagent.cfm", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      console.log("External API Response status:", response.status);
      
      if (!response.ok) {
        console.error("External API error:", response.status, response.statusText);
        return res.status(response.status).json({ 
          message: "Failed to create agent via external API" 
        });
      }

      const apiResult = await response.json();
      console.log("External API Response:", apiResult);

      if (!apiResult.success) {
        return res.status(400).json({ 
          message: apiResult.error || "Failed to create agent" 
        });
      }

      // Store the agent locally with the external API data
      const createdAgent = await storage.createAgent({
        name: agentData.name,
        description: agentData.description,
        firstMessage: agentData.firstMessage,
        createdBy: agentData.createdBy,
        externalId: apiResult.data.id.toString() // Store the external ID
      });

      res.status(201).json({ 
        success: true, 
        agent: createdAgent,
        externalData: apiResult.data 
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }

      console.error("Create agent error:", error);
      res.status(500).json({ message: "Error creating agent" });
    }
  });

  // Update agent
  app.patch("/api/agents/:id", async (req, res) => {
    try {
      const token = req.cookies?.auth_token;
      
      if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const agentId = parseInt(req.params.id);
      const updateData = insertAgentSchema.partial().parse(req.body);
      
      // Get the existing agent first without updating
      const existingAgent = await storage.getAgent(agentId);
      
      if (!existingAgent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      // Use the stored external ID or fall back to local ID if no external ID exists
      const externalAgentId = existingAgent.externalId || agentId.toString();
      
      // Prepare form data for external API using either updated values or existing ones
      const formData = new URLSearchParams({
        id: externalAgentId,
        prompt: updateData.name || existingAgent.name,
        first_message: updateData.firstMessage || existingAgent.firstMessage,
        descp: updateData.description || existingAgent.description
      });

      console.log("=== UPDATING AGENT ===");
      console.log("Agent ID:", agentId);
      console.log("Update Data:", updateData);
      console.log("Existing Agent:", existingAgent);

      console.log("=== CALLING EXTERNAL UPDATE API ===");
      console.log("URL: https://ai.metqm.com/api/adminportal/put_editagent.cfm");
      console.log("Form data:", formData.toString());
      console.log("Token:", token ? `${token.substring(0, 10)}...` : "No token");

      // Call external API to update agent
      const response = await fetch("https://ai.metqm.com/api/adminportal/put_editagent.cfm", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      console.log("=== EXTERNAL API RESPONSE ===");
      console.log("Status:", response.status);
      console.log("Status Text:", response.statusText);
      
      const responseText = await response.text();
      console.log("Raw Response:", responseText);
      
      if (!response.ok) {
        console.error("External API HTTP error:", response.status, response.statusText);
        return res.status(response.status).json({ 
          message: `Failed to update agent via external API: ${response.status} ${response.statusText}` 
        });
      }

      let apiResult;
      try {
        apiResult = JSON.parse(responseText);
        console.log("Parsed API Result:", apiResult);
      } catch (parseError) {
        console.error("Failed to parse API response:", parseError);
        console.error("Response text:", responseText);
        return res.status(500).json({ 
          message: "External API returned invalid JSON response" 
        });
      }

      if (!apiResult.success) {
        console.error("External API returned success: false", apiResult);
        return res.status(400).json({ 
          message: apiResult.error || "Failed to update agent" 
        });
      }

      // Update local storage after successful external API call
      const updatedLocalAgent = await storage.updateAgent(agentId, updateData);

      res.json({ 
        success: true, 
        agent: updatedLocalAgent,
        externalData: apiResult.data 
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }

      console.error("Update agent error:", error);
      res.status(500).json({ message: "Error updating agent" });
    }
  });

  // Delete agent
  app.delete("/api/agents/:id", async (req, res) => {
    try {
      const token = req.cookies?.auth_token;
      
      if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const agentId = parseInt(req.params.id);
      await storage.deleteAgent(agentId);
      
      res.json({ success: true, message: "Agent deleted successfully" });

    } catch (error) {
      console.error("Delete agent error:", error);
      res.status(500).json({ message: "Error deleting agent" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
