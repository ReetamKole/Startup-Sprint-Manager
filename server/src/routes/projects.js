import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireProjectAdmin, requireProjectManager, requireProjectMember } from "../middleware/rbac.js";
import { getProjectById } from "../services/db.js";
import { supabaseAdmin } from "../services/supabaseAdmin.js";

const validRoles = new Set(["admin", "manager", "member"]);

export function projectRoutes() {
  const router = Router();

  router.get("/", requireAuth, async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from("projects")
      .select(
        "id,name,description,owner_id,created_at,profiles(name,email),project_members!inner(role)"
      )
      .eq("project_members.profile_id", req.profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: "Failed to load projects" });
    }

    const projectIds = data.map((project) => project.id);
    let taskRows = [];

    if (projectIds.length > 0) {
      const istToday = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata"
      });
      const istTodayDate = new Date(`${istToday}T00:00:00+05:30`);

      const { data: tasks, error: tasksError } = await supabaseAdmin
        .from("tasks")
        .select("id,project_id,status,priority,due_date")
        .eq("assignee_id", req.profile.id)
        .in("project_id", projectIds);

      if (tasksError) {
        return res.status(500).json({ error: "Failed to load project tasks" });
      }

      taskRows = tasks || [];

      taskRows = taskRows.map((task) => {
        const dueDate = task.due_date
          ? new Date(`${task.due_date}T00:00:00+05:30`)
          : null;

        return {
          ...task,
          isOverdue: Boolean(dueDate) && dueDate < istTodayDate && task.status !== "done"
        };
      });
    }

    const projects = data.map((project) => ({
      ...project,
      role: project.project_members?.[0]?.role || "member",
      project_members: undefined,
      owner: project.profiles || null
    }));

    const countsByProject = taskRows.reduce((acc, task) => {
      if (!acc[task.project_id]) {
        acc[task.project_id] = {
          pending: 0,
          overdue: 0,
          pendingByPriority: { low: 0, medium: 0, high: 0 },
          nextDueDate: null
        };
      }

      if (task.status !== "done") {
        acc[task.project_id].pending += 1;
        if (task.isOverdue) {
          acc[task.project_id].overdue += 1;
        }

        if (task.priority && acc[task.project_id].pendingByPriority[task.priority] !== undefined) {
          acc[task.project_id].pendingByPriority[task.priority] += 1;
        }

        if (task.due_date) {
          const currentNext = acc[task.project_id].nextDueDate;
          if (!currentNext || task.due_date < currentNext) {
            acc[task.project_id].nextDueDate = task.due_date;
          }
        }
      }

      return acc;
    }, {});

    const enriched = projects.map((project) => ({
      ...project,
      pendingTasks: countsByProject[project.id]?.pending || 0,
      overdueTasks: countsByProject[project.id]?.overdue || 0,
      pendingByPriority: countsByProject[project.id]?.pendingByPriority || {
        low: 0,
        medium: 0,
        high: 0
      },
      nextDueDate: countsByProject[project.id]?.nextDueDate || null
    }));

    return res.json({ projects: enriched });
  });

  router.post("/", requireAuth, async (req, res) => {
    const name = (req.body?.name || "").trim();
    const description = (req.body?.description || "").trim();
    const memberEmails = Array.isArray(req.body?.memberEmails)
      ? req.body.memberEmails.map((email) => (email || "").trim().toLowerCase())
      : [];

    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    if (!description) {
      return res.status(400).json({ error: "Project description is required" });
    }

    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .insert({
        name,
        description,
        owner_id: req.profile.id
      })
      .select("*")
      .single();

    if (error) {
      return res.status(500).json({ error: "Failed to create project" });
    }

    await supabaseAdmin.from("project_members").insert({
      project_id: project.id,
      profile_id: req.profile.id,
      role: "admin"
    });

    if (memberEmails.length > 0) {
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, email")
        .in("email", memberEmails);

      if (profileError) {
        return res.status(500).json({ error: "Failed to load members" });
      }

      const foundEmails = new Set((profiles || []).map((profile) => profile.email));
      const missing = memberEmails.filter((email) => !foundEmails.has(email));

      if (missing.length > 0) {
        return res.status(404).json({
          error: `User not found: ${missing.join(", ")}`
        });
      }

      if (profiles && profiles.length > 0) {
        await supabaseAdmin.from("project_members").insert(
          profiles.map((profile) => ({
            project_id: project.id,
            profile_id: profile.id,
            role: "member"
          }))
        );
      }
    }

    return res.status(201).json({ project });
  });

  router.get("/:id", requireAuth, requireProjectMember, async (req, res) => {
    const { data: project, error } = await getProjectById(req.params.id);

    if (error || !project) {
      return res.status(404).json({ error: "Project not found" });
    }

    return res.json({ project, role: req.projectRole });
  });

  router.patch("/:id", requireAuth, requireProjectManager, async (req, res) => {
    const name = (req.body?.name || "").trim();
    const description = (req.body?.description || "").trim();

    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .update({ name, description: description || null })
      .eq("id", req.params.id)
      .select("*")
      .single();

    if (error || !project) {
      return res.status(500).json({ error: "Failed to update project" });
    }

    return res.json({ project });
  });

  router.delete("/:id", requireAuth, requireProjectManager, async (req, res) => {
    const { error } = await supabaseAdmin
      .from("projects")
      .delete()
      .eq("id", req.params.id);

    if (error) {
      return res.status(500).json({ error: "Failed to delete project" });
    }

    return res.status(204).send();
  });

  router.post("/:id/members", requireAuth, requireProjectAdmin, async (req, res) => {
    const email = (req.body?.email || "").trim().toLowerCase();
    const role = req.body?.role || "member";

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!validRoles.has(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (!profile) {
      return res.status(404).json({ error: "User not found" });
    }

    const { data: existing } = await supabaseAdmin
      .from("project_members")
      .select("id")
      .eq("project_id", req.params.id)
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: "User already in project" });
    }

    const { data: member, error } = await supabaseAdmin
      .from("project_members")
      .insert({
        project_id: req.params.id,
        profile_id: profile.id,
        role
      })
      .select("*")
      .single();

    if (error) {
      return res.status(500).json({ error: "Failed to add member" });
    }

    return res.status(201).json({ member });
  });

  router.get("/:id/members", requireAuth, requireProjectMember, async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from("project_members")
      .select("id, role, profiles(id, name, email)")
      .eq("project_id", req.params.id)
      .order("created_at", { ascending: true });

    if (error) {
      return res.status(500).json({ error: "Failed to load members" });
    }

    const members = data.map((row) => ({
      id: row.id,
      role: row.role,
      profile: row.profiles
    }));

    return res.json({ members });
  });

  router.delete(
    "/:id/members/:memberId",
    requireAuth,
    requireProjectAdmin,
    async (req, res) => {
      const { error } = await supabaseAdmin
        .from("project_members")
        .delete()
        .eq("id", req.params.memberId)
        .eq("project_id", req.params.id);

      if (error) {
        return res.status(500).json({ error: "Failed to remove member" });
      }

      return res.status(204).send();
    }
  );

  router.patch(
    "/:id/members/:memberId",
    requireAuth,
    requireProjectAdmin,
    async (req, res) => {
      const role = req.body?.role || "member";

      if (!validRoles.has(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const { data: member, error } = await supabaseAdmin
        .from("project_members")
        .update({ role })
        .eq("id", req.params.memberId)
        .eq("project_id", req.params.id)
        .select("id, role, profiles(id, name, email)")
        .single();

      if (error || !member) {
        return res.status(500).json({ error: "Failed to update member" });
      }

      return res.json({
        member: {
          id: member.id,
          role: member.role,
          profile: member.profiles
        }
      });
    }
  );

  return router;
}
