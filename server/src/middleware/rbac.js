import { getProjectById, getProjectMember } from "../services/db.js";

export async function requireProjectMember(req, res, next) {
  const projectId = req.params.id || req.params.projectId;

  if (!projectId) {
    return res.status(400).json({ error: "Missing project id" });
  }

  const { data: membership } = await getProjectMember(projectId, req.profile.id);

  if (!membership) {
    return res.status(403).json({ error: "Not a project member" });
  }

  req.projectRole = membership.role;
  return next();
}

export async function requireProjectAdmin(req, res, next) {
  const projectId = req.params.id || req.params.projectId;

  if (!projectId) {
    return res.status(400).json({ error: "Missing project id" });
  }

  const { data: project } = await getProjectById(projectId);
  const { data: membership } = await getProjectMember(projectId, req.profile.id);

  const isOwner = project && project.owner_id === req.profile.id;
  const isAdmin = membership && membership.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  req.projectRole = membership ? membership.role : "admin";
  return next();
}

export async function requireProjectManager(req, res, next) {
  const projectId = req.params.id || req.params.projectId;

  if (!projectId) {
    return res.status(400).json({ error: "Missing project id" });
  }

  const { data: project } = await getProjectById(projectId);
  const { data: membership } = await getProjectMember(projectId, req.profile.id);

  const isOwner = project && project.owner_id === req.profile.id;
  const isAdmin = membership && membership.role === "admin";
  const isManager = membership && membership.role === "manager";

  if (!isOwner && !isAdmin && !isManager) {
    return res.status(403).json({ error: "Admin access required" });
  }

  req.projectRole = membership ? membership.role : "admin";
  return next();
}
