import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "../pages/Dashboard.jsx";
import ProjectDetail from "../pages/ProjectDetail.jsx";
import Projects from "../pages/Projects.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:id" element={<ProjectDetail />} />
    </Routes>
  );
}
