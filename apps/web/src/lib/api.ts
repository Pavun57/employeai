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

  // Admin
  async adminListUsers(params?: { search?: string; limit?: number; offset?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.offset) searchParams.set("offset", String(params.offset));
    const qs = searchParams.toString();
    return this.request<any>(`/api/admin/users${qs ? `?${qs}` : ""}`);
  }

  async adminUpdateUser(id: string, data: { role?: string; is_active?: boolean }) {
    return this.request<any>(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async adminListSubscriptions() {
    return this.request<any[]>("/api/admin/subscriptions");
  }

  async adminUpdateSubscription(orgId: string, data: any) {
    return this.request<any>(`/api/admin/subscriptions/${orgId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async adminGetStats() {
    return this.request<any>("/api/admin/stats");
  }
}

export const api = new ApiClient();
