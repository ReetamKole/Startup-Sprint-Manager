import { apiClient } from "./client.js";

export async function getMe() {
  const { data } = await apiClient.get("/users/me");
  return data;
}
