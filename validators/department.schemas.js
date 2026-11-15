import { z } from "zod";
import { objectId, optionalText } from "./common.js";

const departmentWritable = {
  name: z.string().trim().min(1, "Name is required").max(80),
  description: optionalText(255),
  head: z.union([objectId, z.literal("")]).optional(),
};

export const createDepartmentSchema = z.object({
  name: departmentWritable.name,
  description: departmentWritable.description,
  head: departmentWritable.head,
});

export const updateDepartmentSchema = z
  .object(departmentWritable)
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// Shared by POST /assign and POST /assign-head
export const assignDepartmentSchema = z.object({
  departmentId: objectId,
  employeeId: objectId,
});