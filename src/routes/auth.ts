import { Router } from "express";
import { validateBody } from "../utils/validate";
import { loginSchema, seedSchema } from "../schemas/authSchemas";
import { asyncHandler } from "../utils/asyncHandler";
import { login, seedDemoUsers } from "../services/authService";
import { HttpError } from "../utils/httpError";

export const authRouter = Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login with email/password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: admin123
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *       401:
 *         description: Invalid credentials or inactive user
 */
authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const result = await login(email, password);
    if (!result) {
      throw new HttpError(401, "Invalid credentials or inactive user");
    }
    return res.json(result);
  }),
);

/**
 * @openapi
 * /api/auth/seed:
 *   post:
 *     summary: Seed demo users and return JWT tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seedUsers:
 *                 type: boolean
 *                 default: true
 *                 description: When true (default), create demo viewer/analyst/admin users
 *           example:
 *             seedUsers: true
 *     responses:
 *       200:
 *         description: Demo users seeded with JWT tokens and credentials
 */
authRouter.post(
  "/seed",
  asyncHandler(async (req, res) => {
    const parsed = seedSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      throw parsed.error;
    }
    const seeded = (parsed.data?.seedUsers ?? true) !== false;
    if (!seeded) return res.json({ message: "Seeding skipped" });
    const demoTokens = await seedDemoUsers();
    return res.json({
      demo: demoTokens,
      credentials: {
        viewer: { email: "viewer@example.com", password: "viewer123" },
        analyst: { email: "analyst@example.com", password: "analyst123" },
        admin: { email: "admin@example.com", password: "admin123" },
      },
    });
  }),
);

