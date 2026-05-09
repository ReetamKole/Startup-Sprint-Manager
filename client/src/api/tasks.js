import { apiClient } from "./client.js";

export async function listTasks(projectId) {
  const { data } = await apiClient.get(`/projects/${projectId}/tasks`);
  return data.tasks;
}

export async function createTask(projectId, payload) {
  const { data } = await apiClient.post(`/projects/${projectId}/tasks`, payload);
  return data.task;
}

export async function updateTask(taskId, payload) {
  const { data } = await apiClient.patch(`/tasks/${taskId}`, payload);
  return data.task;
}

export async function deleteTask(taskId) {
  await apiClient.delete(`/tasks/${taskId}`);
}
