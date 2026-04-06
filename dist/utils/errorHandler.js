"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const httpError_1 = require("./httpError");
function errorHandler(err, req, res, _next) {
    if (err instanceof httpError_1.HttpError) {
        return res.status(err.statusCode).json({ error: { message: err.message, details: err.details } });
    }
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            error: {
                message: "Validation failed",
                details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
            },
        });
    }
    if (err instanceof Error) {
        return res.status(400).json({ error: { message: err.message } });
    }
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ error: { message: "Internal server error" } });
}
