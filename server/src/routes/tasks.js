import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireProjectManager, requireProjectMember } from "../middleware/rbac.js";
import { getProjectById, getProjectMember } from "../services/db.js";
import { supabaseAdmin } from "../services/supabaseAdmin.js";

const validStatuses = new Set(["todo", "in_progress", "done"]);
const validPriorities = new Set(["low", "medium", "high"]);

export function taskRoutes() {
  const router = Router();

  router.get("/projects/:projectId/tasks", requireAuth, requireProjectMember, async (req, res) => {
    const istToday = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata"
    });
    const istTodayDate = new Date(`${istToday}T00:00:00+05:30`);
    const { data, error } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("project_id", req.params.projectId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: "Failed to load tasks" });
    }

    const tasks = (data || []).map((task) => {
      const dueDate = task.due_date
        ? new Date(`${task.due_date}T00:00:00+05:30`)
        : null;

      return {
        ...task,
        isOverdue: Boolean(dueDate) && dueDate < istTodayDate && task.status !== "done"
      };
    });

    return res.json({ tasks });
  });

  router.post("/projects/:projectId/tasks", requireAuth, requireProjectMember, async (req, res) => {
    const { data: project } = await getProjectById(req.params.projectId);
    const { data: membership } = await getProjectMember(
      req.params.projectId,
      req.profile.id
    );

    const isOwner = project && project.owner_id === req.profile.id;
    const isAdmin = membership && membership.role === "admin";
    const isManager = membership && membership.role === "manager";

    if (!isOwner && !isAdmin && !isManager) {
      return res.status(403).json({ error: "Admin access required" });
    }
    const title = (req.body?.title || "").trim();
    const description = (req.body?.description || "").trim();
    const status = req.body?.status || "todo";
    const priority = req.body?.priority || "medium";
    const dueDate = req.body?.dueDate || null;
    const assigneeId = req.body?.assigneeId || null;

    if (!title) {
      return res.status(400).json({ error: "Task title is required" });
    }

    if (!description) {
      return res.status(400).json({ error: "Task description is required" });
    }

    if (!assigneeId) {
      return res.status(400).json({ error: "Assignee is required" });
    }

    if (!dueDate) {
      return res.status(400).json({ error: "Due date is required" });
    }

    if (!validStatuses.has(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    if (!validPriorities.has(priority)) {
      return res.status(400).json({ error: "Invalid priority" });
    }

    const { data: assigneeMembership } = await getProjectMember(
      req.params.projectId,
      assigneeId
    );

    if (!assigneeMembership) {
      return res.status(400).json({ error: "Assignee must be a project member" });
    }

    const { data: task, error } = await supabaseAdmin
      .from("tasks")
      .insert({
        project_id: req.params.projectId,
        title,
        description: description || null,
        status,
        priority,
        due_date: dueDate,
        assignee_id: assigneeId,
        created_by_id: req.profile.id
      })
      .select("*")
      .single();

    if (error) {
      return res.status(500).json({ error: "Failed to create task" });
    }

    return res.status(201).json({ task });
  });

  router.patch("/tasks/:id", requireAuth, async (req, res) => {
    const { data: task } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const { data: membership } = await getProjectMember(task.project_id, req.profile.id);

    if (!membership) {
      return res.status(403).json({ error: "Not a project member" });
    }

    const { data: project } = await getProjectById(task.project_id);
    const isOwner = project && project.owner_id === req.profile.id;
    const isAdmin = membership.role === "admin";
    const isManager = membership.role === "manager";
    const isMember = !isOwner && !isAdmin && !isManager;

    if (isMember) {
      const requestedKeys = Object.keys(req.body || {});
      const isStatusOnly =
        requestedKeys.length > 0 &&
        requestedKeys.every((key) => key === "status");

      if (!isStatusOnly) {
        return res.status(403).json({ error: "Only status updates are allowed" });
      }
    }

    const updates = {};

    if (req.body?.title !== undefined) {
      const title = (req.body.title || "").trim();
      if (!title) {
        return res.status(400).json({ error: "Task title is required" });
      }
      updates.title = title;
    }

    if (req.body?.description !== undefined) {
      updates.description = req.body.description || null;
    }

    if (req.body?.status !== undefined) {
      if (!validStatuses.has(req.body.status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      if (task.assignee_id !== req.profile.id) {
        return res.status(403).json({ error: "Only the assignee can change status" });
      }
      updates.status = req.body.status;
    }

    if (req.body?.priority !== undefined) {
      if (!validPriorities.has(req.body.priority)) {
        return res.status(400).json({ error: "Invalid priority" });
      }
      updates.priority = req.body.priority;
    }

    if (req.body?.dueDate !== undefined) {
      updates.due_date = req.body.dueDate || null;
    }

    if (req.body?.assigneeId !== undefined) {
      if (req.body.assigneeId) {
        const { data: assigneeMembership } = await getProjectMember(
          task.project_id,
          req.body.assigneeId
        );
        if (!assigneeMembership) {
          return res.status(400).json({ error: "Assignee must be a project member" });
        }
      }
      updates.assignee_id = req.body.assigneeId || null;
    }

    const { data: updatedTask, error } = await supabaseAdmin
      .from("tasks")
      .update(updates)
      .eq("id", req.params.id)
      .select("*")
      .single();

    if (error) {
      return res.status(500).json({ error: "Failed to update task" });
    }

    return res.json({ task: updatedTask });
  });

  router.delete("/tasks/:id", requireAuth, async (req, res) => {
    const { data: task } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const { data: membership } = await getProjectMember(task.project_id, req.profile.id);
    const { data: project } = await getProjectById(task.project_id);

    const isOwner = project && project.owner_id === req.profile.id;
    const isAdmin = membership && membership.role === "admin";
    const isManager = membership && membership.role === "manager";

    if (!isOwner && !isAdmin && !isManager) {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { error } = await supabaseAdmin.from("tasks").delete().eq("id", task.id);

    if (error) {
      return res.status(500).json({ error: "Failed to delete task" });
    }

    return res.status(204).send();
  });

  return router;
}
