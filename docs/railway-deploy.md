# Railway Deployment

## Server Service
1. Create a new Railway project.
2. Add a service from GitHub repo (server).
3. Set root directory to `server`.
4. Add environment variables:
   - PORT=4000
   - CLIENT_URL=https://<client-domain>
   - SUPABASE_URL=...
   - SUPABASE_ANON_KEY=...
   - SUPABASE_SERVICE_ROLE_KEY=...
5. Deploy. Railway detects Node and runs `npm start`.

## Client Service
1. Add another service from GitHub repo (client).
2. Set root directory to `client`.
3. Add environment variables:
   - VITE_SUPABASE_URL=...
   - VITE_SUPABASE_ANON_KEY=...
   - VITE_API_BASE_URL=https://<server-domain>/api
4. Set build command: `npm run build`.
5. Set start command: `npm run preview -- --host 0.0.0.0 --port $PORT`.
6. Deploy and copy the public URL into Supabase auth redirect URLs.

## Supabase Redirect URLs
- https://<client-domain>
- http://localhost:5173
