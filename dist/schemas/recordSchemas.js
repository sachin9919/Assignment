"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordFilterSchema = exports.updateRecordSchema = exports.createRecordSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.createRecordSchema = zod_1.z.object({
    amount: zod_1.z.number().finite().positive(),
    type: common_1.recordTypeEnum,
    category: zod_1.z.string().min(1).max(80),
    date: common_1.isoDateSchema,
    notes: zod_1.z.string().max(500).optional(),
});
exports.updateRecordSchema = zod_1.z.object({
    amount: zod_1.z.number().finite().positive().optional(),
    type: common_1.recordTypeEnum.optional(),
    category: zod_1.z.string().min(1).max(80).optional(),
    date: common_1.isoDateSchema.optional(),
    notes: zod_1.z.string().max(500).optional(),
});
exports.recordFilterSchema = zod_1.z.object({
    from: common_1.isoDateSchema.optional(),
    to: common_1.isoDateSchema.optional(),
    type: common_1.recordTypeEnum.optional(),
    category: zod_1.z.string().min(1).max(80).optional(),
    search: zod_1.z.string().min(1).max(120).optional(),
    // Admin-only: allow filtering by a particular user's records.
    userId: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().optional().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).optional().default(20),
});
