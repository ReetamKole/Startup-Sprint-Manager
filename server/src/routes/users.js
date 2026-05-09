import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";

export function userRoutes() {
  const router = Router();

  router.get("/me", requireAuth, async (req, res) => {
    res.json({ user: req.user, profile: req.profile });
  });

  return router;
}
