import express from "express";
import mongoose from "mongoose";

const router = express.Router();

/** Liveness: process is up. Never touches the database. */
router.get("/healthz", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

/** Readiness: process can serve traffic, i.e. Mongo answers a ping. */
router.get("/readyz", async (_req, res) => {
  try {
    await mongoose.connection.db.admin().command({ ping: 1 });
    res.json({ db: "ok" });
  } catch {
    res.status(503).json({ db: "error" });
  }
});

export default router;