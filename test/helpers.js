import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import bcrypt from "bcrypt";

import app from "../app.js";
import User from "../models/user.js";
import Employee from "../models/employee.js";

export let mongoServer;

export async function startDatabase() {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}

export async function stopDatabase() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongoServer?.stop();
}

export async function resetDatabase() {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({})),
  );
}

/** Creates a linked User + Employee pair and returns both records. */
export async function createUser({ role = "employee", email, password = "Password123!" }) {
  const user = await User.create({
    name: email.split("@")[0],
    email,
    password: await bcrypt.hash(password, 10),
    role,
  });

  const employee = await Employee.create({
    name: user.name,
    email,
    position: "Tester",
    salary: 1000,
  });

  user.employeeId = employee._id;
  await user.save();

  return { user, employee, password, email };
}

export { app };

/** Reads a single cookie value out of a supertest response's set-cookie header. */
export function cookieValue(res, name) {
  const header = res.headers["set-cookie"] ?? [];
  const match = header.find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split(";")[0].split("=")[1]) : undefined;
}