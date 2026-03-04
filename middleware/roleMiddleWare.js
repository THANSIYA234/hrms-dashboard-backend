export const authorizeRole = (role) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  // Block demo user for modifying routes
  const isDemo = req.user.email === "demo@admin.com";

  // If role matches but user is demo trying to modify
  if (isDemo) {
    return res.status(403).json({
      message: "Demo account is read-only. Modifications are not allowed.",
    });
  }

  if (req.user.role !== role) {
    return res.status(403).json({ message: "Access denied" });
  }

  next();
};
