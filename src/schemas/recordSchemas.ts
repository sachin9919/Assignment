import { z } from "zod";
import { isoDateSchema, recordTypeEnum } from "./common";

export const createRecordSchema = z.object({
  amount: z.number().finite().positive(),
  type: recordTypeEnum,
  category: z.string().min(1).max(80),
  date: isoDateSchema,
  notes: z.string().max(500).optional(),
});

export const updateRecordSchema = z.object({
  amount: z.number().finite().positive().optional(),
  type: recordTypeEnum.optional(),
  category: z.string().min(1).max(80).optional(),
  date: isoDateSchema.optional(),
  notes: z.string().max(500).optional(),
});

export const recordFilterSchema = z.object({
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
  type: recordTypeEnum.optional(),
  category: z.string().min(1).max(80).optional(),
  search: z.string().min(1).max(120).optional(),
  // Admin-only: allow filtering by a particular user's records.
  userId: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

