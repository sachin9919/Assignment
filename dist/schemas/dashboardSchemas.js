"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardSummaryQuerySchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
exports.dashboardSummaryQuerySchema = zod_1.z.object({
    from: common_1.isoDateSchema.optional(),
    to: common_1.isoDateSchema.optional(),
    // When provided, trends/category totals can be limited to a single record type.
    type: common_1.recordTypeEnum.optional(),
    // Optional: constrain results to a particular user's data (admin only will use this).
    userId: zod_1.z.string().optional(),
});
