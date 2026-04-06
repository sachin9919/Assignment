import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { env } from "../utils/env";
import type { Role, UserStatus } from "../types/auth";

export type UserDoc = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  passwordHash: string;
  createdAt: string; // ISO
};

export type FinancialRecordDoc = {
  id: string;
  ownerUserId: string;
  amount: number; // stored as positive number
  type: "income" | "expense";
  category: string;
  date: string; // ISO date (YYYY-MM-DD preferred)
  notes?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type DbState = {
  users: UserDoc[];
  records: FinancialRecordDoc[];
};

const DEFAULT_DB: DbState = {
  users: [],
  records: [],
};

let writeQueue: Promise<void> = Promise.resolve();

async function ensureDbFile(): Promise<void> {
  const filePath = env.DATA_FILE;
  const dir = path.dirname(filePath);

  await fs.mkdir(dir, { recursive: true });

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
  }
}

export async function readDb(): Promise<DbState> {
  await ensureDbFile();
  const raw = await fs.readFile(env.DATA_FILE, "utf-8");
  const parsed = JSON.parse(raw) as DbState;
  // basic shape guard
  if (!parsed || !Array.isArray(parsed.users) || !Array.isArray(parsed.records)) {
    return structuredClone(DEFAULT_DB);
  }
  return parsed;
}

async function writeDb(db: DbState): Promise<void> {
  await ensureDbFile();
  await fs.writeFile(env.DATA_FILE, JSON.stringify(db, null, 2), "utf-8");
}

export async function createId(): Promise<string> {
  return crypto.randomUUID();
}

export function updateDb<T>(mutator: (db: DbState) => Promise<T> | T): Promise<T> {
  // Serialize updates to avoid clobbering writes.
  const run = writeQueue.then(async () => {
    const db = await readDb();
    const result = await mutator(db);
    await writeDb(db);
    return result;
  });
  // Continue the queue regardless of success/failure.
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

