import { z } from "zod";
import { isoDateSchema, recordTypeEnum } from "./common";

export const dashboardSummaryQuerySchema = z.object({
  from: isoDateSchema.optional(),
  to: isoDateSchema.optional(),
  // When provided, trends/category totals can be limited to a single record type.
  type: recordTypeEnum.optional(),
  // Optional: constrain results to a particular user's data (admin only will use this).
  userId: z.string().optional(),
});

