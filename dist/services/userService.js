"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.getUserById = getUserById;
exports.createUser = createUser;
exports.updateUser = updateUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const fileDb_1 = require("../storage/fileDb");
async function listUsers() {
    const db = await (0, fileDb_1.readDb)();
    return db.users
        .slice()
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
    }));
}
async function getUserById(userId) {
    const db = await (0, fileDb_1.readDb)();
    return db.users.find((u) => u.id === userId) ?? null;
}
async function createUser(input) {
    const passwordHash = await bcryptjs_1.default.hash(input.password, 10);
    return (0, fileDb_1.updateDb)(async (db) => {
        const existing = db.users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
        if (existing) {
            throw new Error("User email already exists");
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
async function updateUser(userId, input) {
    return (0, fileDb_1.updateDb)(async (db) => {
        const user = db.users.find((u) => u.id === userId);
        if (!user)
            return null;
        if (typeof input.email === "string") {
            const existing = db.users.find((u) => u.id !== userId && u.email.toLowerCase() === input.email.toLowerCase());
            if (existing)
                throw new Error("User email already exists");
            user.email = input.email;
        }
        if (typeof input.name === "string")
            user.name = input.name;
        if (typeof input.role === "string")
            user.role = input.role;
        if (typeof input.status === "string")
            user.status = input.status;
        if (typeof input.password === "string") {
            user.passwordHash = await bcryptjs_1.default.hash(input.password, 10);
        }
        return user;
    });
}
