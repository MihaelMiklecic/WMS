import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface JwtClaims {
  id: number;
  email: string;
  role: "admin" | "user";
  perms?: string[];
}

export interface AuthRequest extends Request {
  user?: JwtClaims;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }
  try {
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtClaims;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin only" });
  next();
}

export function requirePerm(perm: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role === "admin") return next();
    if (req.user.perms?.includes(perm)) return next();
    return res.status(403).json({ error: `Missing permission: ${perm}` });
  };
}
