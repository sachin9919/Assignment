import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse(req.body);
    req.body = parsed as any;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse(req.query);
    // Express v5 treats req.query as read-only at runtime; store validated data separately.
    (req as any).validatedQuery = parsed;
    next();
  };
}

