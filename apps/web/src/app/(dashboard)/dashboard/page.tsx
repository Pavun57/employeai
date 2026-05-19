"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  Zap,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any>({ tasks: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [agentsData, tasksData] = await Promise.all([
          api.listAgents(),
          api.listTasks({ limit: 5 }),
        ]);
        setAgents(agentsData);
        setTasks(tasksData);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeAgents = agents.filter((a) => a.status === "active").length;
  const completedTasks = tasks.tasks?.filter((t: any) => t.status === "completed").length || 0;
  const pendingTasks = tasks.tasks?.filter((t: any) => t.status === "pending").length || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your AI workforce activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{agents.length}</p>
              <p className="text-xs text-muted-foreground">Total Employees</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeAgents}</p>
              <p className="text-xs text-muted-foreground">Active Now</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedTasks}</p>
              <p className="text-xs text-muted-foreground">Tasks Completed</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingTasks}</p>
              <p className="text-xs text-muted-foreground">Pending Approval</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Employees */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Your AI Employees</h2>
        {agents.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <Bot className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No AI employees yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Go to AI Employees to hire your first one
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
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
                          ? "bg-green-500"
                          : agent.status === "paused"
                          ? "bg-amber-500"
                          : "bg-gray-400"
                      }`}
                    />
                    {agent.status}
                  </span>
                </div>
                <h3 className="font-semibold">{agent.name}</h3>
                <p className="text-sm text-muted-foreground capitalize mt-0.5">
                  {agent.agent_type.replace("_", " ")}
                </p>
                {agent.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {agent.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Tasks</h2>
        {tasks.tasks?.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No tasks yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tasks will appear here once your AI employees start working
            </p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card divide-y">
            {tasks.tasks?.map((task: any) => (
              <div key={task.id} className="flex items-center gap-4 p-4">
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                    task.status === "completed"
                      ? "bg-green-100"
                      : task.status === "failed"
                      ? "bg-red-100"
                      : "bg-blue-100"
                  }`}
                >
                  {task.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : task.status === "failed" ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.platform} • {task.status}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(task.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
