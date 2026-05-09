import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";
import {
  addProjectMember,
  getProject,
  listProjectMembers,
  removeProjectMember,
  updateProjectMemberRole
} from "../api/projects.js";
import { createTask, deleteTask, listTasks, updateTask } from "../api/tasks.js";

export default function ProjectDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assigneeId: "",
    priority: "medium",
    dueDate: ""
  });
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("member");
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({
    member: "all",
    priority: "all",
    date: "all"
  });

  const { data: projectData } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(id),
    enabled: Boolean(id)
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members", id],
    queryFn: () => listProjectMembers(id),
    enabled: Boolean(id)
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks", id],
    queryFn: () => listTasks(id),
    enabled: Boolean(id)
  });

  const createTaskMutation = useMutation({
    mutationFn: (payload) => createTask(id, payload),
    onSuccess: () => {
      setTaskForm({
        title: "",
        description: "",
        assigneeId: "",
        priority: "medium",
        dueDate: ""
      });
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
    },
    onError: (error) => {
      const apiMessage = error?.response?.data?.error;
      setMessage(apiMessage || "Failed to create task.");
    }
  });

  const addMemberMutation = useMutation({
    mutationFn: (payload) => addProjectMember(id, payload),
    onSuccess: () => {
      setMemberEmail("");
      setMemberRole("member");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["members", id] });
    },
    onError: (error) => {
      const apiMessage = error?.response?.data?.error;
      setMessage(apiMessage || "Failed to add member.");
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, payload }) => updateTask(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
    },
    onError: (error) => {
      const apiMessage = error?.response?.data?.error;
      setMessage(apiMessage || "Failed to update task.");
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
    },
    onError: (error) => {
      const apiMessage = error?.response?.data?.error;
      setMessage(apiMessage || "Failed to delete task.");
    }
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ memberId, payload }) =>
      updateProjectMemberRole(id, memberId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", id] });
    },
    onError: (error) => {
      const apiMessage = error?.response?.data?.error;
      setMessage(apiMessage || "Failed to update member role.");
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId) => removeProjectMember(id, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", id] });
    },
    onError: (error) => {
      const apiMessage = error?.response?.data?.error;
      setMessage(apiMessage || "Failed to remove member.");
    }
  });

  const project = projectData?.project;
  const role = projectData?.role || "member";
  const canManageMembers = role === "admin";
  const canManageTasks = role === "admin" || role === "manager";

  const handleAddTask = (event) => {
    event.preventDefault();
    if (!taskForm.title.trim()) {
      setMessage("Task title is required.");
      return;
    }
    if (!taskForm.description.trim()) {
      setMessage("Task description is required.");
      return;
    }
    if (!taskForm.assigneeId) {
      setMessage("Assignee is required.");
      return;
    }
    if (!taskForm.priority) {
      setMessage("Priority is required.");
      return;
    }
    if (!taskForm.dueDate) {
      setMessage("Due date is required.");
      return;
    }
    createTaskMutation.mutate({
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      assigneeId: taskForm.assigneeId,
      priority: taskForm.priority,
      dueDate: taskForm.dueDate
    });
  };

  const handleAddMember = (event) => {
    event.preventDefault();
    if (!memberEmail.trim()) {
      setMessage("Member email is required.");
      return;
    }
    addMemberMutation.mutate({ email: memberEmail.trim(), role: memberRole });
  };

  const grouped = useMemo(() => {
    const istToday = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata"
    });
    const istTodayDate = new Date(`${istToday}T00:00:00+05:30`);

    const filteredTasks = tasks.filter((task) => {
      if (filters.member !== "all" && task.assignee_id !== filters.member) {
        return false;
      }

      if (filters.priority !== "all" && task.priority !== filters.priority) {
        return false;
      }

      if (filters.date !== "all") {
        const dueDate = task.due_date
          ? new Date(`${task.due_date}T00:00:00+05:30`)
          : null;

        if (filters.date === "overdue" && !(dueDate && dueDate < istTodayDate)) {
          return false;
        }

        if (filters.date === "upcoming" && !(dueDate && dueDate >= istTodayDate)) {
          return false;
        }
      }

      return true;
    });

    return filteredTasks.reduce(
      (acc, task) => {
        acc[task.status] = acc[task.status] || [];
        acc[task.status].push(task);
        return acc;
      },
      { todo: [], in_progress: [], done: [] }
    );
  }, [tasks, filters]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const istToday = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata"
  });

  return (
    <section className="content">
      <div className="split">
        <div>
          <h2>{project?.name || "Project"}</h2>
          <p>{project?.description || "No description provided."}</p>
        </div>
        {canManageTasks ? (
          <form className="inline-form" onSubmit={handleAddTask}>
            <input
              value={taskForm.title}
              onChange={(event) =>
                setTaskForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="New task title"
            />
            <input
              value={taskForm.description}
              onChange={(event) =>
                setTaskForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Description"
            />
            <select
              value={taskForm.assigneeId}
              onChange={(event) =>
                setTaskForm((prev) => ({ ...prev, assigneeId: event.target.value }))
              }
            >
              <option value="">Select assignee</option>
              {members.map((member) => (
                <option key={member.id} value={member.profile?.id || ""}>
                  {member.profile?.name || member.profile?.email}
                </option>
              ))}
            </select>
            <select
              value={taskForm.priority}
              onChange={(event) =>
                setTaskForm((prev) => ({ ...prev, priority: event.target.value }))
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input
              type="date"
              value={taskForm.dueDate}
              onChange={(event) =>
                setTaskForm((prev) => ({ ...prev, dueDate: event.target.value }))
              }
            />
            <button type="submit">Add task</button>
          </form>
        ) : (
          <div className="message">Admin or manager access required to add tasks.</div>
        )}
      </div>

      {message ? <div className="message">{message}</div> : null}

      <div className="filters">
        <select name="member" value={filters.member} onChange={handleFilterChange}>
          <option value="all">All members</option>
          {members.map((member) => (
            <option key={member.id} value={member.profile?.id || ""}>
              {member.profile?.name || member.profile?.email}
            </option>
          ))}
        </select>
        <select name="priority" value={filters.priority} onChange={handleFilterChange}>
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select name="date" value={filters.date} onChange={handleFilterChange}>
          <option value="all">All dates</option>
          <option value="overdue">Overdue</option>
          <option value="upcoming">Upcoming</option>
        </select>
      </div>

      <div className="grid">
        {Object.entries(grouped).map(([status, items]) => (
          <div key={status} className="card">
            <h3>{status.replace("_", " ").toUpperCase()}</h3>
            <div className="stack">
              {items.length === 0 ? <p>No tasks yet.</p> : null}
              {items.map((task) => (
                <div key={task.id} className="task">
                  <div className="task-info">
                    <div className="task-title">
                      <strong>{task.title}</strong>
                      {task.due_date === istToday ? (
                        <span className="due-today-badge">DUE TODAY</span>
                      ) : null}
                      {task.priority === "high" ? (
                        <span className="priority-high-badge">HIGH</span>
                      ) : null}
                      {task.isOverdue ? <span className="overdue-badge">OVERDUE</span> : null}
                    </div>
                    {task.description ? <p>{task.description}</p> : null}
                    <div className="meta">
                      <span>
                        Assignee:{" "}
                        {members.find((member) => member.profile?.id === task.assignee_id)
                          ?.profile?.name ||
                          members.find((member) => member.profile?.id === task.assignee_id)
                            ?.profile?.email ||
                          "Unassigned"}
                      </span>
                      <span>Priority: {task.priority}</span>
                      {task.due_date ? <span>Due: {task.due_date}</span> : null}
                    </div>
                  </div>
                  <div className="task-controls">
                    <select
                      value={task.status}
                      disabled={!profile?.id || task.assignee_id !== profile.id}
                      onChange={(event) =>
                        updateTaskMutation.mutate({
                          taskId: task.id,
                          payload: { status: event.target.value }
                        })
                      }
                    >
                      <option value="todo">TODO</option>
                      <option value="in_progress">IN PROGRESS</option>
                      <option value="done">DONE</option>
                    </select>
                    {canManageTasks ? (
                      <>
                        <select
                          value={task.assignee_id || ""}
                          onChange={(event) =>
                            updateTaskMutation.mutate({
                              taskId: task.id,
                              payload: { assigneeId: event.target.value || null }
                            })
                          }
                        >
                          <option value="">Unassigned</option>
                          {members.map((member) => (
                            <option key={member.id} value={member.profile?.id || ""}>
                              {member.profile?.name || member.profile?.email}
                            </option>
                          ))}
                        </select>
                        <select
                          value={task.priority}
                          onChange={(event) =>
                            updateTaskMutation.mutate({
                              taskId: task.id,
                              payload: { priority: event.target.value }
                            })
                          }
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </>
                    ) : null}
                    {canManageTasks ? (
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => deleteTaskMutation.mutate(task.id)}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="split">
        <div>
          <h3>Team members</h3>
          <p>Invite members by email.</p>
        </div>
        {canManageMembers ? (
          <form className="inline-form" onSubmit={handleAddMember}>
            <input
              value={memberEmail}
              onChange={(event) => setMemberEmail(event.target.value)}
              placeholder="member@email.com"
            />
            <select
              value={memberRole}
              onChange={(event) => setMemberRole(event.target.value)}
            >
              <option value="member">Member</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit">Add member</button>
          </form>
        ) : (
          <div className="message">Admin access required to manage members.</div>
        )}
      </div>

      <div className="cards">
        {members.map((member) => (
          <div key={member.id} className="card">
            <h4>{member.profile?.name}</h4>
            <p>{member.profile?.email}</p>
            {canManageMembers ? (
              <div className="inline-form">
                <select
                  value={member.role}
                  onChange={(event) =>
                    updateMemberRoleMutation.mutate({
                      memberId: member.id,
                      payload: { role: event.target.value }
                    })
                  }
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => removeMemberMutation.mutate(member.id)}
                >
                  Remove
                </button>
              </div>
            ) : (
              <span className="tag">{member.role}</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
