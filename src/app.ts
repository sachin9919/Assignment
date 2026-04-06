import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { buildSwaggerSpec } from "./swagger";
import swaggerUi from "swagger-ui-express";

import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { recordsRouter } from "./routes/records";
import { dashboardRouter } from "./routes/dashboard";

import { errorHandler } from "./utils/errorHandler";
import type { Request, Response } from "express";

export function createApp() {
  const app = express();

  // Default Helmet CSP blocks Swagger UI inline scripts/styles — response body won't show after Execute.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  const swaggerSpec = buildSwaggerSpec();
  app.get("/openapi.json", (_req: Request, res: Response) => {
    return res.json(swaggerSpec);
  });

  const publicDir = path.join(process.cwd(), "public");
  app.use(express.static(publicDir));

  // Bundled Swagger UI (may render blank in some browsers); use /index.html or /swagger.html as fallback.
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // GET / is served by express.static as public/index.html (simple tester).

  app.get("/health", (_req: Request, res: Response) => {
    return res.json({ ok: true });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/records", recordsRouter);
  app.use("/api/dashboard", dashboardRouter);

  // 404
  app.use((_req: Request, res: Response) => {
    return res.status(404).json({ error: { message: "Not found" } });
  });

  // Error handler
  app.use(errorHandler);

  return app;
}

