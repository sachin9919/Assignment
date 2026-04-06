"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const validate_1 = require("../utils/validate");
const authSchemas_1 = require("../schemas/authSchemas");
const asyncHandler_1 = require("../utils/asyncHandler");
const authService_1 = require("../services/authService");
const httpError_1 = require("../utils/httpError");
exports.authRouter = (0, express_1.Router)();
/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login with email/password
 *     tags: [Auth]
 */
exports.authRouter.post("/login", (0, validate_1.validateBody)(authSchemas_1.loginSchema), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    const result = await (0, authService_1.login)(email, password);
    if (!result) {
        throw new httpError_1.HttpError(401, "Invalid credentials or inactive user");
    }
    return res.json(result);
}));
/**
 * @openapi
 * /api/auth/seed:
 *   post:
 *     summary: Seed demo users and return JWT tokens
 *     tags: [Auth]
 */
exports.authRouter.post("/seed", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parsed = authSchemas_1.seedSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
        throw parsed.error;
    }
    const seeded = (parsed.data?.seedUsers ?? true) !== false;
    if (!seeded)
        return res.json({ message: "Seeding skipped" });
    const demoTokens = await (0, authService_1.seedDemoUsers)();
    return res.json({
        demo: demoTokens,
        credentials: {
            viewer: { email: "viewer@example.com", password: "viewer123" },
            analyst: { email: "analyst@example.com", password: "analyst123" },
            admin: { email: "admin@example.com", password: "admin123" },
        },
    });
}));
