import bcrypt from "bcryptjs";
import { readDb, updateDb, createId, type UserDoc } from "../storage/fileDb";
import type { Role, UserStatus } from "../types/auth";

export async function listUsers() {
  const db = await readDb();
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

export async function getUserById(userId: string) {
  const db = await readDb();
  return db.users.find((u) => u.id === userId) ?? null;
}

export async function createUser(input: {
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
      throw new Error("User email already exists");
    }
    const now = new Date().toISOString();
    const user: UserDoc = {
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

export async function updateUser(
  userId: string,
  input: Partial<{ name: string; email: string; password: string; role: Role; status: UserStatus }>,
) {
  return updateDb(async (db) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return null;

    if (typeof input.email === "string") {
      const existing = db.users.find((u) => u.id !== userId && u.email.toLowerCase() === input.email!.toLowerCase());
      if (existing) throw new Error("User email already exists");
      user.email = input.email;
    }
    if (typeof input.name === "string") user.name = input.name;
    if (typeof input.role === "string") user.role = input.role;
    if (typeof input.status === "string") user.status = input.status;
    if (typeof input.password === "string") {
      user.passwordHash = await bcrypt.hash(input.password, 10);
    }
    return user;
  });
}

