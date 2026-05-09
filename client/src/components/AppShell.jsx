import { NavLink } from "react-router-dom";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../state/auth.jsx";

export default function AppShell({ children }) {
  const { user, profile } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <div className="brand">Sprint Manager</div>
          <nav>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/projects">Projects</NavLink>
          </nav>
        </div>
        <div className="sidebar-footer">
          <div className="meta">
            <span>{profile?.name || user?.email}</span>
            <span className="role-chip">{profile?.role || "member"}</span>
          </div>
          <button className="ghost ghost-invert" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <h1>Team Task Manager</h1>
          <p>Keep teams aligned and tasks on track.</p>
        </header>
        {children}
      </main>
    </div>
  );
}
