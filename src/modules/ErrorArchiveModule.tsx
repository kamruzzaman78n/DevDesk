import React, { useEffect, useMemo, useState } from 'react';
import { Bug, CopyPlus, Plus, Search, ShieldAlert, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { useWorkspace } from '../context/WorkspaceContext';
import type { ErrorRecord } from '../types/devdesk';

export const ErrorArchiveModule: React.FC<{ initialItemId?: string }> = ({ initialItemId }) => {
  const { snapshot, updateSnapshot, pushToast } = useWorkspace();
  const [selectedId, setSelectedId] = useState<string | null>(initialItemId || null);
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<ErrorRecord | null>(null);

  useEffect(() => {
    if (initialItemId) setSelectedId(initialItemId);
  }, [initialItemId]);

  const createRecord = () => {
    const now = new Date().toISOString();
    const rec: ErrorRecord = {
      id: crypto.randomUUID(),
      title: 'New Error Log',
      language: 'typescript',
      errorMessage: '',
      context: '',
      rootCause: '',
      fixSteps: '',
      originalCode: '',
      correctedCode: '',
      tags: [],
      createdAt: now,
      updatedAt: now,
    };
    updateSnapshot(
      (prev) => ({ ...prev, errors: [rec, ...prev.errors] }),
      { type: 'error', action: 'Logged error', title: rec.title },
    );
    setSelectedId(rec.id);
  };

  const languages = useMemo(() => {
    const set = new Set(snapshot.errors.map((e) => e.language || 'other'));
    return ['all', ...Array.from(set).sort()];
  }, [snapshot.errors]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return snapshot.errors.filter((e) => {
      if (langFilter !== 'all' && e.language !== langFilter) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.errorMessage.toLowerCase().includes(q) ||
        e.rootCause.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [snapshot.errors, search, langFilter]);

  const selected = useMemo(
    () => snapshot.errors.find((e) => e.id === selectedId) || filtered[0] || null,
    [snapshot.errors, selectedId, filtered],
  );

  const patchRecord = (id: string, patch: Partial<ErrorRecord>) => {
    updateSnapshot((prev) => ({
      ...prev,
      errors: prev.errors.map((e) =>
        e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e,
      ),
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Error Archive
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Document exact error messages, root causes, and verified fixes so you never solve the same bug twice.
          </p>
        </div>
        <button
          type="button"
          onClick={createRecord}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Error</span>
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        <span>Privacy notice: Redact API keys, passwords, and personal tokens before pasting stack traces.</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exact error text, root cause, or tags…"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] pl-9 pr-3 py-2 text-xs"
          />
        </div>
        <select
          aria-label="Filter errors by language"
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] px-3 py-2 text-xs"
        >
          {languages.map((l) => (
            <option key={l} value={l}>
              {l === 'all' ? 'All Languages' : l}
            </option>
          ))}
        </select>
      </div>

      {snapshot.errors.length === 0 ? (
        <EmptyState
          icon={Bug}
          title="No debugging records yet"
          description="Save tricky runtime errors alongside their root cause and working fix."
          actionLabel="Log First Error"
          onAction={createRecord}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] divide-y divide-slate-200 dark:divide-slate-800 max-h-[660px] overflow-y-auto">
            {filtered.map((err) => (
              <button
                key={err.id}
                type="button"
                onClick={() => setSelectedId(err.id)}
                className={`w-full p-3.5 text-left transition-colors cursor-pointer ${
                  selected?.id === err.id ? 'bg-indigo-600/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                  {err.title}
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                  {err.language} · {err.errorMessage || 'No error message'}
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={selected.title}
                  onChange={(e) => patchRecord(selected.id, { title: e.target.value })}
                  className="flex-1 bg-transparent font-display text-lg font-semibold text-slate-900 dark:text-white focus:outline-none border-b border-transparent focus:border-indigo-500"
                />
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date().toISOString();
                      const copy: ErrorRecord = {
                        ...selected,
                        id: crypto.randomUUID(),
                        title: `${selected.title} (Copy)`,
                        createdAt: now,
                        updatedAt: now,
                      };
                      updateSnapshot((prev) => ({ ...prev, errors: [copy, ...prev.errors] }));
                      setSelectedId(copy.id);
                    }}
                    title="Duplicate record"
                    className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-500 cursor-pointer"
                  >
                    <CopyPlus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(selected)}
                    title="Delete record"
                    className="rounded-lg border border-red-500/30 p-2 text-red-500 hover:bg-red-500/10 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={selected.language}
                  onChange={(e) => patchRecord(selected.id, { language: e.target.value })}
                  placeholder="Language / Framework"
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs"
                />
                <input
                  type="text"
                  value={selected.tags.join(', ')}
                  onChange={(e) =>
                    patchRecord(selected.id, {
                      tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Tags (comma separated)"
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs"
                />
                <select
                  value={selected.relatedProjectId || ''}
                  onChange={(e) => patchRecord(selected.id, { relatedProjectId: e.target.value || undefined })}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] px-3 py-1.5 text-xs"
                >
                  <option value="">No Linked Project</option>
                  {snapshot.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500">Exact Error Message</label>
                <textarea
                  rows={2}
                  value={selected.errorMessage}
                  onChange={(e) => patchRecord(selected.id, { errorMessage: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-950 text-red-300 p-3 font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500">Context / When It Happened</label>
                  <textarea
                    rows={3}
                    value={selected.context}
                    onChange={(e) => patchRecord(selected.id, { context: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500">Root Cause</label>
                  <textarea
                    rows={3}
                    value={selected.rootCause}
                    onChange={(e) => patchRecord(selected.id, { rootCause: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500">Fix Steps</label>
                <textarea
                  rows={3}
                  value={selected.fixSteps}
                  onChange={(e) => patchRecord(selected.id, { fixSteps: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent p-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500">Original Code (Optional)</label>
                  <textarea
                    rows={3}
                    value={selected.originalCode || ''}
                    onChange={(e) => patchRecord(selected.id, { originalCode: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-950 text-slate-200 p-2.5 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500">Corrected Code (Optional)</label>
                  <textarea
                    rows={3}
                    value={selected.correctedCode || ''}
                    onChange={(e) => patchRecord(selected.id, { correctedCode: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-950 text-emerald-300 p-2.5 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Error Record?"
        description={`Delete "${deleteTarget?.title}" from Error Archive?`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (!deleteTarget) return;
          const removed = deleteTarget;
          updateSnapshot((prev) => ({
            ...prev,
            errors: prev.errors.filter((e) => e.id !== removed.id),
          }));
          if (selected?.id === removed.id) setSelectedId(null);
          setDeleteTarget(null);
          pushToast('Error record deleted.', 'info');
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
