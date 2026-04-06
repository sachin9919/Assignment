import fs from "fs/promises";
import path from "path";
import request from "supertest";

function tempDbFile(testName: string) {
  const safe = testName.replace(/[^a-zA-Z0-9]/g, "_");
  return path.join(process.cwd(), "data", `db.test.${safe}.json`);
}

async function removeIfExists(p: string) {
  try {
    await fs.unlink(p);
  } catch {
    // ignore
  }
}

async function getApp() {
  // Dynamic import so env overrides (DATA_FILE) apply before module initialization.
  jest.resetModules();
  const mod = await import("../app");
  return mod.createApp();
}

async function seedAndLogin(app: any) {
  const seed = await request(app).post("/api/auth/seed").send({});
  const demo = seed.body.demo as Array<{ role: string; token: string }>;
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

    const viewerToken = tokens.get("viewer")!;
    const res = await request(app)
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
    const seed = await request(app).post("/api/auth/seed").send({});
    const demo = seed.body.demo as Array<{ role: string; token: string }>;
    const tokenByRole = new Map(demo.map((d) => [d.role, d.token]));
    const adminToken = tokenByRole.get("admin")!;
    const analystToken = tokenByRole.get("analyst")!;

    const usersRes = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`);
    const analystUser = usersRes.body.items.find((u: any) => u.email === "analyst@example.com");
    expect(analystUser).toBeTruthy();

    const recordAmount = 2500;
    await request(app)
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

    const recordsRes = await request(app)
      .get("/api/records")
      .set("Authorization", `Bearer ${analystToken}`)
      .expect(200);
    expect(recordsRes.body.items.length).toBe(1);
    expect(recordsRes.body.items[0].amount).toBe(recordAmount);

    const summaryRes = await request(app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${analystToken}`)
      .expect(200);
    expect(summaryRes.body.totals.netBalance).toBe(recordAmount);
  });
});

