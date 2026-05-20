"use client";

import { useEffect, useState } from "react";
import {
  Linkedin,
  Check,
  X,
  Clock,
  Send,
  Pencil,
  Trash2,
  FileText,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function PostDraftsPage() {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [editingDraft, setEditingDraft] = useState<any>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    loadDrafts();
  }, [filter]);

  async function loadDrafts() {
    setLoading(true);
    try {
      const data = await api.listPostDrafts({ status: filter || undefined });
      setDrafts(data.drafts);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(draftId: string) {
    try {
      const result = await api.approvePostDraft(draftId);
      if (result.post_error) {
        alert(`Approved but posting failed: ${result.post_error}`);
      }
      await loadDrafts();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleReject(draftId: string) {
    try {
      await api.rejectPostDraft(draftId);
      await loadDrafts();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleEdit(draftId: string) {
    try {
      await api.editPostDraft(draftId, { content: editContent });
      setEditingDraft(null);
      await loadDrafts();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDelete(draftId: string) {
    if (!confirm("Delete this draft?")) return;
    try {
      await api.deletePostDraft(draftId);
      await loadDrafts();
    } catch (err: any) {
      alert(err.message);
    }
  }

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700",
      pending_approval: "bg-amber-100 text-amber-700",
      approved: "bg-blue-100 text-blue-700",
      posted: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = {
      draft: "Draft",
      pending_approval: "Pending Approval",
      approved: "Approved",
      posted: "Posted",
      rejected: "Rejected",
    };
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", styles[status] || "bg-gray-100 text-gray-700")}>
        {status === "posted" && <Check className="h-3 w-3" />}
        {status === "pending_approval" && <Clock className="h-3 w-3" />}
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Post Drafts</h1>
        <p className="text-muted-foreground mt-1">
          Review and approve AI-generated LinkedIn posts before they go live
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {["", "pending_approval", "approved", "posted", "rejected"].map((s) => (
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
            {s === "" ? "All" : s === "pending_approval" ? "Pending" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : drafts.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No post drafts</p>
          <p className="text-sm text-muted-foreground mt-1">
            Run your LinkedIn Agent to generate post drafts for review
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <div key={draft.id} className="rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-blue-700" />
                  {statusBadge(draft.status)}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(draft.created_at).toLocaleString()}
                </span>
              </div>

              {editingDraft === draft.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full rounded-lg border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    rows={6}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(draft.id)}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingDraft(null)}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {draft.content}
                </p>
              )}

              {draft.topics && draft.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {draft.topics.map((topic: string, i: number) => (
                    <span key={i} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                      {topic}
                    </span>
                  ))}
                </div>
              )}

              {draft.posted_at && (
                <p className="text-xs text-green-600 mt-2">
                  Posted on {new Date(draft.posted_at).toLocaleString()}
                </p>
              )}

              {/* Actions */}
              {(draft.status === "pending_approval" || draft.status === "draft") && (
                <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                  <button
                    onClick={() => handleApprove(draft.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200 transition-colors"
                  >
                    <Send className="h-3 w-3" />
                    Approve & Post
                  </button>
                  <button
                    onClick={() => { setEditingDraft(draft.id); setEditContent(draft.content); }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-200 transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleReject(draft.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleDelete(draft.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors ml-auto"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {total > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {total} total {total === 1 ? "draft" : "drafts"}
        </p>
      )}
    </div>
  );
}
