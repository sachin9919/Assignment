"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const supertest_1 = __importDefault(require("supertest"));
function tempDbFile(testName) {
    const safe = testName.replace(/[^a-zA-Z0-9]/g, "_");
    return path_1.default.join(process.cwd(), "data", `db.test.${safe}.json`);
}
async function removeIfExists(p) {
    try {
        await promises_1.default.unlink(p);
    }
    catch {
        // ignore
    }
}
async function getApp() {
    jest.resetModules();
    const mod = await Promise.resolve().then(() => __importStar(require("../app")));
    return mod.createApp();
}
describe("Validation", () => {
    const jwtSecret = "test-secret";
    test("invalid record date returns 400", async () => {
        const dbFile = tempDbFile("invalid-record-date");
        process.env.DATA_FILE = dbFile;
        process.env.JWT_SECRET = jwtSecret;
        await removeIfExists(dbFile);
        const app = await getApp();
        const seed = await (0, supertest_1.default)(app).post("/api/auth/seed").send({});
        const admin = seed.body.demo.find((d) => d.role === "admin");
        expect(admin).toBeTruthy();
        const res = await (0, supertest_1.default)(app)
            .post("/api/records")
            .set("Authorization", `Bearer ${admin.token}`)
            .send({
            amount: 100,
            type: "income",
            category: "salary",
            date: "not-a-date",
            notes: "bad input",
        });
        expect(res.status).toBe(400);
        expect(res.body?.error?.message ?? "").toBeDefined();
    });
});
