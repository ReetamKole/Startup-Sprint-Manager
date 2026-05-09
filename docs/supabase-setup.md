# Supabase Setup

1. Create a Supabase project.
2. In Authentication -> Providers, enable Google and set redirect URL:
   - http://localhost:5173
   - https://<your-railway-domain>
3. In SQL Editor, run schema:
   - server/db/schema.sql
4. Then run policies:
   - server/db/policies.sql
5. Get keys:
   - Project URL -> SUPABASE_URL
   - anon public -> SUPABASE_ANON_KEY
   - service_role -> SUPABASE_SERVICE_ROLE_KEY
