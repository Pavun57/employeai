/**
 * API client for communicating with the FastAPI backend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("employeai_token");
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("employeai_token", token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("employeai_token");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  }

  // Auth
  async register(data: { email: string; password: string; full_name: string; org_name: string }) {
    return this.request<{ token: string; user: any }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request<{ token: string; user: any }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getProfile() {
    return this.request<any>("/api/auth/me");
  }

  // Agents
  async listAgents() {
    return this.request<any[]>("/api/agents/");
  }

  async createAgent(data: { name: string; agent_type: string; description?: string; goals?: string[] }) {
    return this.request<any>("/api/agents/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getAgent(id: string) {
    return this.request<any>(`/api/agents/${id}`);
  }

  async updateAgent(id: string, data: any) {
    return this.request<any>(`/api/agents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteAgent(id: string) {
    return this.request<void>(`/api/agents/${id}`, { method: "DELETE" });
  }

  async runAgent(id: string) {
    return this.request<any>(`/api/agents/${id}/run`, { method: "POST" });
  }

  // Integrations
  async listIntegrations() {
    return this.request<any[]>("/api/integrations/");
  }

  async connectPlatform(data: any) {
    return this.request<any>("/api/integrations/connect", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async disconnectPlatform(id: string) {
    return this.request<void>(`/api/integrations/${id}`, { method: "DELETE" });
  }

  // Tasks
  async listTasks(params?: { status?: string; agent_id?: string; limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.agent_id) searchParams.set("agent_id", params.agent_id);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.offset) searchParams.set("offset", String(params.offset));
    const qs = searchParams.toString();
    return this.request<any>(`/api/tasks/${qs ? `?${qs}` : ""}`);
  }

  async approveTask(id: string) {
    return this.request<any>(`/api/tasks/${id}/approve`, { method: "POST" });
  }

  async cancelTask(id: string) {
    return this.request<any>(`/api/tasks/${id}/cancel`, { method: "POST" });
  }

  // Knowledge Base
  async listKnowledgeBase(params?: { category?: string; limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set("category", params.category);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.offset) searchParams.set("offset", String(params.offset));
    const qs = searchParams.toString();
    return this.request<any>(`/api/knowledge-base/${qs ? `?${qs}` : ""}`);
  }

  async listKBCategories() {
    return this.request<string[]>("/api/knowledge-base/categories");
  }

  async createKBEntry(data: { title: string; content: string; category?: string }) {
    return this.request<any>("/api/knowledge-base/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateKBEntry(id: string, data: { title?: string; content?: string; category?: string | null; is_active?: boolean }) {
    return this.request<any>(`/api/knowledge-base/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteKBEntry(id: string) {
    return this.request<void>(`/api/knowledge-base/${id}`, { method: "DELETE" });
  }

  async uploadKBFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(
      `${API_BASE}/api/knowledge-base/upload`,
      { method: "POST", headers, body: formData }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Upload failed" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // Post Drafts
  async listPostDrafts(params?: { status?: string; agent_id?: string; limit?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.agent_id) searchParams.set("agent_id", params.agent_id);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    const qs = searchParams.toString();
    return this.request<any>(`/api/post-drafts/${qs ? `?${qs}` : ""}`);
  }

  async approvePostDraft(id: string) {
    return this.request<any>(`/api/post-drafts/${id}/approve`, { method: "POST" });
  }

  async rejectPostDraft(id: string) {
    return this.request<any>(`/api/post-drafts/${id}/reject`, { method: "POST" });
  }

  async editPostDraft(id: string, data: { content: string }) {
    return this.request<any>(`/api/post-drafts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deletePostDraft(id: string) {
    return this.request<void>(`/api/post-drafts/${id}`, { method: "DELETE" });
  }

  // LinkedIn Agent Config
  async updateLinkedInConfig(agentId: string, data: any) {
    return this.request<any>(`/api/agents/${agentId}/linkedin-config`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async generatePost(agentId: string) {
    return this.request<any>(`/api/agents/${agentId}/generate-post`, { method: "POST" });
  }
}

export const api = new ApiClient();
