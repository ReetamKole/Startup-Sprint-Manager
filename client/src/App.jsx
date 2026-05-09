import { BrowserRouter } from "react-router-dom";
import AppShell from "./components/AppShell.jsx";
import Login from "./pages/Login.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";
import { useAuth } from "./state/auth.jsx";

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!session) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </BrowserRouter>
  );
}
