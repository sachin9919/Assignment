import path from "path";

export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  JWT_SECRET: process.env.JWT_SECRET ?? "dev-secret-change-me",
  DATA_FILE: process.env.DATA_FILE ?? path.join(process.cwd(), "data", "db.json"),
};

