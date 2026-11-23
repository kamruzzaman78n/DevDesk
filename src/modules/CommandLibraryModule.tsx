import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  Plus,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import { BUILTIN_COMMANDS } from '../data/commands';
import { useWorkspace } from '../context/WorkspaceContext';
import type { CommandItem } from '../types/devdesk';

const CATEGORIES: Array<'All' | CommandItem['category']> = [
  'All',
  'Git',
  'Windows / PowerShell',
  'Linux Shell',
  'npm / pnpm',
  'Python / pip',
  'Docker',
  'SQL',
  'Networking',
  'C / C++',
];

export const CommandLibraryModule: React.FC<{ initialItemId?: string }> = ({ initialItemId }) => {
  const { snapshot, updateSnapshot, pushToast } = useWorkspace();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'All' | CommandItem['category']>('All');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newCat, setNewCat] = useState<CommandItem['category']>('Git');
  const [newCmd, setNewCmd] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newParams, setNewParams] = useState('');
  const [newDestructive, setNewDestructive] = useState(false);

  const allCommands = useMemo(() => {
    const favSet = new Set(snapshot.favoriteCommandIds);
    const builtins = BUILTIN_COMMANDS.map((c) => ({
      ...c,
      favorite: favSet.has(c.id),
    }));
    const customs = snapshot.customCommands.map((c) => ({
      ...c,
      favorite: favSet.has(c.id) || c.favorite,
    }));
    return [...customs, ...builtins];
  }, [snapshot.customCommands, snapshot.favoriteCommandIds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allCommands.filter((c) => {
      if (category !== 'All' && c.category !== category) return false;
      if (onlyFavorites && !c.favorite) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.command.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    });
  }, [allCommands, search, category, onlyFavorites]);

  const toggleFavorite = (cmd: CommandItem) => {
    updateSnapshot((prev) => {
      const exists = prev.favoriteCommandIds.includes(cmd.id);
      return {
        ...prev,
        favoriteCommandIds: exists
          ? prev.favoriteCommandIds.filter((id) => id !== cmd.id)
          : [...prev.favoriteCommandIds, cmd.id],
      };
    });
  };

  const copyCommand = async (cmd: CommandItem) => {
    try {
      await navigator.clipboard.writeText(cmd.command);
      setCopiedId(cmd.id);
      window.setTimeout(() => setCopiedId(null), 1500);
      pushToast('Command copied. Verify parameters before running.', 'success');
    } catch {
      pushToast('Clipboard access blocked.', 'error');
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCmd.trim()) return;
    const now = new Date().toISOString();
    const item: CommandItem = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      category: newCat,
      command: newCmd.trim(),
      description: newDesc.trim() || 'Custom user command.',
      parameters: newParams.trim() || undefined,
      destructive: newDestructive,
      favorite: true,
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    };
    updateSnapshot(
      (prev) => ({
        ...prev,
        customCommands: [item, ...prev.customCommands],
        favoriteCommandIds: [...prev.favoriteCommandIds, item.id],
      }),
      { type: 'command', action: 'Added custom command', title: item.title },
    );
    setNewTitle('');
    setNewCmd('');
    setNewDesc('');
    setNewParams('');
    setNewDestructive(false);
    setShowCreate(false);
  };

  const exportCommands = () => {
    const blob = new Blob([JSON.stringify(snapshot.customCommands, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devdesk-custom-commands.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Command Library
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Searchable CLI reference across Git, Shells, Docker, SQL, and build tools. Commands are copy-only and never auto-execute.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCommands}
            disabled={snapshot.customCommands.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Custom</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Command</span>
          </button>
        </div>
      </div>

      {showCreate && (
        <form
          onSubmit={handleAddCustom}
          className="rounded-xl border border-indigo-500/30 bg-white dark:bg-[#111827] p-5 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Command title (e.g. Tail Nginx logs)"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-xs"
            />
            <select
              value={newCat}
              onChange={(e) => setNewCat(e.target.value as CommandItem['category'])}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] px-3 py-2 text-xs"
            >
              {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            required
            value={newCmd}
            onChange={(e) => setNewCmd(e.target.value)}
            placeholder="Command syntax (e.g. tail -f /var/log/nginx/error.log)"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-xs font-mono"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-xs"
            />
            <input
              type="text"
              value={newParams}
              onChange={(e) => setNewParams(e.target.value)}
              placeholder="Parameters hint (optional)"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-xs"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={newDestructive}
                onChange={(e) => setNewDestructive(e.target.checked)}
              />
              <span>Mark as destructive command</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 cursor-pointer"
              >
                Save Command
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Search & Category Tabs */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search commands, flags, or descriptions…"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] pl-9 pr-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <select
          aria-label="Filter command category"
          value={category}
          onChange={(e) => setCategory(e.target.value as 'All' | CommandItem['category'])}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] px-3 py-2 text-xs"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setOnlyFavorites((v) => !v)}
          className={`rounded-lg border px-3 py-2 text-xs font-medium cursor-pointer ${
            onlyFavorites
              ? 'border-indigo-500 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300'
          }`}
        >
          Favorites
        </button>
      </div>

      {/* Command Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((cmd) => (
          <div
            key={cmd.id}
            className={`rounded-xl border bg-white dark:bg-[#111827] p-4 space-y-2.5 ${
              initialItemId === cmd.id
                ? 'border-indigo-500'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {cmd.category} {cmd.isCustom ? '· Custom' : ''}
                </div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {cmd.title}
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleFavorite(cmd)}
                  title="Favorite command"
                  className={`rounded-lg p-1.5 cursor-pointer ${
                    cmd.favorite ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Star className={`w-4 h-4 ${cmd.favorite ? 'fill-amber-500' : ''}`} />
                </button>
                {cmd.isCustom && (
                  <button
                    type="button"
                    onClick={() =>
                      updateSnapshot((prev) => ({
                        ...prev,
                        customCommands: prev.customCommands.filter((x) => x.id !== cmd.id),
                      }))
                    }
                    title="Delete custom command"
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-500/10 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {cmd.destructive && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Destructive command — verify target before running.</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 px-3 py-2">
              <code className="text-xs font-mono text-slate-100 overflow-x-auto whitespace-nowrap">
                {cmd.command}
              </code>
              <button
                type="button"
                onClick={() => copyCommand(cmd)}
                className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-700 shrink-0 cursor-pointer"
              >
                {copiedId === cmd.id ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">{cmd.description}</p>
            {cmd.parameters && (
              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Parameters: {cmd.parameters}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
