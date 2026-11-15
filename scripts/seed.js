/**
 * Creates the demo admin (User + Employee pair) and prints the generated
 * password exactly once — nothing is written to a file or a README.
 *
 *   node scripts/seed.js            # create (refuses if the account exists)
 *   node scripts/seed.js --force    # reset the password of an existing account
 */
import "dotenv/config";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import connectDB from "../config/db.js";
import User from "../models/user.js";
import Employee from "../models/employee.js";

const DEMO_EMAIL = process.env.DEMO_ADMIN_EMAIL || "demo@admin.com";
const force = process.argv.includes("--force");

const randomPassword = () => {
  // Ambiguous characters stripped so the password can be typed from a terminal.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  return Array.from(crypto.randomBytes(20))
    .map((byte) => alphabet[byte % alphabet.length])
    .join("");
};

const seed = async () => {
  await connectDB();

  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing && !force) {
    console.log(`Account ${DEMO_EMAIL} already exists. Use --force to reset it.`);
    return;
  }

  const password = randomPassword();
  const hashed = await bcrypt.hash(password, 10);

  let user;
  if (existing) {
    existing.password = hashed;
    existing.failedLoginAttempts = 0;
    existing.lockUntil = null;
    await existing.save();
    user = existing;
    console.log(`Password reset for ${DEMO_EMAIL}.`);
  } else {
    user = await User.create({
      name: "Demo Admin",
      email: DEMO_EMAIL,
      password: hashed,
      role: "admin",
    });
    console.log(`Created ${DEMO_EMAIL}.`);
  }

  const employee =
    (await Employee.findOne({ email: DEMO_EMAIL })) ??
    (await Employee.create({
      name: "Demo Admin",
      email: DEMO_EMAIL,
      position: "Administrator",
      salary: 0,
    }));

  user.employeeId = employee._id;
  await user.save();

  console.log("\n--- demo credentials (shown once) ---");
  console.log(`email:    ${DEMO_EMAIL}`);
  console.log(`password: ${password}`);
  console.log("-----------------------------------------\n");
};

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });