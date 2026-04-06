import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireRoles } from "../middleware/rbac";
import { asyncHandler } from "../utils/asyncHandler";
import { validateQuery } from "../utils/validate";
import { dashboardSummaryQuerySchema } from "../schemas/dashboardSchemas";
import { getDashboardSummary } from "../services/dashboardService";

export const dashboardRouter = Router();

/**
 * @openapi
 * /api/dashboard/summary:
 *   get:
 *     summary: Dashboard summary (totals, category totals, recent activity, monthly trends)
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Target user ID (admin can view any user, others can view own data)
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *         description: Filter by transaction type
 *     responses:
 *       200:
 *         description: Dashboard summary data
 *       401:
 *         description: Unauthorized - missing or invalid token
 */
dashboardRouter.get(
  "/summary",
  authenticate,
  requireRoles("viewer", "analyst", "admin"),
  validateQuery(dashboardSummaryQuerySchema),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const query = (req as any).validatedQuery as any;
    const summary = await getDashboardSummary({
      viewerUserId: user.id,
      viewerRole: user.role,
      userId: query.userId,
      from: query.from,
      to: query.to,
      type: query.type,
    });
    return res.json(summary);
  }),
);

