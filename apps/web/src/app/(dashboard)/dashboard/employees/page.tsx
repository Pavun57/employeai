"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  Plus,
  MessageSquare,
  Linkedin,
  Play,
  Pause,
  Trash2,
  X,
  Mail,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const AGENT_TYPES = [
  {
    type: "support",
    name: "Customer Support Agent",
    icon: MessageSquare,
    color: "text-green-600",
    bg: "bg-green-500/10",
    description:
      "Automatically replies to customer inquiry emails using your knowledge base. Connect Gmail to get started.",
  },
  {
    type: "linkedin_poster",
    name: "LinkedIn Content Agent",
    icon: Linkedin,
    color: "text-blue-700",
    bg: "bg-blue-500/10",
    description:
      "Generates LinkedIn posts based on your topics and schedule. Posts are sent for approval before publishing.",
  },
];

export default function EmployeesPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    agent_type: "",
    description: "",
    goals: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    try {
      const data = await api.listAgents();
      setAgents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createAgent({
        name: createForm.name,
        agent_type: createForm.agent_type,
        description: createForm.description,
        goals: createForm.goals.split(",").map((g) => g.trim()).filter(Boolean),
      });
      setShowCreate(false);
      setCreateForm({ name: "", agent_type: "", description: "", goals: "" });
      await loadAgents();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function toggleAgent(agent: any) {
    const newStatus = agent.status === "active" ? "paused" : "active";
    try {
      await api.updateAgent(agent.id, { status: newStatus });
      await loadAgents();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function runAgent(agent: any) {
    try {
      await api.runAgent(agent.id);
      alert(`${agent.name} is now working! Check the Activity page.`);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function deleteAgent(agent: any) {
    if (!confirm(`Delete "${agent.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteAgent(agent.id);
      await loadAgents();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Agents</h1>
          <p className="text-muted-foreground mt-1">
            Manage your automated support and content agents
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Agent
        </button>
      </div>

      {/* Agent Grid */}
      {agents.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No AI agents yet</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Create your first AI agent — a Customer Support agent for auto-replying to emails, or a LinkedIn agent for automated posting.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Your First Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const typeConfig = AGENT_TYPES.find((t) => t.type === agent.agent_type);
            const Icon = typeConfig?.icon || Bot;
            return (
              <div
                key={agent.id}
                className="rounded-xl border bg-card p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("h-11 w-11 rounded-lg flex items-center justify-center", typeConfig?.bg || "bg-primary/10")}>
                    <Icon className={cn("h-5 w-5", typeConfig?.color || "text-primary")} />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                      agent.status === "active"
                        ? "bg-green-100 text-green-700"
                        : agent.status === "paused"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${
                        agent.status === "active"
                          ? "bg-green-500 animate-pulse"
                          : agent.status === "paused"
                          ? "bg-amber-500"
                          : "bg-gray-400"
                      }`}
                    />
                    {agent.status}
                  </span>
                </div>

                <h3 className="font-semibold text-base">{agent.name}</h3>
                <p className="text-sm text-muted-foreground capitalize mt-0.5">
                  {typeConfig?.name || agent.agent_type.replace("_", " ")}
                </p>

                {agent.description && (
                  <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                    {agent.description}
                  </p>
                )}

                {agent.goals?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {agent.goals.slice(0, 3).map((goal: string, i: number) => (
                      <span
                        key={i}
                        className="inline-block rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {goal}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <button
                    onClick={() => toggleAgent(agent)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      agent.status === "active"
                        ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    )}
                  >
                    {agent.status === "active" ? (
                      <>
                        <Pause className="h-3 w-3" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3" /> Activate
                      </>
                    )}
                  </button>
                  {agent.status === "active" && (
                    <button
                      onClick={() => runAgent(agent)}
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                      <Play className="h-3 w-3" /> Run
                    </button>
                  )}
                  <button
                    onClick={() => deleteAgent(agent)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors ml-auto"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-card border shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Create AI Agent</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {/* Agent Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <div className="grid grid-cols-1 gap-2">
                  {AGENT_TYPES.map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() =>
                        setCreateForm((f) => ({ ...f, agent_type: t.type, name: f.name || t.name }))
                      }
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                        createForm.agent_type === t.type
                          ? "border-primary bg-primary/5"
                          : "hover:bg-accent"
                      )}
                    >
                      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", t.bg)}>
                        <t.icon className={cn("h-4 w-4", t.color)} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="e.g. Marketing Maya"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description (optional)</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  rows={2}
                  placeholder="What should this employee focus on?"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Goals (comma-separated)</label>
                <input
                  type="text"
                  value={createForm.goals}
                  onChange={(e) => setCreateForm((f) => ({ ...f, goals: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Increase engagement, Post daily, Respond to DMs"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !createForm.agent_type || !createForm.name}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Agent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
