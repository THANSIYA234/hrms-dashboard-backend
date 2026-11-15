import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { app, startDatabase, stopDatabase } from "./helpers.js";

describe("Phase 1 hardening: health, headers, body limits", () => {
  beforeAll(startDatabase);
  afterAll(stopDatabase);

  it("reports liveness without touching the database", async () => {
    const res = await request(app).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(typeof res.body.uptime).toBe("number");
  });

  it("reports readiness only when Mongo answers", async () => {
    const res = await request(app).get("/readyz");
    expect(res.status).toBe(200);
    expect(res.body.db).toBe("ok");
  });

  it("sets security headers", async () => {
    const res = await request(app).get("/healthz");

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
    expect(res.headers["content-security-policy"]).toBeDefined();
    // helmet removes the fingerprinting header
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  it("lets a cross-origin frontend load served files", async () => {
    const res = await request(app).get("/healthz");

    // helmet defaults this to "same-origin", which silently breaks every
    // profile image rendered by the separately-hosted frontend.
    expect(res.headers["cross-origin-resource-policy"]).toBe("cross-origin");
  });

  it("rejects a JSON body over the 100kb limit", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "a@b.com", password: "x".repeat(200_000) });

    expect(res.status).toBe(413);
  });
});