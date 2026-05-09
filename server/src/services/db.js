import { supabaseAdmin } from "./supabaseAdmin.js";

export async function getProfileByUserId(userId) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  return { data, error };
}

export async function getProfileByEmail(email) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();

  return { data, error };
}

export async function getProjectById(projectId) {
  const { data, error } = await supabaseAdmin
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  return { data, error };
}

export async function getProjectMember(projectId, profileId) {
  const { data, error } = await supabaseAdmin
    .from("project_members")
    .select("*")
    .eq("project_id", projectId)
    .eq("profile_id", profileId)
    .single();

  return { data, error };
}
