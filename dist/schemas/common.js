"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isoDateSchema = exports.recordTypeEnum = exports.statusEnum = exports.roleEnum = void 0;
const zod_1 = require("zod");
exports.roleEnum = zod_1.z.enum(["viewer", "analyst", "admin"]);
exports.statusEnum = zod_1.z.enum(["active", "inactive"]);
exports.recordTypeEnum = zod_1.z.enum(["income", "expense"]);
exports.isoDateSchema = zod_1.z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid date" });
