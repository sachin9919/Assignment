"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const path_1 = __importDefault(require("path"));
exports.env = {
    PORT: Number(process.env.PORT ?? 3000),
    JWT_SECRET: process.env.JWT_SECRET ?? "dev-secret-change-me",
    DATA_FILE: process.env.DATA_FILE ?? path_1.default.join(process.cwd(), "data", "db.json"),
};
