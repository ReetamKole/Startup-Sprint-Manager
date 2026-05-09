import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase anon client is missing SUPABASE_URL or SUPABASE_ANON_KEY");
}

export const supabaseAuthClient = createClient(
  supabaseUrl || "",
  supabaseAnonKey || ""
);
