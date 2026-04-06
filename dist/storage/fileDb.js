"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readDb = readDb;
exports.createId = createId;
exports.updateDb = updateDb;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../utils/env");
const DEFAULT_DB = {
    users: [],
    records: [],
};
let writeQueue = Promise.resolve();
async function ensureDbFile() {
    const filePath = env_1.env.DATA_FILE;
    const dir = path_1.default.dirname(filePath);
    await promises_1.default.mkdir(dir, { recursive: true });
    try {
        await promises_1.default.access(filePath);
    }
    catch {
        await promises_1.default.writeFile(filePath, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
    }
}
async function readDb() {
    await ensureDbFile();
    const raw = await promises_1.default.readFile(env_1.env.DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    // basic shape guard
    if (!parsed || !Array.isArray(parsed.users) || !Array.isArray(parsed.records)) {
        return structuredClone(DEFAULT_DB);
    }
    return parsed;
}
async function writeDb(db) {
    await ensureDbFile();
    await promises_1.default.writeFile(env_1.env.DATA_FILE, JSON.stringify(db, null, 2), "utf-8");
}
async function createId() {
    return crypto_1.default.randomUUID();
}
function updateDb(mutator) {
    // Serialize updates to avoid clobbering writes.
    const run = writeQueue.then(async () => {
        const db = await readDb();
        const result = await mutator(db);
        await writeDb(db);
        return result;
    });
    // Continue the queue regardless of success/failure.
    writeQueue = run.then(() => undefined, () => undefined);
    return run;
}
