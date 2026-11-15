import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import fs from "node:fs";
import path from "node:path";
import {
  app,
  startDatabase,
  stopDatabase,
  resetDatabase,
  createUser,
} from "./helpers.js";

const UPLOAD_DIR = path.resolve("uploads/profilePics");
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from("fake-png-body"),
]);

describe("Phase 1 file access + upload hardening", () => {
  beforeAll(startDatabase);
  afterAll(stopDatabase);
  beforeEach(resetDatabase);

  const signIn = async (agent, email) => {
    const res = await agent
      .post("/api/auth/login")
      .send({ email, password: "Password123!" });
    return res.body.csrfToken;
  };

  it("serves a profile picture to an authenticated caller", async () => {
    const filename = "2b1e4c8a-1111-2222-3333-444455556666.png";
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), PNG);

    await createUser({ email: "alice@example.com" });
    const agent = request.agent(app);
    await signIn(agent, "alice@example.com");

    const res = await agent.get(`/api/files/profilePics/${filename}`);

    expect(res.status).toBe(200);
    expect(res.body.equals(PNG)).toBe(true);
  });

  it("refuses anonymous access to profile pictures", async () => {
    const filename = "2b1e4c8a-1111-2222-3333-444455556667.png";
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), PNG);

    const res = await request(app).get(`/api/files/profilePics/${filename}`);

    expect(res.status).toBe(401);
  });

  it("no longer exposes the old public /uploads mount", async () => {
    const res = await request(app).get("/uploads/profilePics/anything.png");
    expect(res.status).toBe(404);
  });

  it("rejects traversal and non-image filenames", async () => {
    await createUser({ email: "alice@example.com" });
    const agent = request.agent(app);
    await signIn(agent, "alice@example.com");

    const res = await agent.get(
      "/api/files/profilePics/..%2F..%2F..%2Fetc%2Fpasswd",
    );

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_FILENAME");
  });

  it("rejects a file whose content is not actually an image", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const agent = request.agent(app);
    const csrfToken = await signIn(agent, "admin@example.com");
    const { user } = await createUser({ email: "target@example.com" });

    const res = await agent
      .post("/api/employee")
      .set("X-CSRF-Token", csrfToken)
      .field("userId", String(user._id))
      .field("name", "Mallory")
      .field("email", "mallory@example.com")
      .field("position", "Intern")
      .field("salary", "1000")
      .attach("profileImage", Buffer.from("<script>alert(1)</script>"), {
        filename: "payload.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_FILE_TYPE");
  });

  it("rejects an upload larger than 2MB", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const agent = request.agent(app);
    const csrfToken = await signIn(agent, "admin@example.com");
    const { user } = await createUser({ email: "target@example.com" });

    const oversized = Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024 + 1024)]);

    const res = await agent
      .post("/api/employee")
      .set("X-CSRF-Token", csrfToken)
      .field("userId", String(user._id))
      .field("name", "Mallory")
      .field("email", "mallory@example.com")
      .field("position", "Intern")
      .field("salary", "1000")
      .attach("profileImage", oversized, {
        filename: "big.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("FILE_TOO_LARGE");
  });

  it("stores an accepted image under a random uuid filename", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const agent = request.agent(app);
    const csrfToken = await signIn(agent, "admin@example.com");
    const { user } = await createUser({ email: "target@example.com" });

    const res = await agent
      .post("/api/employee")
      .set("X-CSRF-Token", csrfToken)
      .field("userId", String(user._id))
      .field("name", "Mallory")
      .field("email", "mallory@example.com")
      .field("position", "Intern")
      .field("salary", "1000")
      .attach("profileImage", PNG, {
        filename: "evil-name.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(201);

    const stored = res.body.employee.profileImage;
    expect(stored).toMatch(
      /^uploads\/profilePics\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/,
    );
  });
});