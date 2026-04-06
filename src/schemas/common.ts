import { z } from "zod";

export const roleEnum = z.enum(["viewer", "analyst", "admin"]);
export const statusEnum = z.enum(["active", "inactive"]);

export const recordTypeEnum = z.enum(["income", "expense"]);

export const isoDateSchema = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid date" });

