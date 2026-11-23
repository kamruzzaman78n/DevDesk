import React, { useMemo, useState } from 'react';
import { Bookmark, Download, ExternalLink, Plus, Search, Star, Trash2 } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { useWorkspace } from '../context/WorkspaceContext';
import { normalizeSafeUrl } from '../lib/sanitize';
import type { BookmarkCategory, BookmarkItem } from '../types/devdesk';

const CATEGORIES: BookmarkCategory[] = [
  'documentation',
  'tutorial',
  'repository',
  'reference',
  'course',
  'tool',
];

export const BookmarksModule: React.FC = () => {
  const { snapshot, updateSnapshot, pushToast } = useWorkspace();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<'all' | BookmarkCategory>('all');
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<BookmarkCategory>('documentation');
  const [tags, setTags] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return snapshot.bookmarks.filter((b) => {
      if (catFilter !== 'all' && b.category !== catFilter) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        b.note.toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [snapshot.bookmarks, search, catFilter]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const safeUrl = normalizeSafeUrl(url);
    if (!safeUrl) {
      setFormError('Enter a valid http:// or https:// URL.');
      return;
    }
    setFormError('');
    const now = new Date().toISOString();
    const bm: BookmarkItem = {
      id: crypto.randomUUID(),
      title: title.trim() || safeUrl,
      url: safeUrl,
      category,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      note: note.trim(),
      favorite: false,
      createdAt: now,
      updatedAt: now,
    };
    updateSnapshot(
      (prev) => ({ ...prev, bookmarks: [bm, ...prev.bookmarks] }),
      { type: 'bookmark', action: 'Saved bookmark', title: bm.title },
    );
    setTitle('');
    setUrl('');
    setTags('');
    setNote('');
    setShowForm(false);
    pushToast('Bookmark saved.', 'success');
  };

  const exportBookmarks = () => {
    const blob = new Blob([JSON.stringify(snapshot.bookmarks, null, 2)], { type: 'application/json' });
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = 'devdesk-bookmarks.json';
    a.click();
    URL.revokeObjectURL(objUrl);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Bookmarks & Links
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Organize documentation, repositories, references, and courses with safe URL validation.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportBookmarks}
            disabled={snapshot.bookmarks.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-medium disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Bookmark</span>
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="rounded-xl border border-indigo-500/30 bg-white dark:bg-[#111827] p-5 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (e.g. TypeScript Handbook)"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-xs"
            />
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.typescriptlang.org/docs/"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-xs font-mono"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as BookmarkCategory)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] px-3 py-2 text-xs"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (comma separated)"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-xs"
            />
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-xs"
          />
          {formError && <div className="text-xs text-red-500">{formError}</div>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white cursor-pointer"
            >
              Save Bookmark
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookmarks…"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] pl-9 pr-3 py-2 text-xs"
          />
        </div>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value as 'all' | BookmarkCategory)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] px-3 py-2 text-xs"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {snapshot.bookmarks.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved bookmarks yet"
          description="Collect essential API docs, repositories, tutorials, and developer references."
          actionLabel="Add First Bookmark"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((bm) => {
            const safeHref = normalizeSafeUrl(bm.url);
            return (
              <div
                key={bm.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-500">{bm.category}</div>
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {bm.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        updateSnapshot((prev) => ({
                          ...prev,
                          bookmarks: prev.bookmarks.map((x) =>
                            x.id === bm.id ? { ...x, favorite: !x.favorite } : x,
                          ),
                        }))
                      }
                      className="p-1 text-slate-400 hover:text-amber-500 cursor-pointer"
                    >
                      <Star className={`w-4 h-4 ${bm.favorite ? 'text-amber-500 fill-amber-500' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSnapshot((prev) => ({
                          ...prev,
                          bookmarks: prev.bookmarks.filter((x) => x.id !== bm.id),
                        }))
                      }
                      className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {bm.note && <p className="text-xs text-slate-600 dark:text-slate-400">{bm.note}</p>}
                {safeHref && (
                  <a
                    href={safeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-indigo-500 hover:underline break-all"
                  >
                    <span>{safeHref}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
