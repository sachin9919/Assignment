import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Optional: allow caller to specify which demo users to seed.
export const seedSchema = z
  .object({
    seedUsers: z
      .boolean()
      .optional()
      .describe("When true (default), create demo viewer/analyst/admin users."),
  })
  .optional();

