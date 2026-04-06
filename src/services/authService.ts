import bcrypt from "bcryptjs";
import { readDb, updateDb, createId } from "../storage/fileDb";
import type { Role, UserStatus, JwtUser } from "../types/auth";
import { signToken } from "../utils/jwt";

export async function login(email: string, password: string) {
  const db = await readDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return null;
  }
  if (user.status !== "active") {
    return null;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  const jwtUser: JwtUser = { id: user.id, role: user.role };
  const token = signToken(jwtUser);
  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status } };
}

async function upsertUser(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
  status: UserStatus;
}) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  return updateDb(async (db) => {
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
      id: await createId(),
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

export async function seedDemoUsers() {
  const demo = [
    { name: "Demo Viewer", email: "viewer@example.com", password: "viewer123", role: "viewer" as const },
    { name: "Demo Analyst", email: "analyst@example.com", password: "analyst123", role: "analyst" as const },
    { name: "Demo Admin", email: "admin@example.com", password: "admin123", role: "admin" as const },
  ];

  const created: Array<{ token: string; email: string; role: Role; status: UserStatus }> = [];

  // Upsert sequentially to keep deterministic DB state.
  for (const u of demo) {
    const user = await upsertUser({
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role,
      status: "active",
    });
    const jwtUser: JwtUser = { id: user.id, role: user.role };
    created.push({ token: signToken(jwtUser), email: u.email, role: user.role, status: user.status });
  }

  return created;
}

