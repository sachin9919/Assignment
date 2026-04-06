import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireRoles } from "../middleware/rbac";
import { asyncHandler } from "../utils/asyncHandler";
import { validateBody } from "../utils/validate";
import { createUserSchema, updateUserSchema } from "../schemas/userSchemas";
import { listUsers, getUserById, createUser, updateUser } from "../services/userService";
import type { Request, Response } from "express";

export const usersRouter = Router();

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: List all users (admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 */
usersRouter.get(
  "/",
  authenticate,
  requireRoles("admin"),
  asyncHandler(async (_req, res) => {
    const users = await listUsers();
    res.json({ items: users });
  }),
);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by id (admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 */
usersRouter.get(
  "/:id",
  authenticate,
  requireRoles("admin"),
  asyncHandler(async (req, res) => {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await getUserById(userId ?? "");
    if (!user) return res.status(404).json({ error: { message: "User not found" } });
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    });
  }),
);

/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Create a new user (admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [viewer, analyst, admin]
 *                 example: analyst
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *     responses:
 *       201:
 *         description: User created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 */
usersRouter.post(
  "/",
  authenticate,
  requireRoles("admin"),
  validateBody(createUserSchema),
  asyncHandler(async (req, res) => {
    const created = await createUser(req.body as any);
    res.status(201).json({
      id: created.id,
      name: created.name,
      email: created.email,
      role: created.role,
      status: created.status,
      createdAt: created.createdAt,
    });
  }),
);

/**
 * @openapi
 * /api/users/{id}:
 *   patch:
 *     summary: Update user fields (admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [viewer, analyst, admin]
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 */
usersRouter.patch(
  "/:id",
  authenticate,
  requireRoles("admin"),
  validateBody(updateUserSchema),
  asyncHandler(async (req, res) => {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = await updateUser(userId ?? "", req.body as any);
    if (!updated) return res.status(404).json({ error: { message: "User not found" } });
    res.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      status: updated.status,
      createdAt: updated.createdAt,
    });
  }),
);

