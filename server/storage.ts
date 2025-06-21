import { users, sessions, agents, type User, type InsertUser, type Session, type InsertSession, type Agent, type InsertAgent } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createSession(session: InsertSession): Promise<Session>;
  getSession(userId: number): Promise<Session | undefined>;
  deleteSession(userId: number): Promise<void>;
  getAgents(): Promise<Agent[]>;
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

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = this.currentAgentId++;
    const agent: Agent = { 
      ...insertAgent, 
      id, 
      createdAt: new Date() 
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
