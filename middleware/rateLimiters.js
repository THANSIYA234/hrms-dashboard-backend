import rateLimit from "express-rate-limit";

const shared = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
};

/** Credential endpoints: tight budget so online password guessing is useless. */
export const authLimiter = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  // Successful logins should not consume the budget.
  skipSuccessfulRequests: true,
  handler: (req, res) =>
    res.status(429).json({
      error: { code: "RATE_LIMIT", message: "Too many attempts, try again later" },
    }),
});

/** Everything else: generous enough for dashboard polling. */
export const generalLimiter = rateLimit({
  ...shared,
  windowMs: 60 * 1000,
  limit: 300,
  handler: (req, res) =>
    res.status(429).json({
      error: { code: "RATE_LIMIT", message: "Too many requests" },
    }),
});

export default { authLimiter, generalLimiter };