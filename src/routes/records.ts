import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { requireRoles } from "../middleware/rbac";
import { asyncHandler } from "../utils/asyncHandler";
import { validateBody, validateQuery } from "../utils/validate";
import { recordFilterSchema, createRecordSchema, updateRecordSchema } from "../schemas/recordSchemas";
import {
  createRecord,
  listRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
} from "../services/recordService";
import type { Role } from "../types/auth";

export const recordsRouter = Router();

/**
 * @openapi
 * /api/records:
 *   get:
 *     summary: List financial records for the authenticated user
 *     tags: [Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Target user ID (admin can filter any user)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *         description: Filter by transaction type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of records
 *       401:
 *         description: Unauthorized
 */
recordsRouter.get(
  "/",
  authenticate,
  requireRoles("viewer", "analyst", "admin"),
  validateQuery(recordFilterSchema),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const filter = (req as any).validatedQuery as any;
    const result = await listRecords({
      viewerUserId: user.id,
      viewerRole: user.role,
      filter,
    });
    res.json(result);
  }),
);

/**
 * @openapi
 * /api/records/{id}:
 *   get:
 *     summary: Get record by id (read permissions)
 *     tags: [Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Record ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Target user ID (for admin filtering)
 *     responses:
 *       200:
 *         description: Record details
 *       404:
 *         description: Record not found
 *       401:
 *         description: Unauthorized
 */
recordsRouter.get(
  "/:id",
  authenticate,
  requireRoles("viewer", "analyst", "admin"),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const targetUserId = typeof req.query.userId === "string" ? req.query.userId : undefined;
    const recordId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const record = await getRecordById({
      viewerUserId: user.id,
      viewerRole: user.role,
      recordId: recordId ?? "",
      targetUserId,
    });
    if (!record) return res.status(404).json({ error: { message: "Record not found" } });
    res.json({ item: record });
  }),
);

/**
 * @openapi
 * /api/records:
 *   post:
 *     summary: Create a record (admin only)
 *     tags: [Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Owner user ID (defaults to current user if not provided)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 1500.50
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *                 example: expense
 *               category:
 *                 type: string
 *                 example: groceries
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *               notes:
 *                 type: string
 *                 example: Weekly shopping
 *             required:
 *               - amount
 *               - type
 *               - category
 *               - date
 *     responses:
 *       201:
 *         description: Record created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 */
recordsRouter.post(
  "/",
  authenticate,
  requireRoles("admin"),
  validateBody(createRecordSchema),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const body = req.body as any;
    const targetUserId = typeof req.query.userId === "string" ? req.query.userId : user.id;
    const record = await createRecord({
      ownerUserId: targetUserId,
      amount: body.amount,
      type: body.type,
      category: body.category,
      date: body.date,
      notes: body.notes,
    });
    res.status(201).json({ item: record });
  }),
);

/**
 * @openapi
 * /api/records/{id}:
 *   patch:
 *     summary: Update record (admin only)
 *     tags: [Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Record ID to update
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Target user ID (for admin filtering)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Record updated successfully
 *       404:
 *         description: Record not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 */
recordsRouter.patch(
  "/:id",
  authenticate,
  requireRoles("admin"),
  validateBody(updateRecordSchema),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const targetUserId = typeof req.query.userId === "string" ? req.query.userId : undefined;
    const recordId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = await updateRecord({
      viewerUserId: user.id,
      viewerRole: user.role,
      recordId: recordId ?? "",
      targetUserId,
      patch: req.body as any,
    });
    if (!updated) return res.status(404).json({ error: { message: "Record not found" } });
    res.json({ item: updated });
  }),
);

/**
 * @openapi
 * /api/records/{id}:
 *   delete:
 *     summary: Delete record (admin only)
 *     tags: [Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Record ID to delete
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Target user ID (for admin filtering)
 *     responses:
 *       200:
 *         description: Record deleted successfully
 *       404:
 *         description: Record not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - admin only
 */
recordsRouter.delete(
  "/:id",
  authenticate,
  requireRoles("admin"),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const targetUserId = typeof req.query.userId === "string" ? req.query.userId : undefined;
    const recordId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const ok = await deleteRecord({
      viewerUserId: user.id,
      viewerRole: user.role,
      recordId: recordId ?? "",
      targetUserId,
    });
    if (!ok) return res.status(404).json({ error: { message: "Record not found" } });
    return res.json({ deleted: true });
  }),
);

