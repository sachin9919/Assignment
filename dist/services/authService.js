"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.seedDemoUsers = seedDemoUsers;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const fileDb_1 = require("../storage/fileDb");
const jwt_1 = require("../utils/jwt");
async function login(email, password) {
    const db = await (0, fileDb_1.readDb)();
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
        return null;
    }
    if (user.status !== "active") {
        return null;
    }
    const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!ok)
        return null;
    const jwtUser = { id: user.id, role: user.role };
    const token = (0, jwt_1.signToken)(jwtUser);
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status } };
}
async function upsertUser(input) {
    const passwordHash = await bcryptjs_1.default.hash(input.password, 10);
    return (0, fileDb_1.updateDb)(async (db) => {
        const existing = db.users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
        if (existing) {
            existing.name = input.name;
            existing.role = input.role;
            existing.status = input.status;
            existing.passwordHash = passwordHash;
            return existing;
        }
        const now = new Date().toISOString();
        const user = {
            id: await (0, fileDb_1.createId)(),
            name: input.name,
            email: input.email,
            role: input.role,
            status: input.status,
            passwordHash,
            createdAt: now,
        };
        db.users.push(user);
        return user;
    });
}
async function seedDemoUsers() {
    const demo = [
        { name: "Demo Viewer", email: "viewer@example.com", password: "viewer123", role: "viewer" },
        { name: "Demo Analyst", email: "analyst@example.com", password: "analyst123", role: "analyst" },
        { name: "Demo Admin", email: "admin@example.com", password: "admin123", role: "admin" },
    ];
    const created = [];
    // Upsert sequentially to keep deterministic DB state.
    for (const u of demo) {
        const user = await upsertUser({
            name: u.name,
            email: u.email,
            password: u.password,
            role: u.role,
            status: "active",
        });
        const jwtUser = { id: user.id, role: user.role };
        created.push({ token: (0, jwt_1.signToken)(jwtUser), email: u.email, role: user.role, status: user.status });
    }
    return created;
}
