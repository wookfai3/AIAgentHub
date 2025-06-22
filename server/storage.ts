import { users, sessions, agents, type User, type InsertUser, type Session, type InsertSession, type Agent, type InsertAgent } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createSession(session: InsertSession): Promise<Session>;
  getSession(userId: number): Promise<Session | undefined>;
  deleteSession(userId: number): Promise<void>;
  getAgents(): Promise<Agent[]>;
  getAgent(id: number): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, agent: Partial<InsertAgent>): Promise<Agent | undefined>;
  deleteAgent(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<number, Session>;
  private agents: Map<number, Agent>;
  private currentUserId: number;
  private currentSessionId: number;
  private currentAgentId: number;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.agents = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
    this.currentAgentId = 1;
    
    // Add demo agents for testing
    this.seedDemoAgents();
  }

  private seedDemoAgents() {
    const demoAgents = [
      {
        prompt: "Customer Support Agent",
        description: "Handles customer inquiries and support tickets",
        first_message: "Hello! I'm here to help you with any questions or issues you may have.",
        created_by: "admin",
      },
      {
        prompt: "Sales Assistant",
        description: "Helps with product information and sales inquiries",
        first_message: "Hi there! I can help you find the perfect product for your needs.",
        created_by: "admin",
      },
      {
        prompt: "Technical Support",
        description: "Provides technical assistance and troubleshooting",
        first_message: "Welcome! I'm here to help resolve any technical issues you're experiencing.",
        created_by: "admin",
      }
    ];

    demoAgents.forEach(agentData => {
      const id = this.currentAgentId++;
      const agent: Agent = {
        ...agentData,
        id,
        externalId: null,
        created_at: new Date()
      };
      this.agents.set(id, agent);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = this.currentSessionId++;
    const session: Session = { 
      ...insertSession, 
      id, 
      refreshToken: insertSession.refreshToken || null,
      createdAt: new Date() 
    };
    this.sessions.set(insertSession.userId, session);
    return session;
  }

  async getSession(userId: number): Promise<Session | undefined> {
    return this.sessions.get(userId);
  }

  async deleteSession(userId: number): Promise<void> {
    this.sessions.delete(userId);
  }

  async getAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = this.currentAgentId++;
    const agent: Agent = { 
      ...insertAgent, 
      id, 
      externalId: insertAgent.externalId || null,
      created_at: new Date() 
    };
    this.agents.set(id, agent);
    return agent;
  }

  async updateAgent(id: number, updateData: Partial<InsertAgent>): Promise<Agent | undefined> {
    const existingAgent = this.agents.get(id);
    if (!existingAgent) return undefined;
    
    const updatedAgent: Agent = { ...existingAgent, ...updateData };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  async deleteAgent(id: number): Promise<void> {
    this.agents.delete(id);
  }
}

export const storage = new MemStorage();
