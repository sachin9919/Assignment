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
  jest.resetModules();
  const mod = await import("../app");
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
    const seed = await request(app).post("/api/auth/seed").send({});
    const admin = (seed.body.demo as Array<{ role: string; token: string }>).find((d) => d.role === "admin")!;
    expect(admin).toBeTruthy();

    const res = await request(app)
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

