import { apiClient } from "./client.js";

export async function listProjects() {
  const { data } = await apiClient.get("/projects");
  return data.projects;
}

export async function createProject(payload) {
  const { data } = await apiClient.post("/projects", payload);
  return data.project;
}

export async function getProject(projectId) {
  const { data } = await apiClient.get(`/projects/${projectId}`);
  return data;
}

export async function updateProject(projectId, payload) {
  const { data } = await apiClient.patch(`/projects/${projectId}`, payload);
  return data.project;
}

export async function deleteProject(projectId) {
  await apiClient.delete(`/projects/${projectId}`);
}

export async function listProjectMembers(projectId) {
  const { data } = await apiClient.get(`/projects/${projectId}/members`);
  return data.members;
}

export async function addProjectMember(projectId, payload) {
  const { data } = await apiClient.post(`/projects/${projectId}/members`, payload);
  return data.member;
}

export async function removeProjectMember(projectId, memberId) {
  await apiClient.delete(`/projects/${projectId}/members/${memberId}`);
}

export async function updateProjectMemberRole(projectId, memberId, payload) {
  const { data } = await apiClient.patch(
    `/projects/${projectId}/members/${memberId}`,
    payload
  );
  return data.member;
}
