import swaggerJSDoc from "swagger-jsdoc";
import { env } from "./utils/env";

export function buildSwaggerSpec() {
  return swaggerJSDoc({
    definition: {
      openapi: "3.0.0",
      info: { title: "Zorvyn Finance API", version: "1.0.0" },
      servers: [{ url: `http://localhost:${env.PORT}` }],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "JWT Bearer token for authentication",
          },
        },
      },
    },
    apis: ["src/routes/*.ts"],
  });
}

