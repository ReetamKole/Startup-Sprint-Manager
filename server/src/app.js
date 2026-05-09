import cors from "cors";
import express from "express";
import {
  dashboardRoutes,
  healthRoutes,
  projectRoutes,
  taskRoutes,
  userRoutes
} from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true
    })
  );
  app.use(express.json());

  app.use("/api", healthRoutes());
  app.use("/api/users", userRoutes());
  app.use("/api/projects", projectRoutes());
  app.use("/api", taskRoutes());
  app.use("/api/dashboard", dashboardRoutes());

  return app;
}
