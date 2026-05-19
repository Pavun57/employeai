"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  Instagram,
  Linkedin,
  ShoppingBag,
  Check,
  Link2,
  Unlink,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  {
    id: "gmail",
    name: "Gmail",
    icon: Mail,
    color: "text-red-600",
    bg: "bg-red-500/10",
    description: "Send and receive emails, manage campaigns",
    scopes: ["gmail.modify", "gmail.send"],
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: Instagram,
    color: "text-pink-600",
    bg: "bg-pink-500/10",
    description: "Post content, reply to DMs and comments",
    scopes: ["instagram_basic", "instagram_content_publish"],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-700",
    bg: "bg-blue-500/10",
    description: "Publish posts, manage professional presence",
    scopes: ["w_member_social", "r_liteprofile"],
  },
  {
    id: "shopify",
    name: "Shopify",
    icon: ShoppingBag,
    color: "text-green-700",
    bg: "bg-green-500/10",
    description: "Access orders, products, and customer data",
    scopes: ["read_orders", "read_products", "read_customers"],
  },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrations();
  }, []);

  async function loadIntegrations() {
    try {
      const data = await api.listIntegrations();
      setIntegrations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function isConnected(platformId: string) {
    return integrations.some((i) => i.platform === platformId && i.is_active);
  }

  function getIntegration(platformId: string) {
    return integrations.find((i) => i.platform === platformId);
  }

  async function handleConnect(platformId: string) {
    // In production, this would redirect to the OAuth flow
    // For now, show a placeholder message
    alert(
      `OAuth flow for ${platformId} will redirect to the provider's authorization page. Configure your ${platformId.toUpperCase()} credentials in .env first.`
    );
  }

  async function handleDisconnect(platformId: string) {
    const integration = getIntegration(platformId);
    if (!integration) return;
    if (!confirm(`Disconnect ${platformId}? Your AI employees won't be able to use it.`)) return;

    try {
      await api.disconnectPlatform(integration.id);
      await loadIntegrations();
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
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground mt-1">
          Connect your business platforms so AI employees can work with them
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLATFORMS.map((platform) => {
          const connected = isConnected(platform.id);
          const integration = getIntegration(platform.id);
          return (
            <div
              key={platform.id}
              className={cn(
                "rounded-xl border bg-card p-6 transition-all",
                connected && "border-green-200 bg-green-50/30"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn("h-11 w-11 rounded-lg flex items-center justify-center", platform.bg)}>
                    <platform.icon className={cn("h-5 w-5", platform.color)} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{platform.name}</h3>
                    <p className="text-xs text-muted-foreground">{platform.description}</p>
                  </div>
                </div>
                {connected && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                    <Check className="h-3 w-3" />
                    Connected
                  </span>
                )}
              </div>

              {connected && integration && (
                <div className="mb-4 rounded-lg bg-muted/50 px-3 py-2">
                  <p className="text-xs text-muted-foreground">
                    Account: <span className="font-medium text-foreground">{integration.account_name || integration.account_id || "Connected"}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Connected {new Date(integration.connected_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                {connected ? (
                  <button
                    onClick={() => handleDisconnect(platform.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <Unlink className="h-3 w-3" />
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(platform.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Link2 className="h-3 w-3" />
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
