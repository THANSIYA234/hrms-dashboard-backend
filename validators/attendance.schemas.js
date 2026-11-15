import { z } from "zod";
import { dateInput, objectId, optionalText, paginationSchema } from "./common.js";

// Punch in/out take no meaningful body fields — the record is derived from the
// authenticated user and the current time. The client posts no body at all, so
// `req.body` arrives as undefined and has to be tolerated.
export const punchSchema = z.preprocess(
  (value) => value ?? {},
  z.object({}).passthrough(),
);

export const updateAttendanceSchema = z
  .object({
    punchIn: z.union([dateInput, z.null()]).optional(),
    punchOut: z.union([dateInput, z.null()]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "punchIn or punchOut is required",
  });

export const attendanceListQuerySchema = paginationSchema.extend({
  search: optionalText(120),
  department: z.union([objectId, z.literal("")]).optional(),
  date: z.union([dateInput, z.literal("")]).optional(),
});

export const attendanceFilterQuerySchema = z.object({
  start: dateInput,
  end: dateInput,
});

export const trendQuerySchema = z.object({
  date: z.union([dateInput, z.literal("")]).optional(),
});

// /filters and /today-snapshot read the same triplet
export const filtersQuerySchema = z.object({
  search: optionalText(120),
  department: z.union([objectId, z.literal("")]).optional(),
  date: z.union([dateInput, z.literal("")]).optional(),
});

export const workHoursByDateQuerySchema = z.object({
  date: dateInput,
});