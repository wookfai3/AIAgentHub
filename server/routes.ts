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

      // For development/demo purposes, allow test credentials
      if (username === "testuser" && password === "password123") {
        // Create demo user session without calling external API
        let user = await storage.getUserByUsername(username);
        if (!user) {
          user = await storage.createUser({ username, password });
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await storage.createSession({
          userId: user.id,
          accessToken: "demo_token_" + Date.now(),
          refreshToken: null,
          expiresAt,
        });

        res.cookie("auth_token", "demo_token_" + Date.now(), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 24 * 60 * 60 * 1000,
        });

        return res.json({ 
          success: true, 
          message: "Login successful",
          user: { id: user.id, username: user.username }
        });
      }

      // Prepare form data for external API
      const formData = new URLSearchParams({
        grant_type: "password",
        username,
        password,
        client_id: process.env.CLIENT_ID || "mywebclient",
        client_secret: process.env.CLIENT_SECRET || "mysecretclientpassword",
        scope: "openid profile email"
      });

      // Call external authentication API
      const response = await fetch("https://ai.metqm.com/api/adminportal/get_accesstoken.cfm", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

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
          message: "Authentication server returned invalid response format. Try demo credentials: testuser/password123" 
        });
      }
      
      if (!authData.access_token) {
        return res.status(401).json({ 
          message: "Authentication failed. Invalid response from server." 
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
        accessToken: authData.access_token,
        refreshToken: authData.refresh_token || null,
        expiresAt,
      });

      // Set secure HTTP-only cookie
      res.cookie("auth_token", authData.access_token, {
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

      // For demo tokens, return local data
      if (token.startsWith("demo_token_")) {
        const agents = await storage.getAgents();
        return res.json(agents);
      }

      // Call external API to get agent list with real token
      try {
        const response = await fetch("https://ai.metqm.com/api/adminportal/get_agentlist_r1.cfm", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          console.error("External API error:", response.status, response.statusText);
          // Fallback to local storage if external API fails
          const agents = await storage.getAgents();
          return res.json(agents);
        }

        const agents = await response.json();
        res.json(agents);
      } catch (apiError) {
        console.error("External API call failed:", apiError);
        // Fallback to local storage
        const agents = await storage.getAgents();
        res.json(agents);
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
      const agent = await storage.createAgent(agentData);
      res.status(201).json(agent);

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
  app.put("/api/agents/:id", async (req, res) => {
    try {
      const token = req.cookies?.auth_token;
      
      if (!token) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const agentId = parseInt(req.params.id);
      const updateData = insertAgentSchema.partial().parse(req.body);
      
      const updatedAgent = await storage.updateAgent(agentId, updateData);
      
      if (!updatedAgent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      res.json(updatedAgent);

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
