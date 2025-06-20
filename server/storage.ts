import { users, sessions, type User, type InsertUser, type Session, type InsertSession } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createSession(session: InsertSession): Promise<Session>;
  getSession(userId: number): Promise<Session | undefined>;
  deleteSession(userId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<number, Session>;
  private currentUserId: number;
  private currentSessionId: number;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
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
}

export const storage = new MemStorage();
