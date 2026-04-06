import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "./httpError";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({ error: { message: err.message, details: err.details } });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
    });
  }
  if (err instanceof Error) {
    return res.status(400).json({ error: { message: err.message } });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ error: { message: "Internal server error" } });
}

