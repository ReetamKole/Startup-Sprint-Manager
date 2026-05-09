import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { supabaseAdmin } from "../services/supabaseAdmin.js";

export function dashboardRoutes() {
  const router = Router();

  const getIstDateString = () =>
    new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  router.get("/summary", requireAuth, async (req, res) => {
    const today = getIstDateString();

    const { data: allTasks, error: allTasksError } = await supabaseAdmin
      .from("tasks")
      .select("id,status,priority,due_date,project_id,projects(name)")
      .eq("assignee_id", req.profile.id);

    const [{ data: myTasks, error: myTasksError }, { data: overdueTasks, error: overdueError }]
      = await Promise.all([
        supabaseAdmin
          .from("tasks")
          .select("id,status,project_id,projects(name)")
          .eq("assignee_id", req.profile.id),
        supabaseAdmin
          .from("tasks")
          .select("id,status,project_id,projects(name)")
          .eq("assignee_id", req.profile.id)
          .lt("due_date", today)
          .neq("status", "done")
      ]);

    if (myTasksError || overdueError || allTasksError) {
      return res.status(500).json({ error: "Failed to load dashboard" });
    }

    const groupByProject = (rows) => {
      const map = new Map();

      rows.forEach((task) => {
        const key = task.project_id;
        if (!map.has(key)) {
          map.set(key, {
            projectId: key,
            projectName: task.projects?.name || "Untitled project",
            total: 0,
            remaining: 0,
            inProgress: 0,
            done: 0
          });
        }

        const entry = map.get(key);
        entry.total += 1;
        if (task.status === "done") {
          entry.done += 1;
        } else if (task.status === "in_progress") {
          entry.inProgress += 1;
          entry.remaining += 1;
        } else {
          entry.remaining += 1;
        }
      });

      return Array.from(map.values());
    };

    const myProjects = groupByProject(myTasks || []);
    const overdueProjects = groupByProject(overdueTasks || []);

    const priorityBreakdown = {
      high: { count: 0, projects: new Set() },
      medium: { count: 0, projects: new Set() },
      low: { count: 0, projects: new Set() }
    };

    const dateBreakdown = {
      due: { count: 0, projects: new Set() },
      due_today: { count: 0, projects: new Set() },
      overdue: { count: 0, projects: new Set() }
    };

    (allTasks || []).forEach((task) => {
      const projectName = task.projects?.name || "Untitled project";

      if (task.priority && priorityBreakdown[task.priority]) {
        priorityBreakdown[task.priority].count += 1;
        priorityBreakdown[task.priority].projects.add(projectName);
      }

      if (task.due_date && task.status !== "done") {
        if (task.due_date < today) {
          dateBreakdown.overdue.count += 1;
          dateBreakdown.overdue.projects.add(projectName);
        } else if (task.due_date === today) {
          dateBreakdown.due_today.count += 1;
          dateBreakdown.due_today.projects.add(projectName);
        } else {
          dateBreakdown.due.count += 1;
          dateBreakdown.due.projects.add(projectName);
        }
      }
    });

    const normalizeBreakdown = (breakdown) =>
      Object.fromEntries(
        Object.entries(breakdown).map(([key, value]) => [
          key,
          {
            count: value.count,
            projects: Array.from(value.projects)
          }
        ])
      );

    return res.json({
      myTasks: myTasks?.length || 0,
      overdueTasks: overdueTasks?.length || 0,
      myProjects,
      overdueProjects,
      priorityBreakdown: normalizeBreakdown(priorityBreakdown),
      dateBreakdown: normalizeBreakdown(dateBreakdown)
    });
  });

  return router;
}
