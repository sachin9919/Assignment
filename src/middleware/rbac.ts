import type { NextFunction, Request, Response } from "express";
import type { Role } from "../types/auth";

export function requireRoles(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role) {
      return res.status(401).json({ error: { message: "Missing auth user" } });
    }
    if (!allowed.includes(role)) {
      return res.status(403).json({ error: { message: "Forbidden: insufficient role" } });
    }
    return next();
  };
}

