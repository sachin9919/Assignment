"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const fileDb_1 = require("../storage/fileDb");
const jwt_1 = require("../utils/jwt");
async function authenticate(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.toLowerCase().startsWith("bearer ")) {
        return res.status(401).json({ error: { message: "Missing Authorization Bearer token" } });
    }
    const token = header.slice("Bearer ".length).trim();
    try {
        const jwtUser = (0, jwt_1.verifyToken)(token);
        const db = await (0, fileDb_1.readDb)();
        const user = db.users.find((u) => u.id === jwtUser.id);
        if (!user) {
            return res.status(401).json({ error: { message: "Invalid token user" } });
        }
        if (user.status !== "active") {
            return res.status(403).json({ error: { message: "User is inactive" } });
        }
        req.user = { id: user.id, role: user.role };
        return next();
    }
    catch (e) {
        return res.status(401).json({ error: { message: "Invalid or expired token" } });
    }
}
