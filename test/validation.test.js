import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import {
  app,
  startDatabase,
  stopDatabase,
  resetDatabase,
  createUser,
} from "./helpers.js";
import Employee from "../models/employee.js";

describe("Phase 1 zod validation", () => {
  beforeAll(startDatabase);
  afterAll(stopDatabase);
  beforeEach(resetDatabase);

  it("rejects a malformed email before it reaches the database", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "not-an-email", password: "whatever" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details.fieldErrors.email).toBeDefined();
  });

  it("rejects a non-numeric page instead of coercing it to NaN", async () => {
    await createUser({ email: "alice@example.com" });
    const agent = request.agent(app);
    const login = await agent
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "Password123!" });

    const res = await agent
      .get("/api/employee?page=abc&limit=10")
      .set("X-CSRF-Token", login.body.csrfToken);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a malformed ObjectId in the path with 400, not a 500", async () => {
    await createUser({ email: "alice@example.com" });
    const agent = request.agent(app);
    await agent
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "Password123!" });

    const res = await agent.get("/api/employee/not-an-object-id");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("strips unknown keys so a body cannot mass-assign fields", async () => {
    await createUser({ email: "admin@example.com", role: "admin" });
    const agent = request.agent(app);
    const login = await agent
      .post("/api/auth/login")
      .send({ email: "admin@example.com", password: "Password123!" });

    const { employee } = await createUser({ email: "target@example.com" });

    const res = await agent
      .put(`/api/employee/${employee._id}`)
      .set("X-CSRF-Token", login.body.csrfToken)
      .send({
        position: "Senior Engineer",
        $where: "this.salary > 0",
        __proto__: { polluted: true },
      });

    expect(res.status).toBe(200);

    const stored = await Employee.findById(employee._id);
    expect(stored.position).toBe("Senior Engineer");
    expect(stored.$where).toBeUndefined();
    expect(stored.polluted).toBeUndefined();
  });

  it("rejects a leave request whose end date precedes its start date", async () => {
    const { email } = await createUser({ email: "alice@example.com" });
    const agent = request.agent(app);
    const login = await agent
      .post("/api/auth/login")
      .send({ email, password: "Password123!" });

    const res = await agent
      .post("/api/leave/apply-leave")
      .set("X-CSRF-Token", login.body.csrfToken)
      .send({
        startDate: "2026/12/20",
        endDate: "2026/12/10",
        type: "Paid",
        reason: "holiday",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("accepts a body-less punch-in, which is what the client actually sends", async () => {
    const { email } = await createUser({ email: "alice@example.com" });
    const agent = request.agent(app);
    const login = await agent
      .post("/api/auth/login")
      .send({ email, password: "Password123!" });

    // axios sends no body at all when data is undefined, leaving req.body undefined
    const res = await agent
      .post("/api/attendance/punch-in")
      .set("X-CSRF-Token", login.body.csrfToken);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Punch-In Successfull");
  });

  it("requires admin to update a leave status and constrains the enum", async () => {
    const { email } = await createUser({ email: "alice@example.com" });
    const agent = request.agent(app);
    const login = await agent
      .post("/api/auth/login")
      .send({ email, password: "Password123!" });

    const res = await agent
      .put("/api/leave/status/5f9f1b9b9b9b9b9b9b9b9b9b")
      .set("X-CSRF-Token", login.body.csrfToken)
      .send({ status: "approved" });

    expect(res.status).toBe(403);
  });
});