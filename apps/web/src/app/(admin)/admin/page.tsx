"use client";

import { useEffect, useState } from "react";
import { Users, Bot, Zap, Activity } from "lucide-react";
import { api } from "@/lib/api";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.adminGetStats();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">System Overview</h1>
        <p className="text-muted-foreground mt-1">
          Platform-wide statistics and health
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.total_users || 0}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.total_agents || 0}</p>
              <p className="text-xs text-muted-foreground">Total Agents</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.active_agents || 0}</p>
              <p className="text-xs text-muted-foreground">Active Agents</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.total_tasks || 0}</p>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="/admin/users"
            className="rounded-lg border p-4 hover:bg-accent transition-colors"
          >
            <Users className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Manage Users</p>
            <p className="text-xs text-muted-foreground">View, edit roles & status</p>
          </a>
          <a
            href="/admin/subscriptions"
            className="rounded-lg border p-4 hover:bg-accent transition-colors"
          >
            <Zap className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Manage Plans</p>
            <p className="text-xs text-muted-foreground">Upgrade/downgrade users</p>
          </a>
          <a
            href="/admin/logs"
            className="rounded-lg border p-4 hover:bg-accent transition-colors"
          >
            <Activity className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">System Logs</p>
            <p className="text-xs text-muted-foreground">View errors & events</p>
          </a>
        </div>
      </div>
    </div>
  );
}
