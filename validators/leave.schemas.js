import { z } from "zod";
import {
  dateInput,
  leaveStatus,
  leaveType,
  optionalText,
  paginationSchema,
} from "./common.js";

export const applyLeaveSchema = z
  .object({
    startDate: dateInput,
    endDate: dateInput,
    type: leaveType,
    reason: z.string().trim().min(1, "Reason is required").max(500),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: "End date cannot be before start date",
    path: ["endDate"],
  });

export const updateLeaveSchema = z
  .object({
    startDate: dateInput.optional(),
    endDate: dateInput.optional(),
    type: leaveType.optional(),
    reason: z.string().trim().min(1).max(500).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const updateStatusSchema = z.object({
  status: leaveStatus,
});

export const listLeavesQuerySchema = paginationSchema.extend({
  status: z.union([leaveStatus, z.literal("")]).optional(),
  search: optionalText(120),
});