import type { JwtUser } from "./auth";

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Request {
      user?: JwtUser;
    }
  }
}

export {};

