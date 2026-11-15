import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import {
  app,
  startDatabase,
  stopDatabase,
  resetDatabase,
  createUser,
} from "./helpers.js";

describe("Phase 1 CSRF double-submit", () => {
  beforeAll(startDatabase);
  afterAll(stopDatabase);
  beforeEach(resetDatabase);

  const login = async (agent, email) => {
    const res = await agent
      .post("/api/auth/login")
      .send({ email, password: "Password123!" });
    return res.body.csrfToken;
  };

  it("exempts login so there is no token to present yet", async () => {
    await createUser({ email: "alice@example.com" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "Password123!" });

    expect(res.status).toBe(200);
  });

  it("blocks a state-changing request that omits the CSRF header", async () => {
    await createUser({ email: "alice@example.com" });
    const agent = request.agent(app);
    await login(agent, "alice@example.com");

    const res = await agent.post("/api/attendance/punch-in").send({});

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("CSRF_TOKEN_INVALID");
  });

  it("blocks a header that does not match the cookie", async () => {
    await createUser({ email: "alice@example.com" });
    const agent = request.agent(app);
    await login(agent, "alice@example.com");

    const res = await agent
      .post("/api/attendance/punch-in")
      .set("X-CSRF-Token", "forged-token")
      .send({});

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("CSRF_TOKEN_INVALID");
  });

  it("allows the request when the header matches the cookie", async () => {
    const { email } = await createUser({ email: "alice@example.com" });
    const agent = request.agent(app);
    const csrfToken = await login(agent, email);

    const res = await agent
      .post("/api/attendance/punch-in")
      .set("X-CSRF-Token", csrfToken)
      .send({});

    expect(res.status).toBe(200);
  });

  it("never requires a CSRF header on safe methods", async () => {
    await createUser({ email: "alice@example.com" });
    const agent = request.agent(app);
    await login(agent, "alice@example.com");

    expect((await agent.get("/api/auth/me")).status).toBe(200);
  });
});