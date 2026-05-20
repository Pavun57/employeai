"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Plus,
  MessageSquare,
  Linkedin,
  Play,
  Pause,
  Mail,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const AGENT_TYPES = [
  {
    type: "support",
    name: "Customer Support Agent",
    icon: MessageSquare,
    platformIcon: Mail,
    color: "text-green-600",
    bg: "bg-green-500/10",
    platformColor: "text-red-600",
    description:
      "Automatically replies to customer emails using your knowledge base. Connect Gmail to get started.",
    features: ["Auto-replies to emails", "Uses your knowledge base", "Learns from your FAQs"],
  },
  {
    type: "linkedin_poster",
    name: "LinkedIn Content Agent",
    icon: Linkedin,
    platformIcon: Linkedin,
    color: "text-blue-700",
    bg: "bg-blue-500/10",
    platformColor: "text-blue-700",
    description:
      "Generates LinkedIn posts based on your topics and schedule. Posts are sent for approval before publishing.",
    features: ["AI-generated posts", "Approval before publish", "Custom topics & tone"],
  },
];

export default function EmployeesPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHire, setShowHire] = useState(false);
  const [hiring, setHiring] = useState<string | null>(null);

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

  async function hireAgent(agentType: typeof AGENT_TYPES[number]) {
    setHiring(agentType.type);
    try {
      const result = await api.createAgent({
        name: agentType.name,
        agent_type: agentType.type,
        description: agentType.description,
      });
      router.push(`/dashboard/employees/${result.id}`);
    } catch (err: any) {
      alert(err.message);
      setHiring(null);
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
            Hire and manage your automated agents
          </p>
        </div>
        <button
          onClick={() => setShowHire(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Hire Agent
        </button>
      </div>

      {/* Active Agents */}
      {agents.length === 0 && !showHire ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No AI agents yet</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Hire your first AI agent to automate customer support or LinkedIn content creation.
          </p>
          <button
            onClick={() => setShowHire(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Hire Your First Agent
          </button>
        </div>
      ) : (
        <>
          {agents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => {
                const typeConfig = AGENT_TYPES.find((t) => t.type === agent.agent_type);
                const Icon = typeConfig?.icon || Bot;
                return (
                  <button
                    key={agent.id}
                    onClick={() => router.push(`/dashboard/employees/${agent.id}`)}
                    className="rounded-xl border bg-card p-5 hover:shadow-md hover:border-primary/30 transition-all text-left group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={cn(
                          "h-11 w-11 rounded-lg flex items-center justify-center",
                          typeConfig?.bg || "bg-primary/10"
                        )}
                      >
                        <Icon className={cn("h-5 w-5", typeConfig?.color || "text-primary")} />
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                          agent.status === "active"
                            ? "bg-green-100 text-green-700"
                            : agent.status === "paused"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-700"
                        )}
                      >
                        <div
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            agent.status === "active"
                              ? "bg-green-500 animate-pulse"
                              : agent.status === "paused"
                              ? "bg-amber-500"
                              : "bg-gray-400"
                          )}
                        />
                        {agent.status}
                      </span>
                    </div>

                    <h3 className="font-semibold text-base">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize mt-0.5">
                      {typeConfig?.name || agent.agent_type.replace("_", " ")}
                    </p>

                    <div className="flex items-center gap-1 mt-4 pt-3 border-t text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      <span>Configure</span>
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Hire Agent Panel */}
      {showHire && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Available Agents</h2>
            {agents.length > 0 && (
              <button
                onClick={() => setShowHire(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AGENT_TYPES.map((agentType) => {
              const alreadyHired = agents.some((a) => a.agent_type === agentType.type);
              return (
                <div
                  key={agentType.type}
                  className={cn(
                    "rounded-xl border bg-card p-6 transition-all",
                    alreadyHired ? "opacity-60" : "hover:shadow-md hover:border-primary/30"
                  )}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-lg flex items-center justify-center",
                        agentType.bg
                      )}
                    >
                      <agentType.icon className={cn("h-6 w-6", agentType.color)} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{agentType.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {agentType.description}
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-1.5 mb-5">
                    {agentType.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => hireAgent(agentType)}
                    disabled={hiring === agentType.type || alreadyHired}
                    className={cn(
                      "w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50",
                      alreadyHired
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {alreadyHired
                      ? "Already Hired"
                      : hiring === agentType.type
                      ? "Setting up..."
                      : "Hire Agent"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
