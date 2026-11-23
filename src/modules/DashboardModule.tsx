import React from 'react';
import {
  ArrowRight,
  Clock,
  Code2,
  FileText,
  FolderKanban,
  Globe,
  Pin,
  Plus,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { PaletteTarget } from '../components/CommandPalette';

interface Props {
  onNavigate: (target: PaletteTarget) => void;
}

export const DashboardModule: React.FC<Props> = ({ onNavigate }) => {
  const { snapshot, updatePreferences, loadDemoWorkspace, user, syncStatus } = useWorkspace();

  const totalFocusMinutes = snapshot.focusSessions.reduce(
    (sum, s) => sum + (s.completedMinutes || 0),
    0,
  );
  const activeProjects = snapshot.projects.filter((p) => p.status === 'active');
  const pinnedSnippets = snapshot.snippets.filter((s) => s.pinned);
  const pinnedNotes = snapshot.notes.filter((n) => n.pinned);

  const isEmptyWorkspace =
    snapshot.snippets.length === 0 &&
    snapshot.notes.length === 0 &&
    snapshot.projects.length === 0 &&
    snapshot.errors.length === 0;

  const showOnboardingCard =
    !snapshot.preferences.onboardingCompleted &&
    !snapshot.preferences.onboardingDismissed;

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {todayFormatted} · {user ? user.displayName : 'Local Workspace'} ·{' '}
            {syncStatus === 'synced'
              ? 'Cloud Synced'
              : syncStatus === 'offline'
                ? 'Offline Mode'
                : 'Saved locally in IndexedDB'}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Workspace Overview
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate({ module: 'snippets', createAction: 'snippet' })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Snippet</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate({ module: 'notes', createAction: 'note' })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Note</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate({ module: 'tools', toolId: 'json' })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>JSON Formatter</span>
          </button>
        </div>
      </div>

      {/* Inline Skippable First-Run Onboarding Card (no arrival popup) */}
      {showOnboardingCard && (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-600/5 dark:bg-indigo-500/10 p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Welcome to DevDesk
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                Your data stays local in IndexedDB by default and works offline. Start with an empty workspace, or load a clearly labeled Demo Workspace to inspect snippets, notes, projects, and error logs immediately.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={loadDemoWorkspace}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-colors whitespace-nowrap cursor-pointer"
              >
                Load Demo Workspace
              </button>
              <button
                type="button"
                onClick={() => updatePreferences({ onboardingDismissed: true })}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
              >
                Skip Setup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real User Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Snippets Saved', value: snapshot.snippets.length, icon: Code2, module: 'snippets' as const },
          { label: 'DevNotes', value: snapshot.notes.length, icon: FileText, module: 'notes' as const },
          { label: 'Active Projects', value: activeProjects.length, icon: FolderKanban, module: 'projects' as const },
          { label: 'Focus Minutes', value: totalFocusMinutes, icon: Clock, module: 'analytics' as const },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.label}
              type="button"
              onClick={() => onNavigate({ module: stat.module })}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 text-left hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{stat.label}</span>
                <Icon className="w-4 h-4" />
              </div>
              <div className="mt-2 font-display text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                {stat.value}
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Launch Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'New Snippet', icon: Code2, target: { module: 'snippets' as const, createAction: 'snippet' as const } },
          { label: 'New Note', icon: FileText, target: { module: 'notes' as const, createAction: 'note' as const } },
          { label: 'New Project', icon: FolderKanban, target: { module: 'projects' as const, createAction: 'project' as const } },
          { label: 'Open API Studio', icon: Globe, target: { module: 'api-studio' as const } },
          { label: 'Focus Timer', icon: Clock, target: { module: 'analytics' as const } },
        ].map((qa) => {
          const Icon = qa.icon;
          return (
            <button
              key={qa.label}
              type="button"
              onClick={() => onNavigate(qa.target)}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-3.5 py-3 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
            >
              <Icon className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="truncate">{qa.label}</span>
            </button>
          );
        })}
      </div>

      {isEmptyWorkspace ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/60 dark:bg-[#111827]/60 p-8 text-center">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Your workspace is clean and ready
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
            Create your first snippet, note, or project—or open Data Lab utilities and the Command Library right away.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate({ module: 'snippets', createAction: 'snippet' })}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 cursor-pointer"
            >
              Create First Snippet
            </button>
            <button
              type="button"
              onClick={loadDemoWorkspace}
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Load Demo Workspace
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Pinned & Active Projects */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Pinned Items
                </h2>
                <Pin className="w-4 h-4 text-slate-400" />
              </div>
              {pinnedSnippets.length === 0 && pinnedNotes.length === 0 ? (
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  Pin snippets or notes to keep them within one click.
                </p>
              ) : (
                <div className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
                  {pinnedSnippets.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onNavigate({ module: 'snippets', itemId: s.id })}
                      className="flex w-full items-center justify-between py-2.5 text-left hover:text-indigo-500 transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{s.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Snippet · {s.language} · {s.folder}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                  {pinnedNotes.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => onNavigate({ module: 'notes', itemId: n.id })}
                      className="flex w-full items-center justify-between py-2.5 text-left hover:text-indigo-500 transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{n.title}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Note · {n.folder}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Active Projects
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigate({ module: 'projects' })}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Open Hub
                </button>
              </div>
              {activeProjects.length === 0 ? (
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  No active projects yet.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {activeProjects.slice(0, 4).map((proj) => {
                    const projTasks = snapshot.tasks.filter((t) => t.projectId === proj.id);
                    const doneCount = projTasks.filter((t) => t.status === 'done').length;
                    const pct = projTasks.length ? Math.round((doneCount / projTasks.length) * 100) : 0;
                    return (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => onNavigate({ module: 'projects', itemId: proj.id })}
                        className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-left hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {proj.name}
                          </span>
                          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                            {doneCount}/{projTasks.length} tasks ({pct}%)
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Real Activity */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
              <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                Recent Activity
              </h2>
              {snapshot.activities.length === 0 ? (
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  Real activity events will appear here as you create or update workspace items.
                </p>
              ) : (
                <div className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
                  {snapshot.activities.slice(0, 8).map((act) => (
                    <div key={act.id} className="py-2.5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {act.action}: {act.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {act.type}
                        </div>
                      </div>
                      <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                        {new Date(act.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {snapshot.preferences.aiEnabled && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>Dev AI Assistant</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Opt-in assistant for code explanation, debugging, SQL, and regex. Only receives items you explicitly attach.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate({ module: 'ai' })}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  <span>Open Dev AI</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
