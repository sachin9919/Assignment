"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRoles = requireRoles;
function requireRoles(...allowed) {
    return (req, res, next) => {
        const role = req.user?.role;
        if (!role) {
            return res.status(401).json({ error: { message: "Missing auth user" } });
        }
        if (!allowed.includes(role)) {
            return res.status(403).json({ error: { message: "Forbidden: insufficient role" } });
        }
        return next();
    };
}
