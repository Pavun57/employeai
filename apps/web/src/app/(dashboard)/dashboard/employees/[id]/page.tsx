"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  MessageSquare,
  Linkedin,
  Mail,
  Check,
  Link2,
  Play,
  Pause,
  Trash2,
  Upload,
  Plus,
  X,
  FileText,
  Sparkles,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.id as string;

  const [agent, setAgent] = useState<any>(null);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [kbEntries, setKbEntries] = useState<any[]>([]);
  const [postDrafts, setPostDrafts] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"config" | "activity">("config");

  // LinkedIn config form
  const [linkedInConfig, setLinkedInConfig] = useState({
    topics: [] as string[],
    newTopic: "",
    posting_style: "professional",
    tone: "informative",
    posting_frequency: "daily",
    preferred_time: "09:00",
    include_hashtags: true,
    max_length: 1300,
  });

  // KB form
  const [showAddKB, setShowAddKB] = useState(false);
  const [kbForm, setKbForm] = useState({ title: "", content: "", category: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, [agentId]);

  async function loadData() {
    try {
      const [agentData, integrationsData] = await Promise.all([
        api.getAgent(agentId),
        api.listIntegrations(),
      ]);
      setAgent(agentData);
      setIntegrations(integrationsData);

      // Load LinkedIn config
      if (agentData.agent_type === "linkedin_poster" && agentData.linkedin_config) {
        setLinkedInConfig((prev) => ({
          ...prev,
          topics: agentData.linkedin_config.topics || [],
          posting_style: agentData.linkedin_config.posting_style || "professional",
          tone: agentData.linkedin_config.tone || "informative",
          posting_frequency: agentData.linkedin_config.posting_frequency || "daily",
          preferred_time: agentData.linkedin_config.preferred_time || "09:00",
          include_hashtags: agentData.linkedin_config.include_hashtags ?? true,
          max_length: agentData.linkedin_config.max_length || 1300,
        }));
      }

      // Load KB entries for support agents
      if (agentData.agent_type === "support") {
        const kbData = await api.listKnowledgeBase();
        setKbEntries(kbData.entries || []);
      }

      // Load post drafts for LinkedIn agents
      if (agentData.agent_type === "linkedin_poster") {
        const draftsData = await api.listPostDrafts({ agent_id: agentId });
        setPostDrafts(draftsData.drafts || draftsData || []);
      }

      // Load recent tasks/activity
      const tasksData = await api.listTasks({ agent_id: agentId, limit: 20 });
      setTasks(tasksData.tasks || tasksData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getRequiredPlatform() {
    if (!agent) return null;
    return agent.agent_type === "support" ? "gmail" : "linkedin";
  }

  function isPlatformConnected() {
    const platform = getRequiredPlatform();
    return integrations.some((i) => i.platform === platform && i.is_active);
  }

  async function handleConnect() {
    const platform = getRequiredPlatform();
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/integrations/oauth/${platform}/authorize`;
  }

  async function saveLinkedInConfig() {
    setSaving(true);
    try {
      await api.updateLinkedInConfig(agentId, {
        topics: linkedInConfig.topics,
        posting_style: linkedInConfig.posting_style,
        tone: linkedInConfig.tone,
        posting_frequency: linkedInConfig.posting_frequency,
        preferred_time: linkedInConfig.preferred_time,
        include_hashtags: linkedInConfig.include_hashtags,
        max_length: linkedInConfig.max_length,
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  function addTopic() {
    const topic = linkedInConfig.newTopic.trim();
    if (!topic || linkedInConfig.topics.includes(topic)) return;
    setLinkedInConfig((prev) => ({
      ...prev,
      topics: [...prev.topics, topic],
      newTopic: "",
    }));
  }

  function removeTopic(topic: string) {
    setLinkedInConfig((prev) => ({
      ...prev,
      topics: prev.topics.filter((t) => t !== topic),
    }));
  }

  async function handleAddKBEntry(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createKBEntry({
        title: kbForm.title,
        content: kbForm.content,
        category: kbForm.category || undefined,
      });
      setKbForm({ title: "", content: "", category: "" });
      setShowAddKB(false);
      const kbData = await api.listKnowledgeBase();
      setKbEntries(kbData.entries || []);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await api.uploadKBFile(file);
      }
      const kbData = await api.listKnowledgeBase();
      setKbEntries(kbData.entries || []);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function deleteKBEntry(id: string) {
    if (!confirm("Delete this knowledge base entry?")) return;
    try {
      await api.deleteKBEntry(id);
      setKbEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function toggleAgent() {
    if (!agent) return;
    const newStatus = agent.status === "active" ? "paused" : "active";
    try {
      await api.updateAgent(agentId, { status: newStatus });
      setAgent((prev: any) => ({ ...prev, status: newStatus }));
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function runAgent() {
    try {
      await api.runAgent(agentId);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function generatePost() {
    try {
      await api.generatePost(agentId);
      const draftsData = await api.listPostDrafts({ agent_id: agentId });
      setPostDrafts(draftsData.drafts || draftsData || []);
      setActiveTab("activity");
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function approveDraft(id: string) {
    try {
      await api.approvePostDraft(id);
      setPostDrafts((prev) => prev.map((d) => d.id === id ? { ...d, status: "approved" } : d));
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function rejectDraft(id: string) {
    try {
      await api.rejectPostDraft(id);
      setPostDrafts((prev) => prev.map((d) => d.id === id ? { ...d, status: "rejected" } : d));
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function deleteDraft(id: string) {
    if (!confirm("Delete this draft?")) return;
    try {
      await api.deletePostDraft(id);
      setPostDrafts((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function deleteAgent() {
    if (!confirm(`Delete "${agent.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteAgent(agentId);
      router.push("/dashboard/employees");
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

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Agent not found</p>
        <button onClick={() => router.push("/dashboard/employees")} className="text-primary mt-2 text-sm underline">
          Back to agents
        </button>
      </div>
    );
  }

  const isSupport = agent.agent_type === "support";
  const isLinkedIn = agent.agent_type === "linkedin_poster";
  const connected = isPlatformConnected();
  const platformName = isSupport ? "Gmail" : "LinkedIn";
  const PlatformIcon = isSupport ? Mail : Linkedin;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/dashboard/employees")}
          className="rounded-lg p-2 hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <p className="text-sm text-muted-foreground">
            {isSupport ? "Customer Support Agent" : "LinkedIn Content Agent"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
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
          <button
            onClick={toggleAgent}
            disabled={!connected}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
              agent.status === "active"
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            )}
          >
            {agent.status === "active" ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {agent.status === "active" ? "Pause" : "Activate"}
          </button>
          {agent.status === "active" && isSupport && (
            <button
              onClick={runAgent}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 text-xs font-medium transition-colors"
            >
              <Play className="h-3 w-3" /> Process Now
            </button>
          )}
          {agent.status === "active" && isLinkedIn && (
            <button
              onClick={generatePost}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 text-xs font-medium transition-colors"
            >
              <Sparkles className="h-3 w-3" /> Generate Post
            </button>
          )}
        </div>
      </div>

      {/* Integration Status (compact) */}
      {!connected && (
        <div className="flex items-center gap-3 p-4 rounded-xl border bg-amber-50 border-amber-200">
          <Link2 className="h-5 w-5 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              {platformName} Not Connected
            </p>
            <p className="text-xs text-amber-600">
              Connect {platformName} to enable your agent
            </p>
          </div>
          <button
            onClick={handleConnect}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Connect {platformName}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setActiveTab("config")}
          className={cn(
            "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "config" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {isLinkedIn ? "Topics & Style" : "Knowledge Base"}
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={cn(
            "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "activity" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {isLinkedIn ? "Post Drafts" : "Activity"}
          {isLinkedIn && postDrafts.filter((d) => d.status === "pending_approval").length > 0 && (
            <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {postDrafts.filter((d) => d.status === "pending_approval").length}
            </span>
          )}
        </button>
      </div>

      {/* Config Tab */}
      {activeTab === "config" && (
        <div className="rounded-xl border bg-card p-5">
          {/* LinkedIn Configuration */}
          {isLinkedIn && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Topics to post about</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={linkedInConfig.newTopic}
                    onChange={(e) =>
                      setLinkedInConfig((prev) => ({ ...prev, newTopic: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTopic())}
                    placeholder="e.g. AI in healthcare, startup tips..."
                    className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <button
                    onClick={addTopic}
                    type="button"
                    className="rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {linkedInConfig.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {linkedInConfig.topics.map((topic) => (
                      <span
                        key={topic}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {topic}
                        <button onClick={() => removeTopic(topic)} className="hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Posting Style</label>
                  <select
                    value={linkedInConfig.posting_style}
                    onChange={(e) =>
                      setLinkedInConfig((prev) => ({ ...prev, posting_style: e.target.value }))
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="storytelling">Storytelling</option>
                    <option value="educational">Educational</option>
                    <option value="thought_leadership">Thought Leadership</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tone</label>
                  <select
                    value={linkedInConfig.tone}
                    onChange={(e) =>
                      setLinkedInConfig((prev) => ({ ...prev, tone: e.target.value }))
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="informative">Informative</option>
                    <option value="inspirational">Inspirational</option>
                    <option value="conversational">Conversational</option>
                    <option value="authoritative">Authoritative</option>
                    <option value="humorous">Humorous</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Posting Frequency</label>
                  <select
                    value={linkedInConfig.posting_frequency}
                    onChange={(e) =>
                      setLinkedInConfig((prev) => ({ ...prev, posting_frequency: e.target.value }))
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays Only</option>
                    <option value="twice_week">Twice a Week</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preferred Time</label>
                  <input
                    type="time"
                    value={linkedInConfig.preferred_time}
                    onChange={(e) =>
                      setLinkedInConfig((prev) => ({ ...prev, preferred_time: e.target.value }))
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Include Hashtags</label>
                  <p className="text-xs text-muted-foreground">Add relevant hashtags to posts</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLinkedInConfig((prev) => ({ ...prev, include_hashtags: !prev.include_hashtags }))
                  }
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    linkedInConfig.include_hashtags ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm",
                      linkedInConfig.include_hashtags ? "translate-x-5" : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>

              <button
                onClick={saveLinkedInConfig}
                disabled={saving || linkedInConfig.topics.length === 0}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          )}

          {/* Support Agent - Knowledge Base */}
          {isSupport && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload documents or add entries that your agent will use to answer customer emails.
              </p>

              {/* File Upload */}
              <div className="rounded-lg border-2 border-dashed p-6 text-center">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">
                  {uploading ? "Uploading..." : "Upload PDF or text files"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, TXT, or MD files up to 10MB
                </p>
                <label className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer">
                  <Upload className="h-4 w-4" />
                  Choose Files
                  <input
                    type="file"
                    accept=".pdf,.txt,.md"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>

              {/* Manual Entry */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Or add manually</span>
                <button
                  onClick={() => setShowAddKB(true)}
                  className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium hover:bg-accent/80 transition-colors"
                >
                  <Plus className="h-3 w-3" /> Add Entry
                </button>
              </div>

              {/* Add KB Form */}
              {showAddKB && (
                <form onSubmit={handleAddKBEntry} className="rounded-lg border p-4 space-y-3">
                  <input
                    type="text"
                    value={kbForm.title}
                    onChange={(e) => setKbForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Title (e.g. Refund Policy)"
                    required
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <textarea
                    value={kbForm.content}
                    onChange={(e) => setKbForm((f) => ({ ...f, content: e.target.value }))}
                    placeholder="Content..."
                    required
                    rows={4}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                  <input
                    type="text"
                    value={kbForm.category}
                    onChange={(e) => setKbForm((f) => ({ ...f, category: e.target.value }))}
                    placeholder="Category (optional)"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddKB(false)}
                      className="flex-1 rounded-lg border px-3 py-2 text-sm hover:bg-accent transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </form>
              )}

              {/* KB Entries List */}
              {kbEntries.length > 0 && (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {kbEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{entry.title}</p>
                        {entry.category && (
                          <span className="text-xs text-muted-foreground">{entry.category}</span>
                        )}
                      </div>
                      <button
                        onClick={() => deleteKBEntry(entry.id)}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === "activity" && (
        <div className="space-y-4">
          {/* LinkedIn: Post Drafts */}
          {isLinkedIn && (
            <>
              {postDrafts.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium">No post drafts yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click &quot;Generate Post&quot; to create your first draft
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {postDrafts.map((draft) => (
                    <div key={draft.id} className="rounded-xl border bg-card p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                            draft.status === "pending_approval"
                              ? "bg-amber-100 text-amber-700"
                              : draft.status === "approved" || draft.status === "posted"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          )}
                        >
                          {draft.status === "pending_approval" && <Clock className="h-3 w-3" />}
                          {(draft.status === "approved" || draft.status === "posted") && <CheckCircle className="h-3 w-3" />}
                          {draft.status === "rejected" && <XCircle className="h-3 w-3" />}
                          {draft.status.replace("_", " ")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(draft.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {draft.content?.slice(0, 300)}
                        {draft.content?.length > 300 && "..."}
                      </p>
                      {draft.status === "pending_approval" && (
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          <button
                            onClick={() => approveDraft(draft.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 text-xs font-medium transition-colors"
                          >
                            <CheckCircle className="h-3 w-3" /> Approve & Post
                          </button>
                          <button
                            onClick={() => rejectDraft(draft.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 text-xs font-medium transition-colors"
                          >
                            <XCircle className="h-3 w-3" /> Reject
                          </button>
                          <button
                            onClick={() => deleteDraft(draft.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-muted hover:bg-accent px-3 py-1.5 text-xs font-medium transition-colors ml-auto"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Support: Recent Activity */}
          {isSupport && (
            <>
              {tasks.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium">No activity yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Activity will appear here once your agent starts processing emails
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tasks.map((task: any) => (
                    <div key={task.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          task.status === "completed"
                            ? "bg-green-100"
                            : task.status === "failed"
                            ? "bg-red-100"
                            : "bg-gray-100"
                        )}
                      >
                        {task.status === "completed" ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : task.status === "failed" ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(task.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium capitalize",
                          task.status === "completed"
                            ? "text-green-600"
                            : task.status === "failed"
                            ? "text-red-600"
                            : "text-muted-foreground"
                        )}
                      >
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Delete Agent */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-800">Danger Zone</p>
            <p className="text-xs text-red-600">Delete this agent and all its data permanently</p>
          </div>
          <button
            onClick={deleteAgent}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 text-white hover:bg-red-700 px-4 py-2 text-sm font-medium transition-colors"
          >
            <Trash2 className="h-4 w-4" /> Delete Agent
          </button>
        </div>
      </div>
    </div>
  );
}
