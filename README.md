# Startup Sprint Manager

A full-stack team task manager built with React, Node.js, and Supabase. It supports authentication, project/team management, task workflows, and dashboard insights.

## Features
- Auth with email/password and Google OAuth
- Projects and team memberships (admin/manager/member)
- Task creation, assignment, status tracking
- Dashboard with progress and priority insights
- Role-based access control

## Tech stack
- Client: React + Vite
- Server: Node.js + Express
- Database/Auth: Supabase

## Local setup
1) Install dependencies
```
npm install
```

2) Configure environment variables
- Client: `client/.env`
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_API_BASE_URL=http://localhost:4000/api
```
- Server: `server/.env`
```
PORT=4000
CLIENT_URL=http://localhost:5173
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

3) Run the apps
```
npm run dev:server
npm run dev:client
```

## Deployment (Railway)
See docs/railway-deploy.md for step-by-step instructions.

## Database
Apply `server/db/schema.sql` in Supabase SQL editor.

