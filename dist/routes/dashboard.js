"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const express_1 = require("express");
const authenticate_1 = require("../middleware/authenticate");
const rbac_1 = require("../middleware/rbac");
const asyncHandler_1 = require("../utils/asyncHandler");
const validate_1 = require("../utils/validate");
const dashboardSchemas_1 = require("../schemas/dashboardSchemas");
const dashboardService_1 = require("../services/dashboardService");
exports.dashboardRouter = (0, express_1.Router)();
/**
 * @openapi
 * /api/dashboard/summary:
 *   get:
 *     summary: Dashboard summary (totals, category totals, recent activity, monthly trends)
 *     tags: [Dashboard]
 */
exports.dashboardRouter.get("/summary", authenticate_1.authenticate, (0, rbac_1.requireRoles)("viewer", "analyst", "admin"), (0, validate_1.validateQuery)(dashboardSchemas_1.dashboardSummaryQuerySchema), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const query = req.validatedQuery;
    const summary = await (0, dashboardService_1.getDashboardSummary)({
        viewerUserId: user.id,
        viewerRole: user.role,
        userId: query.userId,
        from: query.from,
        to: query.to,
        type: query.type,
    });
    return res.json(summary);
}));
