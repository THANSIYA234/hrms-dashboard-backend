import { z } from "zod";

export const notificationIdParamSchema = z.object({
  notificationId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid notification id"),
});