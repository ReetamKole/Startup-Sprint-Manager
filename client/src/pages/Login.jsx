import { useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.email || !form.password) {
      setMessage("Email and password are required.");
      return;
    }

    const action =
      mode === "signup"
        ? supabase.auth.signUp({ email: form.email, password: form.password })
        : supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password
          });

    const { error } = await action;

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      mode === "signup"
        ? "Check your email to confirm your account."
        : "Welcome back!"
    );
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    });
  };

  return (
    <div className="auth">
      <div className="auth-card">
        <h1>Welcome to Sprint Manager</h1>
        <p>Sign in to manage projects, tasks, and teams.</p>

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </label>
          <button type="submit">{mode === "signup" ? "Create account" : "Sign in"}</button>
        </form>

        <button className="ghost" onClick={handleGoogle}>
          Continue with Google
        </button>

        {message ? <div className="message">{message}</div> : null}

        <div className="switch">
          {mode === "signup" ? (
            <button className="link" onClick={() => setMode("login")}>
              Already have an account? Sign in
            </button>
          ) : (
            <button className="link" onClick={() => setMode("signup")}>
              Need an account? Create one
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
