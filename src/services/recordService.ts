import crypto from "crypto";
import { readDb, updateDb } from "../storage/fileDb";
import type { FinancialRecordDoc } from "../storage/fileDb";
import type { Role } from "../types/auth";

type RecordFilter = {
  from?: string;
  to?: string;
  type?: "income" | "expense";
  category?: string;
  search?: string;
  // Admin-only: constrain query to a particular user's records.
  userId?: string;
  page: number;
  limit: number;
};

function inRange(recordDateISO: string, from?: string, to?: string) {
  const t = Date.parse(recordDateISO);
  if (Number.isNaN(t)) return false;
  if (from) {
    const f = Date.parse(from);
    if (!Number.isNaN(f) && t < f) return false;
  }
  if (to) {
    const tt = Date.parse(to);
    if (!Number.isNaN(tt) && t > tt) return false;
  }
  return true;
}

function matchesSearch(record: FinancialRecordDoc, search?: string) {
  if (!search) return true;
  const s = search.toLowerCase();
  return (
    record.category.toLowerCase().includes(s) ||
    (record.notes?.toLowerCase().includes(s) ?? false)
  );
}

export async function createRecord(input: Omit<FinancialRecordDoc, "id" | "createdAt" | "updatedAt">) {
  return updateDb(async (db) => {
    const now = new Date().toISOString();
    const record: FinancialRecordDoc = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    db.records.push(record);
    return record;
  });
}

export async function listRecords(params: {
  viewerUserId: string;
  viewerRole: Role;
  filter: RecordFilter;
}) {
  const db = await readDb();
  const effectiveOwnerId = params.viewerRole === "admin" ? params.filter.userId ?? params.viewerUserId : params.viewerUserId;

  let items = db.records.filter((r) => r.ownerUserId === effectiveOwnerId);

  const { from, to, type, category, search, page, limit } = params.filter;
  items = items.filter((r) => inRange(r.date, from, to));
  if (type) items = items.filter((r) => r.type === type);
  if (category) items = items.filter((r) => r.category.toLowerCase() === category.toLowerCase());
  items = items.filter((r) => matchesSearch(r, search));

  items.sort((a, b) => b.date.localeCompare(a.date));

  const total = items.length;
  const start = (page - 1) * limit;
  const paged = items.slice(start, start + limit);

  return {
    items: paged,
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getRecordById(params: { viewerUserId: string; viewerRole: Role; recordId: string; targetUserId?: string }) {
  const db = await readDb();
  const effectiveOwnerId =
    params.viewerRole === "admin" ? params.targetUserId ?? params.viewerUserId : params.viewerUserId;
  const record = db.records.find((r) => r.id === params.recordId && r.ownerUserId === effectiveOwnerId) ?? null;
  return record;
}

export async function updateRecord(params: {
  viewerUserId: string;
  viewerRole: Role;
  recordId: string;
  targetUserId?: string;
  patch: Partial<Pick<FinancialRecordDoc, "amount" | "type" | "category" | "date" | "notes">>;
}) {
  return updateDb(async (db) => {
    const effectiveOwnerId =
      params.viewerRole === "admin" ? params.targetUserId ?? params.viewerUserId : params.viewerUserId;
    const record = db.records.find((r) => r.id === params.recordId && r.ownerUserId === effectiveOwnerId);
    if (!record) return null;
    if (typeof params.patch.amount === "number") record.amount = params.patch.amount;
    if (typeof params.patch.type === "string") record.type = params.patch.type;
    if (typeof params.patch.category === "string") record.category = params.patch.category;
    if (typeof params.patch.date === "string") record.date = params.patch.date;
    if (typeof params.patch.notes === "string") record.notes = params.patch.notes;
    record.updatedAt = new Date().toISOString();
    return record;
  });
}

export async function deleteRecord(params: {
  viewerUserId: string;
  viewerRole: Role;
  recordId: string;
  targetUserId?: string;
}) {
  return updateDb(async (db) => {
    const effectiveOwnerId =
      params.viewerRole === "admin" ? params.targetUserId ?? params.viewerUserId : params.viewerUserId;
    const idx = db.records.findIndex((r) => r.id === params.recordId && r.ownerUserId === effectiveOwnerId);
    if (idx === -1) return false;
    db.records.splice(idx, 1);
    return true;
  });
}

