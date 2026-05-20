"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Tag,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function KnowledgeBasePage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "" });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    loadEntries();
    loadCategories();
  }, [categoryFilter]);

  async function loadEntries() {
    try {
      const data = await api.listKnowledgeBase({ category: categoryFilter || undefined });
      setEntries(data.entries);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const cats = await api.listKBCategories();
      setCategories(cats);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.updateKBEntry(editingId, {
          title: form.title,
          content: form.content,
          category: form.category || null,
        });
      } else {
        await api.createKBEntry({
          title: form.title,
          content: form.content,
          category: form.category || undefined,
        });
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ title: "", content: "", category: "" });
      await loadEntries();
      await loadCategories();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(entry: any) {
    setEditingId(entry.id);
    setForm({ title: entry.title, content: entry.content, category: entry.category || "" });
    setShowForm(true);
  }

  async function handleDelete(entry: any) {
    if (!confirm(`Delete "${entry.title}"?`)) return;
    try {
      await api.deleteKBEntry(entry.id);
      await loadEntries();
    } catch (err: any) {
      alert(err.message);
    }
  }

  const filteredEntries = entries.filter((e) =>
    search ? e.title.toLowerCase().includes(search.toLowerCase()) || e.content.toLowerCase().includes(search.toLowerCase()) : true
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground mt-1">
            Add FAQs, product info, and policies that your Support Agent uses to reply to emails
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ title: "", content: "", category: "" }); }}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Entry
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search knowledge base..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}
      </div>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No knowledge base entries</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Add FAQs, product details, and common answers so your Support Agent can auto-reply to customer emails accurately.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Your First Entry
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="rounded-xl border bg-card p-5 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{entry.title}</h3>
                    {entry.category && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        <Tag className="h-2.5 w-2.5" />
                        {entry.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3 whitespace-pre-wrap">
                    {entry.content}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-4 shrink-0">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry)}
                    className="rounded-lg p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {total} {total === 1 ? "entry" : "entries"} in your knowledge base
      </p>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-card border shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Entry" : "Add Knowledge Base Entry"}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title / Question</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                  className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="e.g. What are your business hours?"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Answer / Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  required
                  className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  rows={6}
                  placeholder="Provide the answer or information that the AI should use when replying..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category (optional)</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="e.g. Pricing, Returns, General"
                  list="category-suggestions"
                />
                {categories.length > 0 && (
                  <datalist id="category-suggestions">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.title || !form.content}
                  className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Update" : "Add Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
