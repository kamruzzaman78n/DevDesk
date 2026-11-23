import React, { useEffect, useMemo, useState } from 'react';
import {
  Columns2,
  Download,
  Eye,
  FileText,
  Pencil,
  Pin,
  Plus,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { useWorkspace } from '../context/WorkspaceContext';
import { renderSafeMarkdown } from '../lib/sanitize';
import type { DevNote } from '../types/devdesk';

const TEMPLATES: Record<NonNullable<DevNote['templateType']>, { label: string; body: string }> = {
  blank: { label: 'Blank Note', body: '# New Note\n\nStart writing Markdown here…' },
  concept: {
    label: 'Concept Note',
    body: `# Concept Title\n\n## Summary\nConcise explanation in plain language.\n\n## Example\n\`\`\`ts\n// Add minimal example\n\`\`\`\n\n## Key Takeaways\n- Point 1\n- Point 2`,
  },
  'bug-fix': {
    label: 'Bug Fix Log',
    body: `# Bug Fix: Issue Title\n\n## Symptom\nWhat failed and where?\n\n## Root Cause\nWhy did it happen?\n\n## Verified Fix\n- [ ] Added regression check\n- [x] Applied fix`,
  },
  'api-ref': {
    label: 'API Reference',
    body: `# Endpoint Reference\n\n**Method & Path:** \`GET /api/v1/resource\`\n\n| Parameter | Type | Required |\n| --- | --- | --- |\n| id | string | Yes |\n\n## Response Example\n\`\`\`json\n{\n  "ok": true\n}\n\`\`\``,
  },
  learning: {
    label: 'Learning Note',
    body: `# Topic Studied\n\n## Questions to Answer\n- [ ] Question 1\n\n## Notes & Resources\nLink related notes with \`[[Note Title]]\`.`,
  },
  project: {
    label: 'Project / Meeting Note',
    body: `# Project Sync\n\n## Decisions\n- Decision 1\n\n## Action Items\n- [ ] Task 1`,
  },
};

interface Props {
  initialItemId?: string;
  initialCreate?: boolean;
}

export const DevNotesModule: React.FC<Props> = ({ initialItemId, initialCreate }) => {
  const { snapshot, updateSnapshot, saveState, pushToast } = useWorkspace();
  const [selectedId, setSelectedId] = useState<string | null>(initialItemId || null);
  const [search, setSearch] = useState('');
  const [folderFilter, setFolderFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [templateChoice, setTemplateChoice] = useState<NonNullable<DevNote['templateType']>>('concept');
  const [deleteTarget, setDeleteTarget] = useState<DevNote | null>(null);

  useEffect(() => {
    if (initialItemId) setSelectedId(initialItemId);
  }, [initialItemId]);

  const createNote = (tpl: NonNullable<DevNote['templateType']> = templateChoice) => {
    const now = new Date().toISOString();
    const note: DevNote = {
      id: crypto.randomUUID(),
      title: TEMPLATES[tpl].label,
      content: TEMPLATES[tpl].body,
      folder: 'General',
      tags: [],
      pinned: false,
      favorite: false,
      templateType: tpl,
      createdAt: now,
      updatedAt: now,
    };
    updateSnapshot(
      (prev) => ({ ...prev, notes: [note, ...prev.notes] }),
      { type: 'note', action: 'Created note', title: note.title },
    );
    setSelectedId(note.id);
  };

  useEffect(() => {
    if (initialCreate) createNote('blank');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCreate]);

  const folders = useMemo(() => {
    const set = new Set(snapshot.notes.map((n) => n.folder || 'General'));
    return ['all', ...Array.from(set).sort()];
  }, [snapshot.notes]);

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return snapshot.notes
      .filter((n) => {
        if (folderFilter !== 'all' && (n.folder || 'General') !== folderFilter) return false;
        if (!q) return true;
        return (
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [snapshot.notes, search, folderFilter]);

  const selected = useMemo(
    () => snapshot.notes.find((n) => n.id === selectedId) || filteredNotes[0] || null,
    [snapshot.notes, selectedId, filteredNotes],
  );

  const patchNote = (id: string, patch: Partial<DevNote>) => {
    updateSnapshot((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n,
      ),
    }));
  };

  // Detect [[Note Title]] backlinks
  const backlinks = useMemo(() => {
    if (!selected) return [];
    const target = `[[${selected.title.toLowerCase()}]]`;
    return snapshot.notes.filter(
      (n) => n.id !== selected.id && n.content.toLowerCase().includes(target),
    );
  }, [selected, snapshot.notes]);

  const sanitizedHtml = useMemo(
    () => (selected ? renderSafeMarkdown(selected.content) : ''),
    [selected],
  );

  const exportMarkdown = () => {
    if (!selected) return;
    const blob = new Blob([selected.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(selected.title || 'note').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            DevNotes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {snapshot.notes.length} Markdown notes ·{' '}
            {saveState === 'saving' ? 'Saving…' : 'Autosaved'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Note template"
            value={templateChoice}
            onChange={(e) => setTemplateChoice(e.target.value as NonNullable<DevNote['templateType']>)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] px-3 py-2 text-xs"
          >
            {Object.entries(TEMPLATES).map(([key, tpl]) => (
              <option key={key} value={key}>
                Template: {tpl.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => createNote(templateChoice)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* Search & Folder */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search note titles, Markdown content, or tags…"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] pl-9 pr-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <select
          aria-label="Filter notes by folder"
          value={folderFilter}
          onChange={(e) => setFolderFilter(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] px-3 py-2 text-xs"
        >
          {folders.map((f) => (
            <option key={f} value={f}>
              {f === 'all' ? 'All Folders' : f}
            </option>
          ))}
        </select>
      </div>

      {snapshot.notes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No notes yet"
          description="Write sanitized Markdown technical documentation, bug-fix logs, and study notes with live preview and templates."
          actionLabel="Create First Note"
          onAction={() => createNote('concept')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] divide-y divide-slate-200 dark:divide-slate-800 max-h-[680px] overflow-y-auto">
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => setSelectedId(note.id)}
                className={`w-full p-3.5 text-left transition-colors cursor-pointer ${
                  selected?.id === note.id
                    ? 'bg-indigo-600/10'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {note.title || 'Untitled Note'}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {note.pinned && <Pin className="w-3.5 h-3.5 text-indigo-500" />}
                    {note.favorite && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                  </div>
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                  {note.folder || 'General'} · {new Date(note.updatedAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <div className="lg:col-span-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <input
                  type="text"
                  aria-label="Note title"
                  value={selected.title}
                  onChange={(e) => patchNote(selected.id, { title: e.target.value })}
                  className="flex-1 min-w-[200px] bg-transparent font-display text-lg font-semibold text-slate-900 dark:text-white focus:outline-none border-b border-transparent focus:border-indigo-500 pb-0.5"
                />
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-900">
                    {(
                      [
                        ['edit', Pencil, 'Edit'],
                        ['split', Columns2, 'Split'],
                        ['preview', Eye, 'Preview'],
                      ] as const
                    ).map(([mode, Icon, label]) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setViewMode(mode)}
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer ${
                          viewMode === mode
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => patchNote(selected.id, { pinned: !selected.pinned })}
                    title="Pin note"
                    className={`rounded-lg border p-2 cursor-pointer ${
                      selected.pinned
                        ? 'border-indigo-500 text-indigo-500 bg-indigo-500/10'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => patchNote(selected.id, { favorite: !selected.favorite })}
                    title="Favorite note"
                    className={`rounded-lg border p-2 cursor-pointer ${
                      selected.favorite
                        ? 'border-amber-500 text-amber-500 bg-amber-500/10'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={exportMarkdown}
                    title="Export Markdown (.md)"
                    className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(selected)}
                    title="Delete note"
                    className="rounded-lg border border-red-500/30 p-2 text-red-500 hover:bg-red-500/10 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  aria-label="Folder"
                  value={selected.folder}
                  onChange={(e) => patchNote(selected.id, { folder: e.target.value })}
                  placeholder="Folder (e.g. Architecture)"
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs"
                />
                <input
                  type="text"
                  aria-label="Tags"
                  value={selected.tags.join(', ')}
                  onChange={(e) =>
                    patchNote(selected.id, {
                      tags: e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Tags (comma separated)"
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs"
                />
              </div>

              <div
                className={`grid gap-4 ${
                  viewMode === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
                }`}
              >
                {viewMode !== 'preview' && (
                  <textarea
                    aria-label="Markdown editor"
                    value={selected.content}
                    onChange={(e) => patchNote(selected.id, { content: e.target.value })}
                    rows={18}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F17] p-4 font-mono text-xs leading-6 text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                    placeholder="# Write Markdown here…"
                  />
                )}
                {viewMode !== 'edit' && (
                  <div
                    className="devdesk-prose min-h-[360px] max-h-[540px] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1523] p-5 text-slate-800 dark:text-slate-200"
                    dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                  />
                )}
              </div>

              {backlinks.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Linked from {backlinks.length} note(s):
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {backlinks.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedId(b.id)}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        {b.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Note?"
        description={`Are you sure you want to permanently delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete Note"
        onConfirm={() => {
          if (!deleteTarget) return;
          const removed = deleteTarget;
          updateSnapshot(
            (prev) => ({ ...prev, notes: prev.notes.filter((n) => n.id !== removed.id) }),
            { type: 'note', action: 'Deleted note', title: removed.title },
          );
          if (selected?.id === removed.id) setSelectedId(null);
          setDeleteTarget(null);
          pushToast(`Deleted "${removed.title}".`, 'info');
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
