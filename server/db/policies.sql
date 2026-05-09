-- Enable RLS and basic policies

alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table tasks enable row level security;

-- Profiles
create policy "Profiles are readable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Projects: members can read, owners/admins manage
create policy "Project members can read projects"
  on projects for select
  to authenticated
  using (
    exists (
      select 1
      from project_members pm
      join profiles p on p.id = pm.profile_id
      where pm.project_id = projects.id
        and p.user_id = auth.uid()
    )
  );

-- Project members
create policy "Members can read project_members"
  on project_members for select
  to authenticated
  using (
    exists (
      select 1
      from profiles p
      where p.id = project_members.profile_id
        and p.user_id = auth.uid()
    )
  );

-- Tasks
create policy "Members can read tasks in their projects"
  on tasks for select
  to authenticated
  using (
    exists (
      select 1
      from project_members pm
      join profiles p on p.id = pm.profile_id
      where pm.project_id = tasks.project_id
        and p.user_id = auth.uid()
    )
  );
