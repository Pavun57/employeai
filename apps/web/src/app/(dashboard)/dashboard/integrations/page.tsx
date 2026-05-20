"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  Linkedin,
  Check,
  Link2,
  Unlink,
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
    description: "Auto-reply to customer inquiries using your knowledge base",
    scopes: ["gmail.modify", "gmail.send", "gmail.readonly"],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-700",
    bg: "bg-blue-500/10",
    description: "Auto-publish AI-generated posts to your LinkedIn profile",
    scopes: ["w_member_social", "openid", "profile"],
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
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/integrations/oauth/${platformId}/authorize`;
  }

  async function handleDisconnect(platformId: string) {
    const integration = getIntegration(platformId);
    if (!integration) return;
    if (!confirm(`Disconnect ${platformId}? Your AI agents won't be able to use it.`)) return;

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
          Connect Gmail for auto-replies and LinkedIn for automated posting
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

      {/* How it works section */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-red-600" />
              <h3 className="text-sm font-medium">Gmail Auto-Reply</h3>
            </div>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Connect your Gmail account</li>
              <li>Add entries to your Knowledge Base</li>
              <li>Activate the Support Agent</li>
              <li>Incoming inquiry emails get auto-replied using your KB</li>
            </ol>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Linkedin className="h-4 w-4 text-blue-700" />
              <h3 className="text-sm font-medium">LinkedIn Auto-Post</h3>
            </div>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Connect your LinkedIn account</li>
              <li>Set up topics and posting schedule</li>
              <li>AI generates post drafts for your review</li>
              <li>Approve to publish or edit before posting</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
