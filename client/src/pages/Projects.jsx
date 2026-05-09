import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createProject, listProjects, updateProject } from "../api/projects.js";
import { Link } from "react-router-dom";

export default function Projects() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    description: "",
    memberEmails: ""
  });
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: listProjects
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      setForm({ name: "", description: "", memberEmails: "" });
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => {
      const apiMessage = error?.response?.data?.error;
      setMessage(apiMessage || "Failed to create project.");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ projectId, payload }) => updateProject(projectId, payload),
    onSuccess: () => {
      setEditing(null);
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => {
      const apiMessage = error?.response?.data?.error;
      setMessage(apiMessage || "Failed to update project.");
    }
  });

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };


  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setMessage("Project name is required.");
      return;
    }
    if (!form.description.trim()) {
      setMessage("Project description is required.");
      return;
    }

    const memberEmails = form.memberEmails
      .split(/[,\n]/)
      .map((email) => email.trim())
      .filter(Boolean);

    createMutation.mutate({
      name: form.name.trim(),
      description: form.description.trim(),
      memberEmails: memberEmails.length > 0 ? memberEmails : undefined
    });
  };

  const startEditing = (project) => {
    setEditing({
      id: project.id,
      name: project.name || "",
      description: project.description || ""
    });
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditing((prev) => ({ ...prev, [name]: value }));
  };

  const submitEdit = (event) => {
    event.preventDefault();
    if (!editing?.name?.trim()) {
      setMessage("Project name is required.");
      return;
    }
    if (!editing?.description?.trim()) {
      setMessage("Project description is required.");
      return;
    }

    updateMutation.mutate({
      projectId: editing.id,
      payload: {
        name: editing.name.trim(),
        description: editing.description.trim()
      }
    });
  };


  return (
    <section className="content">
      <div className="split">
        <div>
          <h2>Projects</h2>
          <p>Organize tasks by project and manage team members.</p>
        </div>
        <form className="inline-form" onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="Project name"
            value={form.name}
            onChange={handleChange}
          />
          <input
            name="description"
            placeholder="Short description"
            value={form.description}
            onChange={handleChange}
          />
          <input
            name="memberEmails"
            placeholder="Add members (optional, comma-separated)"
            value={form.memberEmails}
            onChange={handleChange}
          />
          <button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create"}
          </button>
        </form>
      </div>

      {message ? <div className="message">{message}</div> : null}

      {isLoading ? (
        <p>Loading projects...</p>
      ) : (
        <div className="cards">
          {projects.map((project) => {
            const isEditing = editing?.id === project.id;
            const isAdmin = project.role === "admin";

            return (
              <div key={project.id} className="card">
                <div className="card-header">
                  <Link to={`/projects/${project.id}`} className="link-card">
                    <h3>{project.name}</h3>
                  </Link>
                  {isAdmin ? (
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => startEditing(project)}
                      aria-label="Edit project"
                    >
                      ✏️
                    </button>
                  ) : null}
                </div>

                {isEditing ? (
                  <form className="inline-form" onSubmit={submitEdit}>
                    <input
                      name="name"
                      value={editing.name}
                      onChange={handleEditChange}
                      placeholder="Project name"
                    />
                    <input
                      name="description"
                      value={editing.description}
                      onChange={handleEditChange}
                      placeholder="Short description"
                    />
                    <div className="inline-actions">
                      <button type="submit" disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p>{project.description || "No description"}</p>
                    <div className="meta">
                      <span>Pending tasks: {project.pendingTasks ?? 0}</span>
                      <span>Overdue tasks: {project.overdueTasks ?? 0}</span>
                    </div>
                    <span className="tag">{project.role}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
