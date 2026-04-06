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
    // Dynamic import so env overrides (DATA_FILE) apply before module initialization.
    jest.resetModules();
    const mod = await Promise.resolve().then(() => __importStar(require("../app")));
    return mod.createApp();
}
async function seedAndLogin(app) {
    const seed = await (0, supertest_1.default)(app).post("/api/auth/seed").send({});
    const demo = seed.body.demo;
    const tokenByRole = new Map(demo.map((d) => [d.role, d.token]));
    return tokenByRole;
}
describe("RBAC + records", () => {
    const jwtSecret = "test-secret";
    test("viewer cannot create records (403)", async () => {
        const dbFile = tempDbFile("viewer-forbidden-create");
        process.env.DATA_FILE = dbFile;
        process.env.JWT_SECRET = jwtSecret;
        await removeIfExists(dbFile);
        const app = await getApp();
        const tokens = await seedAndLogin(app);
        const viewerToken = tokens.get("viewer");
        const res = await (0, supertest_1.default)(app)
            .post("/api/records")
            .set("Authorization", `Bearer ${viewerToken}`)
            .send({
            amount: 100,
            type: "income",
            category: "salary",
            date: "2026-04-01",
            notes: "test",
        });
        expect(res.status).toBe(403);
    });
    test("admin creates record; analyst can read + dashboard totals", async () => {
        const dbFile = tempDbFile("admin-creates-analyst-read");
        process.env.DATA_FILE = dbFile;
        process.env.JWT_SECRET = jwtSecret;
        await removeIfExists(dbFile);
        const app = await getApp();
        const seed = await (0, supertest_1.default)(app).post("/api/auth/seed").send({});
        const demo = seed.body.demo;
        const tokenByRole = new Map(demo.map((d) => [d.role, d.token]));
        const adminToken = tokenByRole.get("admin");
        const analystToken = tokenByRole.get("analyst");
        const usersRes = await (0, supertest_1.default)(app)
            .get("/api/users")
            .set("Authorization", `Bearer ${adminToken}`);
        const analystUser = usersRes.body.items.find((u) => u.email === "analyst@example.com");
        expect(analystUser).toBeTruthy();
        const recordAmount = 2500;
        await (0, supertest_1.default)(app)
            .post(`/api/records?userId=${analystUser.id}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
            amount: recordAmount,
            type: "income",
            category: "salary",
            date: "2026-04-01",
            notes: "analyst income",
        })
            .expect(201);
        const recordsRes = await (0, supertest_1.default)(app)
            .get("/api/records")
            .set("Authorization", `Bearer ${analystToken}`)
            .expect(200);
        expect(recordsRes.body.items.length).toBe(1);
        expect(recordsRes.body.items[0].amount).toBe(recordAmount);
        const summaryRes = await (0, supertest_1.default)(app)
            .get("/api/dashboard/summary")
            .set("Authorization", `Bearer ${analystToken}`)
            .expect(200);
        expect(summaryRes.body.totals.netBalance).toBe(recordAmount);
    });
});
