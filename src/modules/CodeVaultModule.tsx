import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  CopyPlus,
  Download,
  Pin,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { useWorkspace } from '../context/WorkspaceContext';
import type { CodeSnippet } from '../types/devdesk';
import { CODE_LANGUAGES, highlightCode } from './codeVaultLanguages';

interface Props {
  initialItemId?: string;
  initialCreate?: boolean;
}

interface LanguagePickerProps {
  value: string;
  onChange: (language: string) => void;
}

const LanguagePicker: React.FC<LanguagePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const current = CODE_LANGUAGES.find((language) => language.id === value);
  const normalizedQuery = query.trim().toLowerCase();
  const matches = CODE_LANGUAGES.filter(
    (language) =>
      !normalizedQuery ||
      `${language.label} ${language.id} ${language.extension}`.toLowerCase().includes(normalizedQuery),
  );

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          setIsOpen((open) => !open);
          setQuery('');
        }}
        className="mt-1 flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent dark:bg-[#0B0F17] px-2.5 py-1.5 text-left text-xs"
      >
        <span className="truncate">{current?.label || value}</span>
        <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      </button>
      {isOpen && (
        <div className="absolute z-30 mt-1 w-full min-w-56 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] p-1.5 shadow-xl">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              autoFocus
              aria-label="Search programming languages"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setIsOpen(false);
              }}
              placeholder="Search 70+ languages…"
              className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent py-1.5 pl-8 pr-2 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div role="listbox" aria-label="Programming languages" className="mt-1 max-h-56 overflow-y-auto">
            {matches.map((language) => (
              <button
                key={language.id}
                type="button"
                role="option"
                aria-selected={value === language.id}
                onClick={() => {
                  onChange(language.id);
                  setIsOpen(false);
                  setQuery('');
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  value === language.id ? 'text-indigo-600 dark:text-indigo-400' : ''
                }`}
              >
                <span>{language.label}</span>
                <span className="font-mono text-[10px] text-slate-400">{language.extension}</span>
              </button>
            ))}
            {matches.length === 0 && (
              <p className="px-2.5 py-3 text-xs text-slate-500">No matching languages.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface HighlightedEditorProps {
  code: string;
  language: string;
  rows: number;
  wordWrap: boolean;
  onChange: (code: string) => void;
}

const HighlightedEditor: React.FC<HighlightedEditorProps> = ({
  code,
  language,
  rows,
  wordWrap,
  onChange,
}) => {
  const highlightRef = useRef<HTMLPreElement>(null);
  const tokens = highlightCode(code, language);

  return (
    <div className="relative min-w-0 flex-1">
      <pre
        ref={highlightRef}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 m-0 overflow-hidden p-3 font-mono text-xs leading-6 ${
          wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
        }`}
      >
        {code
          ? tokens.map((token, index) => (
              <span
                key={`${index}-${token.kind}`}
                className={{
                  keyword: 'text-violet-300',
                  string: 'text-emerald-300',
                  comment: 'text-slate-500 italic',
                  number: 'text-amber-300',
                  function: 'text-sky-300',
                  operator: 'text-cyan-300',
                  plain: 'text-slate-100',
                }[token.kind]}
              >
                {token.text}
              </span>
            ))
          : <span className="text-slate-500">// Write or paste your code snippet here…</span>}
      </pre>
      <textarea
        aria-label="Snippet code body"
        value={code}
        onChange={(event) => onChange(event.target.value)}
        onScroll={(event) => {
          if (highlightRef.current) {
            highlightRef.current.style.transform = `translate(${-event.currentTarget.scrollLeft}px, ${-event.currentTarget.scrollTop}px)`;
          }
        }}
        spellCheck={false}
        rows={rows}
        className={`relative z-10 block w-full resize-none bg-transparent p-3 font-mono text-xs leading-6 text-transparent caret-slate-100 selection:bg-indigo-500/40 selection:text-slate-100 focus:outline-none ${
          wordWrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre overflow-auto'
        }`}
      />
    </div>
  );
};

export const CodeVaultModule: React.FC<Props> = ({ initialItemId, initialCreate }) => {
  const { snapshot, updateSnapshot, saveState, pushToast } = useWorkspace();
  const [selectedId, setSelectedId] = useState<string | null>(initialItemId || null);
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('all');
  const [folderFilter, setFolderFilter] = useState('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<'updated' | 'title' | 'usage'>('updated');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CodeSnippet | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialItemId) setSelectedId(initialItemId);
  }, [initialItemId]);

  const createSnippet = () => {
    const now = new Date().toISOString();
    const item: CodeSnippet = {
      id: crypto.randomUUID(),
      title: 'Untitled Snippet',
      language: snapshot.preferences.defaultLanguage || 'typescript',
      code: '',
      description: '',
      tags: [],
      folder: 'General',
      pinned: false,
      favorite: false,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    updateSnapshot(
      (prev) => ({ ...prev, snippets: [item, ...prev.snippets] }),
      { type: 'snippet', action: 'Created snippet', title: item.title },
    );
    setSelectedId(item.id);
  };

  useEffect(() => {
    if (initialCreate) {
      createSnippet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCreate]);

  const folders = useMemo(() => {
    const set = new Set(snapshot.snippets.map((s) => s.folder || 'General'));
    return ['all', ...Array.from(set).sort()];
  }, [snapshot.snippets]);

  const filteredSnippets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return snapshot.snippets
      .filter((s) => {
        if (langFilter !== 'all' && s.language !== langFilter) return false;
        if (folderFilter !== 'all' && (s.folder || 'General') !== folderFilter) return false;
        if (onlyFavorites && !s.favorite) return false;
        if (!q) return true;
        return (
          s.title.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.language.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'usage') return b.usageCount - a.usageCount;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [snapshot.snippets, search, langFilter, folderFilter, onlyFavorites, sortBy]);

  const selected = useMemo(
    () => snapshot.snippets.find((s) => s.id === selectedId) || filteredSnippets[0] || null,
    [snapshot.snippets, selectedId, filteredSnippets],
  );

  const patchSnippet = (id: string, patch: Partial<CodeSnippet>) => {
    updateSnapshot((prev) => ({
      ...prev,
      snippets: prev.snippets.map((s) =>
        s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s,
      ),
    }));
  };

  const handleCopyCode = async (snippet: CodeSnippet) => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopiedId(snippet.id);
      patchSnippet(snippet.id, { usageCount: (snippet.usageCount || 0) + 1 });
      window.setTimeout(() => setCopiedId(null), 1600);
      pushToast('Code copied to clipboard.', 'success');
    } catch {
      pushToast('Clipboard access blocked by browser.', 'error');
    }
  };

  const handleDuplicate = (snippet: CodeSnippet) => {
    const now = new Date().toISOString();
    const copy: CodeSnippet = {
      ...snippet,
      id: crypto.randomUUID(),
      title: `${snippet.title} (Copy)`,
      pinned: false,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    updateSnapshot(
      (prev) => ({ ...prev, snippets: [copy, ...prev.snippets] }),
      { type: 'snippet', action: 'Duplicated snippet', title: copy.title },
    );
    setSelectedId(copy.id);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const removed = deleteTarget;
    updateSnapshot(
      (prev) => ({
        ...prev,
        snippets: prev.snippets.filter((s) => s.id !== removed.id),
      }),
      { type: 'snippet', action: 'Deleted snippet', title: removed.title },
    );
    if (selected?.id === removed.id) setSelectedId(null);
    setDeleteTarget(null);
    pushToast(`Deleted "${removed.title}".`, 'info');
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(snapshot.snippets, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devdesk-snippets-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) throw new Error('Expected JSON array');
        const valid: CodeSnippet[] = parsed
          .filter((item) => item && typeof item.title === 'string' && typeof item.code === 'string')
          .map((item) => ({
            id: crypto.randomUUID(),
            title: String(item.title).slice(0, 120),
            language: typeof item.language === 'string' ? item.language : 'typescript',
            code: String(item.code),
            description: typeof item.description === 'string' ? item.description : '',
            tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
            folder: typeof item.folder === 'string' ? item.folder : 'Imported',
            pinned: Boolean(item.pinned),
            favorite: Boolean(item.favorite),
            usageCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
        updateSnapshot((prev) => ({
          ...prev,
          snippets: [...valid, ...prev.snippets],
        }));
        pushToast(`Imported ${valid.length} snippets.`, 'success');
      } catch {
        pushToast('Invalid snippet export JSON file.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const lineCount = selected ? Math.max(1, selected.code.split('\n').length) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Code Vault
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {snapshot.snippets.length} snippets stored locally ·{' '}
            {saveState === 'saving' ? 'Saving…' : 'Autosaved'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={snapshot.snippets.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={createSnippet}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Snippet</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, code, tag, or description…"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <select
          aria-label="Filter by language"
          value={langFilter}
          onChange={(e) => setLangFilter(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
        >
          <option value="all">All Languages</option>
          {CODE_LANGUAGES.map((language) => (
            <option key={language.id} value={language.id}>
              {language.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by folder"
          value={folderFilter}
          onChange={(e) => setFolderFilter(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
        >
          {folders.map((f) => (
            <option key={f} value={f}>
              {f === 'all' ? 'All Folders' : f}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOnlyFavorites((v) => !v)}
            className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
              onlyFavorites
                ? 'border-indigo-500 bg-indigo-600/10 text-indigo-600 dark:text-indigo-400'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300'
            }`}
          >
            Favorites
          </button>
          <select
            aria-label="Sort snippets"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'updated' | 'title' | 'usage')}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] px-2.5 py-2 text-xs text-slate-800 dark:text-slate-100"
          >
            <option value="updated">Recent</option>
            <option value="title">Title</option>
            <option value="usage">Most Copied</option>
          </select>
        </div>
      </div>

      {snapshot.snippets.length === 0 ? (
        <EmptyState
          icon={Code2}
          title="No snippets in Code Vault yet"
          description="Save reusable functions, SQL queries, hooks, and patterns with tags, folders, and instant search."
          actionLabel="Create First Snippet"
          onAction={createSnippet}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* List */}
          <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] divide-y divide-slate-200 dark:divide-slate-800 max-h-[680px] overflow-y-auto">
            {filteredSnippets.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No snippets match your current filter.
              </div>
            ) : (
              filteredSnippets.map((item) => {
                const isSelected = selected?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full p-3.5 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/10'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {item.title || 'Untitled Snippet'}
                      </span>
                      <div className="flex items-center gap-1 shrink-0 text-slate-400">
                        {item.pinned && <Pin className="w-3.5 h-3.5 text-indigo-500" />}
                        {item.favorite && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                      {item.language} · {item.folder || 'General'}
                      {item.tags.length > 0 ? ` · ${item.tags.join(', ')}` : ''}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Detail Editor */}
          {selected && (
            <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <input
                  type="text"
                  aria-label="Snippet title"
                  value={selected.title}
                  onChange={(e) => patchSnippet(selected.id, { title: e.target.value })}
                  className="flex-1 min-w-[200px] bg-transparent font-display text-lg font-semibold text-slate-900 dark:text-white focus:outline-none border-b border-transparent focus:border-indigo-500 pb-0.5"
                />
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => patchSnippet(selected.id, { pinned: !selected.pinned })}
                    title="Pin snippet"
                    className={`rounded-lg border p-2 text-xs cursor-pointer ${
                      selected.pinned
                        ? 'border-indigo-500 text-indigo-500 bg-indigo-500/10'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => patchSnippet(selected.id, { favorite: !selected.favorite })}
                    title="Favorite snippet"
                    className={`rounded-lg border p-2 text-xs cursor-pointer ${
                      selected.favorite
                        ? 'border-amber-500 text-amber-500 bg-amber-500/10'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(selected)}
                    title="Duplicate snippet"
                    className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <CopyPlus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(selected)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500 cursor-pointer"
                  >
                    {copiedId === selected.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(selected)}
                    title="Delete snippet"
                    className="rounded-lg border border-red-500/30 p-2 text-red-500 hover:bg-red-500/10 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Language
                  </label>
                  <LanguagePicker
                    value={selected.language}
                    onChange={(language) => patchSnippet(selected.id, { language })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Folder / Collection
                  </label>
                  <input
                    type="text"
                    value={selected.folder}
                    onChange={(e) => patchSnippet(selected.id, { folder: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={selected.tags.join(', ')}
                    onChange={(e) =>
                      patchSnippet(selected.id, {
                        tags: e.target.value
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="react, hooks, auth"
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              {/* Line-numbered Code Editor */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 px-3 py-1.5 text-[11px] font-mono text-slate-400">
                  <span>
                    {CODE_LANGUAGES.find((language) => language.id === selected.language)?.label ||
                      selected.language}
                    {CODE_LANGUAGES.find((language) => language.id === selected.language)?.extension &&
                      ` · ${CODE_LANGUAGES.find((language) => language.id === selected.language)?.extension}`}
                  </span>
                  <span>{lineCount} lines · Copied {selected.usageCount}x</span>
                </div>
                <div className="flex max-h-[340px] overflow-auto">
                  {snapshot.preferences.editorLineNumbers && (
                    <div
                      aria-hidden="true"
                      className="select-none border-r border-slate-800 bg-slate-900/60 px-3 py-3 text-right font-mono text-xs leading-6 text-slate-500 tabular-nums"
                    >
                      {Array.from({ length: lineCount }, (_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>
                  )}
                  <HighlightedEditor
                    code={selected.code}
                    language={selected.language}
                    onChange={(code) => patchSnippet(selected.id, { code })}
                    rows={Math.max(10, Math.min(20, lineCount + 1))}
                    wordWrap={snapshot.preferences.editorWordWrap}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Explanation / Usage Notes
                </label>
                <textarea
                  rows={2}
                  value={selected.description}
                  onChange={(e) => patchSnippet(selected.id, { description: e.target.value })}
                  placeholder="Describe what this snippet does and when to use it…"
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Time Complexity (optional)
                  </label>
                  <input
                    type="text"
                    value={selected.timeComplexity || ''}
                    onChange={(e) => patchSnippet(selected.id, { timeComplexity: e.target.value })}
                    placeholder="e.g. O(n log n)"
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Space Complexity (optional)
                  </label>
                  <input
                    type="text"
                    value={selected.spaceComplexity || ''}
                    onChange={(e) => patchSnippet(selected.id, { spaceComplexity: e.target.value })}
                    placeholder="e.g. O(1)"
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Snippet?"
        description={`Are you sure you want to permanently delete "${deleteTarget?.title}"?`}
        confirmLabel="Delete Snippet"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
