"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
// Optional: allow caller to specify which demo users to seed.
exports.seedSchema = zod_1.z
    .object({
    seedUsers: zod_1.z
        .boolean()
        .optional()
        .describe("When true (default), create demo viewer/analyst/admin users."),
})
    .optional();
