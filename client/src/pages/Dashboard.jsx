import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "../api/dashboard.js";

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: getDashboardSummary
  });
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const renderPie = (title, slices) => {
    const total = slices.reduce((sum, slice) => sum + slice.value, 0);
    const radius = 46;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
      <div className="card pie-card">
        <h3>{title}</h3>
        <div className="pie-wrap">
          <svg viewBox="0 0 120 120" className="pie">
            <circle
              cx="60"
              cy="60"
              r={radius}
              className="pie-base"
            />
            {slices.map((slice) => {
              const portion = total ? slice.value / total : 0;
              const dash = portion * circumference;
              const gap = circumference - dash;
              const dashArray = `${dash} ${gap}`;
              const dashOffset = -offset;
              offset += dash;

              return (
                <g
                  key={slice.key}
                  className="pie-slice-group"
                  onMouseEnter={() => setHoveredSlice({ ...slice, title })}
                  onMouseLeave={() => setHoveredSlice(null)}
                >
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    className={`pie-slice ${slice.className}`}
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                  />
                </g>
              );
            })}
          </svg>
          <div className={`pie-tooltip${hoveredSlice ? " is-visible" : ""}`}>
            {hoveredSlice ? (
              <>
                <strong>
                  {hoveredSlice.title}: {hoveredSlice.label}
                </strong>
                <div>{hoveredSlice.value} tasks</div>
                <div className="pie-projects">
                  {(hoveredSlice.projects || []).length > 0
                    ? hoveredSlice.projects.join(", ")
                    : "No tasks"}
                </div>
              </>
            ) : (
              <span>Hover a slice</span>
            )}
          </div>
          <div className="pie-legend">
            {slices.map((slice) => (
              <div key={slice.key} className="legend-item">
                <span className={`legend-dot ${slice.className}`} />
                <span>
                  {slice.label}: {slice.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderRows = (projects) => {
    if (isLoading) {
      return <p>Loading...</p>;
    }

    if (!projects || projects.length === 0) {
      return <p className="muted">No tasks yet.</p>;
    }

    return (
      <div className="row-list">
        {projects.map((project) => {
          const total = project.total || 0;
          const inProgressPct = total
            ? Math.round((project.inProgress / total) * 100)
            : 0;
          const donePct = total
            ? Math.round((project.done / total) * 100)
            : 0;

          return (
            <div key={project.projectId} className="row">
              <div>
                <strong>{project.projectName}</strong>
                <div className="row-meta">
                  {project.remaining} remaining
                </div>
              </div>
              <div className="progress-track" aria-hidden="true">
                <div
                  className="progress-segment progress-in-progress"
                  style={{ width: `${inProgressPct}%` }}
                />
                <div
                  className="progress-segment progress-done"
                  style={{ width: `${donePct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="content">
      <div className="grid">
        <div className="card">
          <h3>My tasks</h3>
          <p className="stat">{isLoading ? "..." : data?.myTasks ?? 0}</p>
          {renderRows(data?.myProjects)}
        </div>
        <div className="card">
          <h3>Overdue</h3>
          <p className="stat">{isLoading ? "..." : data?.overdueTasks ?? 0}</p>
          {renderRows(data?.overdueProjects)}
        </div>
      </div>

      <div className="grid">
        {renderPie("Priority", [
          {
            key: "high",
            label: "High",
            value: data?.priorityBreakdown?.high?.count || 0,
            projects: data?.priorityBreakdown?.high?.projects || [],
            className: "slice-high"
          },
          {
            key: "medium",
            label: "Medium",
            value: data?.priorityBreakdown?.medium?.count || 0,
            projects: data?.priorityBreakdown?.medium?.projects || [],
            className: "slice-medium"
          },
          {
            key: "low",
            label: "Low",
            value: data?.priorityBreakdown?.low?.count || 0,
            projects: data?.priorityBreakdown?.low?.projects || [],
            className: "slice-low"
          }
        ])}
      </div>
    </section>
  );
}
