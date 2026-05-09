# Team Task Manager Plan

## Goals
- Build a full-stack web app for project/task management with role-based access (Admin/Member).
- Provide authentication, team/project management, task assignment, status tracking, and dashboards.
- Deploy on Railway and deliver a live URL and GitHub repo.

## Scope (MVP)
- Auth: Supabase Auth (email/password + Google OAuth).
- Roles: Admin can manage all projects/teams/tasks; Member limited to assigned projects/tasks.
- Core entities: User, Project, Team (or ProjectMember), Task.
- Dashboard: My tasks, project overview, overdue list.

## Proposed Stack
- Frontend: React (Vite) + React Router + Axios + React Query + Supabase JS.
- Backend: Node.js + Express + Supabase (Postgres).
- Auth: Supabase Auth (email/password + Google OAuth).
- Deployment: Railway (single repo, client + server services) + Supabase project.

## Milestones
1. Architecture & blueprint
2. Backend foundation (DB schema, auth, RBAC)
3. Core APIs (projects, membership, tasks)
4. Frontend foundation (routing, auth flow)
5. Core UI (projects, tasks, dashboard)
6. Integration, tests, and deployment

## Component Breakdown
- Backend
  - Supabase schema & SQL migrations
  - Auth & RBAC middleware (Supabase JWT verification)
  - Users, Projects, Membership, Tasks APIs
  - Validation & error handling
- Frontend
  - Auth screens
  - Project management screens
  - Task board/list screens
  - Dashboard screen
  - State/data layer
- DevOps
  - Railway configuration
  - Environment variables
  - Build & deploy pipeline

## Decisions
- Use PERN (React + Node/Express + Postgres) instead of MERN to align with Postgres.
- Use Supabase for Postgres + Auth to satisfy Google OAuth and simplify user management.

## Change Log
- 2026-05-08: Initial plan created.
- 2026-05-08: Updated auth and database to Supabase (email/password + Google OAuth).
- 2026-05-08: Added Supabase schema/policies setup steps and files.
- 2026-05-08: Added Railway deployment guide for client/server services.
