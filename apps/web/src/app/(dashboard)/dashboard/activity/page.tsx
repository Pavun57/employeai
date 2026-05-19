"use client";

import { useEffect, useState } from "react";
import {
  Activity as ActivityIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Filter,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function ActivityPage() {
  const [tasks, setTasks] = useState<any>({ tasks: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    loadTasks();
  }, [filter]);

  async function loadTasks() {
    setLoading(true);
    try {
      const data = await api.listTasks({ status: filter || undefined, limit: 50 });
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(taskId: string) {
    try {
      await api.approveTask(taskId);
      await loadTasks();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleCancel(taskId: string) {
    try {
      await api.cancelTask(taskId);
      await loadTasks();
    } catch (err: any) {
      alert(err.message);
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "running":
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activity</h1>
          <p className="text-muted-foreground mt-1">
            Track what your AI employees are doing
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {["", "pending", "running", "completed", "failed"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              filter === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : tasks.tasks?.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <ActivityIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No activity yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tasks will appear here as your AI employees work
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card divide-y">
          {tasks.tasks.map((task: any) => (
            <div key={task.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                {statusIcon(task.status)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {task.platform && (
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded capitalize">
                      {task.platform}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {task.priority} priority
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {task.status === "pending" && task.requires_approval && (
                  <>
                    <button
                      onClick={() => handleApprove(task.id)}
                      className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleCancel(task.id)}
                      className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(task.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tasks.total > 50 && (
        <p className="text-center text-sm text-muted-foreground">
          Showing 50 of {tasks.total} tasks
        </p>
      )}
    </div>
  );
}
