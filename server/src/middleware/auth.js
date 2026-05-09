import { supabaseAuthClient } from "../services/supabaseClient.js";
import { getProfileByUserId } from "../services/db.js";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return res.status(401).json({ error: "Missing access token" });
  }

  const { data, error } = await supabaseAuthClient.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid access token" });
  }

  const { data: profile } = await getProfileByUserId(data.user.id);

  if (!profile) {
    return res.status(403).json({ error: "Profile not found" });
  }

  req.user = data.user;
  req.profile = profile;
  return next();
}
