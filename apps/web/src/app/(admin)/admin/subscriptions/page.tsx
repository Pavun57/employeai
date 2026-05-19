"use client";

import { useEffect, useState } from "react";
import { CreditCard, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const PLANS = ["free", "pro", "enterprise"];

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  async function loadSubscriptions() {
    try {
      const data = await api.adminListSubscriptions();
      setSubscriptions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function changePlan(orgId: string, plan: string) {
    if (!confirm(`Change subscription to "${plan}"?`)) return;
    try {
      await api.adminUpdateSubscription(orgId, { plan });
      await loadSubscriptions();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function toggleStatus(orgId: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    if (!confirm(`${newStatus === "suspended" ? "Suspend" : "Activate"} this subscription?`)) return;
    try {
      await api.adminUpdateSubscription(orgId, { status: newStatus });
      await loadSubscriptions();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-red-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage organization plans and limits
        </p>
      </div>

      {subscriptions.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No subscriptions yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Subscriptions will appear here when users register
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{sub.org_name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Org ID: {sub.org_id}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                      sub.status === "active"
                        ? "bg-green-100 text-green-700"
                        : sub.status === "suspended"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    )}
                  >
                    {sub.status}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase",
                      sub.plan === "enterprise"
                        ? "bg-purple-100 text-purple-700"
                        : sub.plan === "pro"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    )}
                  >
                    {sub.plan}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-xs text-muted-foreground">Max Agents</p>
                  <p className="text-sm font-medium">{sub.max_agents}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tasks/Day</p>
                  <p className="text-sm font-medium">{sub.max_tasks_per_day}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Activated</p>
                  <p className="text-sm font-medium">
                    {sub.activated_at ? new Date(sub.activated_at).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <span className="text-xs text-muted-foreground mr-2">Change plan:</span>
                {PLANS.map((plan) => (
                  <button
                    key={plan}
                    onClick={() => changePlan(sub.org_id, plan)}
                    disabled={sub.plan === plan}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                      sub.plan === plan
                        ? "bg-primary text-primary-foreground"
                        : "border hover:bg-accent"
                    )}
                  >
                    {plan}
                  </button>
                ))}
                <button
                  onClick={() => toggleStatus(sub.org_id, sub.status)}
                  className={cn(
                    "ml-auto rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    sub.status === "active"
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  )}
                >
                  {sub.status === "active" ? "Suspend" : "Activate"}
                </button>
              </div>

              {sub.notes && (
                <p className="text-xs text-muted-foreground mt-3 italic">
                  Note: {sub.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
