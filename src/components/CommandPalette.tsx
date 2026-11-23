import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  Bug,
  Code2,
  FileText,
  FolderKanban,
  Globe,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  Terminal,
  Wrench,
  X,
} from 'lucide-react';
import { BUILTIN_COMMANDS } from '../data/commands';
import { useWorkspace } from '../context/WorkspaceContext';
import type { WorkspaceModule } from '../types/devdesk';

export interface PaletteTarget {
  module: WorkspaceModule;
  itemId?: string;
  toolId?: string;
  createAction?: 'snippet' | 'note' | 'project';
}

interface Props {
  open: boolean;
  onClose: () => void;
  onNavigate: (target: PaletteTarget) => void;
  onGoToWebsite: () => void;
}

interface ResultItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

const TOOL_ITEMS = [
  { id: 'json', name: 'JSON Formatter & Validator' },
  { id: 'base64', name: 'Base64 Encode / Decode' },
  { id: 'url', name: 'URL Encode / Decode' },
  { id: 'hash', name: 'Hash Generator (SHA-256 / 512)' },
  { id: 'uuid', name: 'UUID v4 Generator' },
  { id: 'regex', name: 'Regex Tester' },
  { id: 'timestamp', name: 'Unix Timestamp Converter' },
  { id: 'color', name: 'HEX / RGB / HSL Converter' },
  { id: 'diff', name: 'Text Diff Checker' },
  { id: 'sql', name: 'SQL Formatter' },
  { id: 'xml', name: 'XML Formatter / Validator' },
  { id: 'html', name: 'HTML Entity Encode / Decode' },
  { id: 'counter', name: 'Word & Character Counter' },
  { id: 'base', name: 'Number Base Converter' },
  { id: 'jwt', name: 'JWT Decoder' },
  { id: 'qr', name: 'QR Code Generator' },
];

export const CommandPalette: React.FC<Props> = ({ open, onClose, onNavigate, onGoToWebsite }) => {
  const { snapshot, updatePreferences } = useWorkspace();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const results = useMemo<ResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    const list: ResultItem[] = [];

    const quickActions: ResultItem[] = [
      {
        id: 'act-new-snippet',
        category: 'Quick Action',
        title: 'Create New Snippet',
        subtitle: 'Open Code Vault editor',
        icon: Plus,
        action: () => onNavigate({ module: 'snippets', createAction: 'snippet' }),
      },
      {
        id: 'act-new-note',
        category: 'Quick Action',
        title: 'Create New Note',
        subtitle: 'Open DevNotes Markdown workspace',
        icon: Plus,
        action: () => onNavigate({ module: 'notes', createAction: 'note' }),
      },
      {
        id: 'act-new-project',
        category: 'Quick Action',
        title: 'Create New Project',
        subtitle: 'Open Project Hub',
        icon: Plus,
        action: () => onNavigate({ module: 'projects', createAction: 'project' }),
      },
      {
        id: 'act-toggle-theme',
        category: 'Appearance',
        title: snapshot.preferences.theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme',
        subtitle: 'Toggle workspace color theme',
        icon: snapshot.preferences.theme === 'dark' ? Sun : Moon,
        action: () =>
          updatePreferences({ theme: snapshot.preferences.theme === 'dark' ? 'light' : 'dark' }),
      },
      {
        id: 'act-settings',
        category: 'Navigation',
        title: 'Open Settings',
        subtitle: 'Account, theme, sync & backups',
        icon: Settings,
        action: () => onNavigate({ module: 'settings' }),
      },
      {
        id: 'act-website',
        category: 'Navigation',
        title: 'Official DevDesk Website & Downloads',
        subtitle: 'Features, PWA, Windows & Android roadmap',
        icon: Globe,
        action: onGoToWebsite,
      },
    ];

    if (!q) {
      return [
        ...quickActions,
        ...TOOL_ITEMS.slice(0, 5).map((tool) => ({
          id: `tool-${tool.id}`,
          category: 'Data Lab',
          title: tool.name,
          subtitle: 'Local developer utility',
          icon: Wrench,
          action: () => onNavigate({ module: 'tools', toolId: tool.id }),
        })),
      ];
    }

    for (const qa of quickActions) {
      if (qa.title.toLowerCase().includes(q) || qa.subtitle.toLowerCase().includes(q)) {
        list.push(qa);
      }
    }

    for (const s of snapshot.snippets) {
      if (
        s.title.toLowerCase().includes(q) ||
        s.language.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.tags.some((tag) => tag.toLowerCase().includes(q))
      ) {
        list.push({
          id: `snip-${s.id}`,
          category: 'Code Vault',
          title: s.title,
          subtitle: `${s.language} · ${s.folder || 'General'}`,
          icon: Code2,
          action: () => onNavigate({ module: 'snippets', itemId: s.id }),
        });
      }
    }

    for (const n of snapshot.notes) {
      if (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((tag) => tag.toLowerCase().includes(q))
      ) {
        list.push({
          id: `note-${n.id}`,
          category: 'DevNotes',
          title: n.title,
          subtitle: n.folder || 'General',
          icon: FileText,
          action: () => onNavigate({ module: 'notes', itemId: n.id }),
        });
      }
    }

    for (const p of snapshot.projects) {
      if (p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) {
        list.push({
          id: `proj-${p.id}`,
          category: 'Project Hub',
          title: p.name,
          subtitle: `${p.status} · ${p.priority} priority`,
          icon: FolderKanban,
          action: () => onNavigate({ module: 'projects', itemId: p.id }),
        });
      }
    }

    for (const e of snapshot.errors) {
      if (
        e.title.toLowerCase().includes(q) ||
        e.errorMessage.toLowerCase().includes(q) ||
        e.language.toLowerCase().includes(q)
      ) {
        list.push({
          id: `err-${e.id}`,
          category: 'Error Archive',
          title: e.title,
          subtitle: `${e.language} · ${e.errorMessage.slice(0, 60)}`,
          icon: Bug,
          action: () => onNavigate({ module: 'errors', itemId: e.id }),
        });
      }
    }

    for (const cmd of [...snapshot.customCommands, ...BUILTIN_COMMANDS]) {
      if (
        cmd.title.toLowerCase().includes(q) ||
        cmd.command.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q)
      ) {
        list.push({
          id: `cmd-${cmd.id}`,
          category: 'Command Library',
          title: cmd.title,
          subtitle: `${cmd.category} · ${cmd.command}`,
          icon: Terminal,
          action: () => onNavigate({ module: 'commands', itemId: cmd.id }),
        });
      }
    }

    for (const bm of snapshot.bookmarks) {
      if (bm.title.toLowerCase().includes(q) || bm.url.toLowerCase().includes(q)) {
        list.push({
          id: `bm-${bm.id}`,
          category: 'Bookmarks',
          title: bm.title,
          subtitle: bm.category,
          icon: Bookmark,
          action: () => onNavigate({ module: 'bookmarks', itemId: bm.id }),
        });
      }
    }

    for (const tool of TOOL_ITEMS) {
      if (tool.name.toLowerCase().includes(q)) {
        list.push({
          id: `tool-${tool.id}`,
          category: 'Data Lab',
          title: tool.name,
          subtitle: 'Open local utility',
          icon: Wrench,
          action: () => onNavigate({ module: 'tools', toolId: tool.id }),
        });
      }
    }

    return list.slice(0, 24);
  }, [query, snapshot, onNavigate, onGoToWebsite, updatePreferences]);

  useEffect(() => {
    setActiveIndex(0);
  }, [results.length]);

  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      results[activeIndex].action();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-16 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Universal Search and Command Palette"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search snippets, notes, commands, projects, tools, or run an action…"
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No matching items found for “{query}”.
            </div>
          ) : (
            results.map((item, idx) => {
              const Icon = item.icon;
              const active = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors cursor-pointer ${
                    active
                      ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0 opacity-80" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{item.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4 py-2 text-xs text-slate-500 dark:text-slate-400">
          <span>Use ↑ ↓ to navigate, Enter to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
};
