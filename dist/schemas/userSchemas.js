"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(120),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6).max(200),
    role: common_1.roleEnum,
    status: common_1.statusEnum.optional().default("active"),
});
exports.updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(120).optional(),
    email: zod_1.z.string().email().optional(),
    password: zod_1.z.string().min(6).max(200).optional(),
    role: common_1.roleEnum.optional(),
    status: common_1.statusEnum.optional(),
});
