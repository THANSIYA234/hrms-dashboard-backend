import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { app, startDatabase, stopDatabase, resetDatabase, createUser, cookieValue } from "./helpers.js";
import User from "../models/user.js";

describe("Phase 1 auth: httpOnly cookies, rotation, lockout", () => {
  beforeAll(startDatabase);
  afterAll(stopDatabase);
  beforeEach(resetDatabase);

  const login = (agent, email, password = "Password123!") =>
    agent.post("/api/auth/login").send({ email, password });

  it("never returns the access token in the response body", async () => {
    const { password } = await createUser({ email: "alice@example.com" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeUndefined();
    expect(res.body.refreshToken).toBeUndefined();
    expect(res.body.user.email).toBe("alice@example.com");
    expect(res.body.csrfToken).toEqual(expect.any(String));
    expect(password).toBeTruthy();
  });

  it("sets access and refresh tokens as httpOnly cookies scoped to /api", async () => {
    await createUser({ email: "alice@example.com" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "Password123!" });

    const cookies = res.headers["set-cookie"];
    const access = cookies.find((c) => c.startsWith("accessToken="));
    const refresh = cookies.find((c) => c.startsWith("refreshToken="));

    expect(access).toMatch(/HttpOnly/i);
    expect(access).toMatch(/Path=\/api;/);
    expect(refresh).toMatch(/HttpOnly/i);
    expect(refresh).toMatch(/Path=\/api\/auth/);
  });

  it("gives the same answer for an unknown email and a wrong password", async () => {
    await createUser({ email: "alice@example.com" });

    const unknown = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "Password123!" });
    const wrong = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "WrongPassword1!" });

    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body).toEqual(wrong.body);
    expect(unknown.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("locks the account after 5 failed attempts and rejects the correct password with 423", async () => {
    await createUser({ email: "alice@example.com" });

    for (let i = 0; i < 5; i += 1) {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "alice@example.com", password: "WrongPassword1!" });
      expect(res.status).toBe(401);
    }

    const locked = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "Password123!" });

    expect(locked.status).toBe(423);
    expect(locked.body.error.code).toBe("ACCOUNT_LOCKED");
  });

  it("stores only a hash of the refresh token in Mongo", async () => {
    const { user } = await createUser({ email: "alice@example.com" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "Password123!" });

    const raw = cookieValue(res, "refreshToken");

    const stored = await User.findById(user._id).select("refreshTokenHash");
    expect(stored.refreshTokenHash).toEqual(expect.any(String));
    expect(stored.refreshTokenHash).not.toBe(raw);
    expect(stored.refreshTokenHash).toHaveLength(64); // sha256 hex
  });

  it("rotates the refresh token and rejects the old one on replay", async () => {
    await createUser({ email: "alice@example.com" });
    const agent = request.agent(app);

    const loginRes = await login(agent, "alice@example.com");
    const firstRefresh = cookieValue(loginRes, "refreshToken");

    const refreshed = await agent.post("/api/auth/refresh").send({});
    expect(refreshed.status).toBe(200);

    const secondRefresh = cookieValue(refreshed, "refreshToken");

    expect(secondRefresh).toEqual(expect.any(String));
    expect(secondRefresh).not.toBe(firstRefresh);

    // Replay the pre-rotation token against a fresh client.
    const replay = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", `refreshToken=${firstRefresh}`)
      .send({});

    expect(replay.status).toBe(401);
    expect(replay.body.error.code).toBe("INVALID_REFRESH_TOKEN");
  });

  it("answers /auth/me from the cookie and rejects anonymous callers", async () => {
    await createUser({ email: "alice@example.com", role: "admin" });
    const agent = request.agent(app);

    const anonymous = await agent.get("/api/auth/me");
    expect(anonymous.status).toBe(401);

    await login(agent, "alice@example.com");
    const me = await agent.get("/api/auth/me");

    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe("alice@example.com");
    expect(me.body.user.role).toBe("admin");
    expect(me.body.user.password).toBeUndefined();
  });

  it("invalidates the refresh token on logout", async () => {
    await createUser({ email: "alice@example.com" });
    const agent = request.agent(app);

    await login(agent, "alice@example.com");
    expect((await agent.post("/api/auth/logout").send({})).status).toBe(200);

    const after = await agent.post("/api/auth/refresh").send({});
    expect(after.status).toBe(401);
  });
});