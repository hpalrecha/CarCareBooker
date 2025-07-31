import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { storage } from "../storage";

declare global {
  namespace Express {
    interface Session {
      adminId?: string;
    }
  }
}

export async function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.session.adminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const admin = await storage.getAdmin(req.session.adminId);
    if (!admin) {
      req.session.adminId = undefined;
      return res.status(401).json({ message: "Unauthorized" });
    }

    (req as any).admin = admin;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
