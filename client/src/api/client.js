import axios from "axios";
import { supabase } from "../lib/supabaseClient.js";

const rawApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
const apiBaseUrl = /\/api$/.test(rawApiBaseUrl)
  ? rawApiBaseUrl
  : `${rawApiBaseUrl.replace(/\/$/, "")}/api`;

export const apiClient = axios.create({
  baseURL: apiBaseUrl
});

apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
