import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema } from "@shared/schema";
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
        client_id: process.env.CLIENT_ID || "default_client_id",
        client_secret: process.env.CLIENT_SECRET || "default_client_secret",
        scope: "openid profile email"
      });

      // Call external authentication API
      const response = await fetch("https://ai.metqm.com/api/adminportal/get_agentlist_r1.cfm", {
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

      const authData = await response.json();
      
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

  const httpServer = createServer(app);
  return httpServer;
}
