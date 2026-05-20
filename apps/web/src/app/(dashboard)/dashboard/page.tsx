"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Zap,
  CheckCircle2,
  Clock,
  Mail,
  Linkedin,
  MessageSquare,
  FileText,
  BookOpen,
} from "lucide-react";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any>({ drafts: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [agentsData, draftsData] = await Promise.all([
          api.listAgents(),
          api.listPostDrafts({ status: "pending_approval", limit: 5 }),
        ]);
        setAgents(agentsData);
        setDrafts(draftsData);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeAgents = agents.filter((a) => a.status === "active").length;
  const supportAgent = agents.find((a) => a.agent_type === "support");
  const linkedinAgent = agents.find((a) => a.agent_type === "linkedin_poster");
  const pendingDrafts = drafts.total || 0;

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
          Your AI-powered email support and LinkedIn posting hub
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
              <p className="text-2xl font-bold">{activeAgents}</p>
              <p className="text-xs text-muted-foreground">Active Now</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingDrafts}</p>
              <p className="text-xs text-muted-foreground">Drafts Pending</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{agents.filter(a => a.status === "active").length > 0 ? "On" : "Off"}</p>
              <p className="text-xs text-muted-foreground">Auto-Reply</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Support Agent Card */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Customer Support Agent</h3>
              <p className="text-xs text-muted-foreground">Gmail auto-reply using knowledge base</p>
            </div>
          </div>
          {supportAgent ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  supportAgent.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                }`}>
                  {supportAgent.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-sm font-medium">{supportAgent.name}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Not set up yet</p>
              <Link href="/dashboard/employees" className="text-xs text-primary hover:underline mt-1 inline-block">
                Create Support Agent →
              </Link>
            </div>
          )}
        </div>

        {/* LinkedIn Agent Card */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Linkedin className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <h3 className="font-semibold">LinkedIn Content Agent</h3>
              <p className="text-xs text-muted-foreground">Auto-generate posts with approval flow</p>
            </div>
          </div>
          {linkedinAgent ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  linkedinAgent.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                }`}>
                  {linkedinAgent.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-sm font-medium">{linkedinAgent.name}</span>
              </div>
              {pendingDrafts > 0 && (
                <Link href="/dashboard/post-drafts" className="block mt-2 text-xs text-amber-600 hover:underline">
                  {pendingDrafts} draft{pendingDrafts !== 1 ? "s" : ""} pending approval →
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Not set up yet</p>
              <Link href="/dashboard/employees" className="text-xs text-primary hover:underline mt-1 inline-block">
                Create LinkedIn Agent →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Setup</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            href="/dashboard/knowledge-base"
            className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:shadow-md transition-shadow"
          >
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Knowledge Base</p>
              <p className="text-xs text-muted-foreground">Add FAQs for auto-replies</p>
            </div>
          </Link>
          <Link
            href="/dashboard/integrations"
            className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:shadow-md transition-shadow"
          >
            <Mail className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium">Connect Gmail</p>
              <p className="text-xs text-muted-foreground">Enable email auto-replies</p>
            </div>
          </Link>
          <Link
            href="/dashboard/post-drafts"
            className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:shadow-md transition-shadow"
          >
            <FileText className="h-5 w-5 text-blue-700" />
            <div>
              <p className="text-sm font-medium">Post Drafts</p>
              <p className="text-xs text-muted-foreground">Review pending posts</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
