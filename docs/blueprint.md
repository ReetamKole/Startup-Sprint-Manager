# Team Task Manager Blueprint

## High-Level Architecture
- Client (React) -> Server (Express) -> Supabase (Postgres + Auth)
- Auth via Supabase Auth (email/password + Google OAuth)
- Server verifies Supabase JWT and enforces RBAC, UI adapts by role

## Data Model (Proposed)
- auth.users (Supabase managed)
  - id, email, created_at
- Profile
  - id, userId (FK auth.users.id), name, role, createdAt
- Project
  - id, name, description, ownerId, createdAt
- ProjectMember
  - id, projectId, userId, role, createdAt
- Task
  - id, projectId, title, description, status, priority, dueDate, assigneeId, createdById, createdAt

## Core Flows
- Auth
  - Signup/Login/Google -> Supabase issues JWT -> stored by Supabase client
  - Server reads JWT from Authorization header
- Project Management
  - Admin creates project -> adds members -> members see project
- Task Workflow
  - Admin or member (with permission) creates task -> assigns -> status updates
- Dashboard
  - Aggregated queries: my tasks, overdue tasks, project status

## Backend Routes (REST)
- Users
  - GET /api/users/me
- Projects
  - GET /api/projects
  - POST /api/projects
  - GET /api/projects/:id
  - PATCH /api/projects/:id
  - DELETE /api/projects/:id
- Project Members
  - GET /api/projects/:id/members
  - POST /api/projects/:id/members
  - DELETE /api/projects/:id/members/:memberId
- Tasks
  - GET /api/projects/:id/tasks
  - POST /api/projects/:id/tasks
  - PATCH /api/tasks/:id
  - DELETE /api/tasks/:id

## Frontend Pages
- /login
- /signup
- /dashboard
- /projects
- /projects/:id

## Frontend Components
- Layout
  - AppShell, Sidebar, Topbar
- Auth
  - LoginForm, SignupForm
- Projects
  - ProjectList, ProjectCard, MemberList
- Tasks
  - TaskList, TaskCard, TaskEditor
- Dashboard
  - StatsSummary, OverdueList

## File Structure (Proposed)
- client/
  - src/
    - api/
    - components/
    - pages/
    - routes/
    - state/
- server/
  - src/
    - routes/
    - controllers/
    - services/
    - middleware/
    - validators/
    - db/

## Environment Variables
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- CLIENT_URL

## RBAC Rules (MVP)
- Admin
  - Full access to all projects, members, tasks
- Member
  - Read projects they belong to
  - Create/update tasks in projects they belong to
  - Cannot delete projects

## Validation Rules (MVP)
- Email must be unique and valid
- Password min length 8
- Project name required
- Task title required, status in [todo, in_progress, done]

## Integration Points
- Client API layer -> Axios/React Query + Supabase JS
- Server middleware -> Supabase JWT verification + RBAC
- Server DB layer -> Supabase (Postgres)

## Deployment Notes (Railway)
- Service: server (Node)
- Service: client (static build)
- Database: Supabase project (external)
