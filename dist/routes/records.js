"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordsRouter = void 0;
const express_1 = require("express");
const authenticate_1 = require("../middleware/authenticate");
const rbac_1 = require("../middleware/rbac");
const asyncHandler_1 = require("../utils/asyncHandler");
const validate_1 = require("../utils/validate");
const recordSchemas_1 = require("../schemas/recordSchemas");
const recordService_1 = require("../services/recordService");
exports.recordsRouter = (0, express_1.Router)();
/**
 * @openapi
 * /api/records:
 *   get:
 *     summary: List financial records for the authenticated user
 *     tags: [Records]
 */
exports.recordsRouter.get("/", authenticate_1.authenticate, (0, rbac_1.requireRoles)("viewer", "analyst", "admin"), (0, validate_1.validateQuery)(recordSchemas_1.recordFilterSchema), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const filter = req.validatedQuery;
    const result = await (0, recordService_1.listRecords)({
        viewerUserId: user.id,
        viewerRole: user.role,
        filter,
    });
    res.json(result);
}));
/**
 * @openapi
 * /api/records/{id}:
 *   get:
 *     summary: Get record by id (read permissions)
 *     tags: [Records]
 */
exports.recordsRouter.get("/:id", authenticate_1.authenticate, (0, rbac_1.requireRoles)("viewer", "analyst", "admin"), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const targetUserId = typeof req.query.userId === "string" ? req.query.userId : undefined;
    const recordId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const record = await (0, recordService_1.getRecordById)({
        viewerUserId: user.id,
        viewerRole: user.role,
        recordId: recordId ?? "",
        targetUserId,
    });
    if (!record)
        return res.status(404).json({ error: { message: "Record not found" } });
    res.json({ item: record });
}));
/**
 * @openapi
 * /api/records:
 *   post:
 *     summary: Create a record (admin only)
 *     tags: [Records]
 */
exports.recordsRouter.post("/", authenticate_1.authenticate, (0, rbac_1.requireRoles)("admin"), (0, validate_1.validateBody)(recordSchemas_1.createRecordSchema), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const body = req.body;
    const targetUserId = typeof req.query.userId === "string" ? req.query.userId : user.id;
    const record = await (0, recordService_1.createRecord)({
        ownerUserId: targetUserId,
        amount: body.amount,
        type: body.type,
        category: body.category,
        date: body.date,
        notes: body.notes,
    });
    res.status(201).json({ item: record });
}));
/**
 * @openapi
 * /api/records/{id}:
 *   patch:
 *     summary: Update record (admin only)
 *     tags: [Records]
 */
exports.recordsRouter.patch("/:id", authenticate_1.authenticate, (0, rbac_1.requireRoles)("admin"), (0, validate_1.validateBody)(recordSchemas_1.updateRecordSchema), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const targetUserId = typeof req.query.userId === "string" ? req.query.userId : undefined;
    const recordId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = await (0, recordService_1.updateRecord)({
        viewerUserId: user.id,
        viewerRole: user.role,
        recordId: recordId ?? "",
        targetUserId,
        patch: req.body,
    });
    if (!updated)
        return res.status(404).json({ error: { message: "Record not found" } });
    res.json({ item: updated });
}));
/**
 * @openapi
 * /api/records/{id}:
 *   delete:
 *     summary: Delete record (admin only)
 *     tags: [Records]
 */
exports.recordsRouter.delete("/:id", authenticate_1.authenticate, (0, rbac_1.requireRoles)("admin"), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    const targetUserId = typeof req.query.userId === "string" ? req.query.userId : undefined;
    const recordId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const ok = await (0, recordService_1.deleteRecord)({
        viewerUserId: user.id,
        viewerRole: user.role,
        recordId: recordId ?? "",
        targetUserId,
    });
    if (!ok)
        return res.status(404).json({ error: { message: "Record not found" } });
    return res.json({ deleted: true });
}));
