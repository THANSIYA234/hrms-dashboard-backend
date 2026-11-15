import { z } from "zod";

export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Must be a 24-character hex id");

export const idParamSchema = z.object({ id: objectId });

export const employeeIdParamSchema = z.object({ employeeId: objectId });

/**
 * Accepts Date, ISO strings and the `YYYY/MM/DD` format the frontend's dayjs
 * formatting produces, and rejects anything unparseable instead of silently
 * becoming an Invalid Date.
 */
export const dateInput = z.preprocess((value) => {
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    const slash = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (slash) {
      return new Date(
        Number(slash[1]),
        Number(slash[2]) - 1,
        Number(slash[3]),
      );
    }
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? trimmed : parsed;
  }
  return value;
}, z.date({ invalid_type_error: "Invalid date", required_error: "Required" }));

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email("Must be a valid email")
  .max(120);

export const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128);

export const leaveStatus = z.enum(["Pending", "Approved", "Rejected"]);

export const leaveType = z.enum(["Paid", "Sick", "Casual", "Unpaid"]);

export const attendanceStatus = z.enum([
  "Present",
  "Half-Day",
  "Completed",
  "Absent",
  "On Leave",
  "Late",
]);

/** Query params that are optional free-text: reject absurd lengths, keep "" usable. */
export const optionalText = (max = 120) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""));