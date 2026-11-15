import { z } from "zod";
import {
  emailField,
  objectId,
  optionalText,
  paginationSchema,
  passwordField,
} from "./common.js";

// multipart/form-data fields arrive as strings; coerce numbers explicitly.
const salaryField = z.coerce
  .number({ invalid_type_error: "Salary must be a number" })
  .min(0, "Salary cannot be negative")
  .max(100_000_000);

const phoneField = optionalText(32);

const employeeWritable = {
  name: z.string().trim().min(1, "Name is required").max(80),
  email: emailField,
  address: optionalText(255),
  position: z.string().trim().min(1, "Position is required").max(80),
  salary: salaryField,
  phone: phoneField,
  department: z.union([objectId, z.literal("")]).optional(),
};

export const createEmployeeSchema = z.object({
  userId: objectId,
  ...employeeWritable,
});

export const updateEmployeeSchema = z
  .object(employeeWritable)
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

// Self-service profile edit: no email, no salary, no department reassignment.
export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(80).optional(),
    address: optionalText(255),
    phone: phoneField,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required").max(128),
  newPassword: passwordField,
});

export const listEmployeesQuerySchema = paginationSchema.extend({
  search: optionalText(120),
  department: z.union([objectId, z.literal("")]).optional(),
});