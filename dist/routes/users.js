"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const express_1 = require("express");
const authenticate_1 = require("../middleware/authenticate");
const rbac_1 = require("../middleware/rbac");
const asyncHandler_1 = require("../utils/asyncHandler");
const validate_1 = require("../utils/validate");
const userSchemas_1 = require("../schemas/userSchemas");
const userService_1 = require("../services/userService");
exports.usersRouter = (0, express_1.Router)();
/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: List all users (admin only)
 *     tags: [Users]
 */
exports.usersRouter.get("/", authenticate_1.authenticate, (0, rbac_1.requireRoles)("admin"), (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const users = await (0, userService_1.listUsers)();
    res.json({ items: users });
}));
/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by id (admin only)
 *     tags: [Users]
 */
exports.usersRouter.get("/:id", authenticate_1.authenticate, (0, rbac_1.requireRoles)("admin"), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await (0, userService_1.getUserById)(userId ?? "");
    if (!user)
        return res.status(404).json({ error: { message: "User not found" } });
    res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
    });
}));
/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Create a new user (admin only)
 *     tags: [Users]
 */
exports.usersRouter.post("/", authenticate_1.authenticate, (0, rbac_1.requireRoles)("admin"), (0, validate_1.validateBody)(userSchemas_1.createUserSchema), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const created = await (0, userService_1.createUser)(req.body);
    res.status(201).json({
        id: created.id,
        name: created.name,
        email: created.email,
        role: created.role,
        status: created.status,
        createdAt: created.createdAt,
    });
}));
/**
 * @openapi
 * /api/users/{id}:
 *   patch:
 *     summary: Update user fields (admin only)
 *     tags: [Users]
 */
exports.usersRouter.patch("/:id", authenticate_1.authenticate, (0, rbac_1.requireRoles)("admin"), (0, validate_1.validateBody)(userSchemas_1.updateUserSchema), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = await (0, userService_1.updateUser)(userId ?? "", req.body);
    if (!updated)
        return res.status(404).json({ error: { message: "User not found" } });
    res.json({
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        status: updated.status,
        createdAt: updated.createdAt,
    });
}));
