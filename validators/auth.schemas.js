import { z } from "zod";
import { emailField, passwordField } from "./common.js";

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required").max(128),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: emailField,
  password: passwordField,
  role: z.enum(["employee", "manager", "admin"]).optional(),
});