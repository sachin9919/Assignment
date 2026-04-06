"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
function validateBody(schema) {
    return (req, _res, next) => {
        const parsed = schema.parse(req.body);
        req.body = parsed;
        next();
    };
}
function validateQuery(schema) {
    return (req, _res, next) => {
        const parsed = schema.parse(req.query);
        // Express v5 treats req.query as read-only at runtime; store validated data separately.
        req.validatedQuery = parsed;
        next();
    };
}
