"use client";

import { useEffect, useState } from "react";
import { User, Building2, Bell } from "lucide-react";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem("employeai_user");
    if (userData) setUser(JSON.parse(userData));
  }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Profile</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="text-sm mt-0.5">{user?.full_name || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-sm mt-0.5">{user?.email || "—"}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <p className="text-sm mt-0.5 capitalize">{user?.role || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Organization</label>
              <p className="text-sm mt-0.5">{user?.org_name || user?.org_id || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Subscription</h2>
        </div>
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Free Plan</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                1 AI Employee • 50 tasks/day • 2 integrations
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
              Active
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Need more? Contact us at <span className="text-primary font-medium">support@employeai.com</span> to upgrade your plan.
          </p>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Notifications</h2>
        </div>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm">Email notifications for task completions</span>
            <input type="checkbox" defaultChecked className="rounded" />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">Email notifications for errors</span>
            <input type="checkbox" defaultChecked className="rounded" />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">Daily activity summary</span>
            <input type="checkbox" className="rounded" />
          </label>
        </div>
      </div>
    </div>
  );
}
