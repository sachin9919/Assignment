import { z } from "zod";
import { roleEnum, statusEnum } from "./common";

export const createUserSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(200),
  role: roleEnum,
  status: statusEnum.optional().default("active"),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).max(200).optional(),
  role: roleEnum.optional(),
  status: statusEnum.optional(),
});

