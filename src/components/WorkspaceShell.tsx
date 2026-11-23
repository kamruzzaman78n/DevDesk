import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Bookmark,
  Bug,
  ChevronLeft,
  ChevronRight,
  Code2,
  FileText,
  FolderKanban,
  Globe,
  Home,
  LayoutDashboard,
  Menu,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  Terminal,
  WifiOff,
  Wrench,
  X,
} from 'lucide-react';
import { CommandPalette, type PaletteTarget } from './CommandPalette';
import { PWAInstallButton } from './PWAInstallButton';
import { useWorkspace } from '../context/WorkspaceContext';
import { t } from '../lib/i18n';
import { AnalyticsFocusModule } from '../modules/AnalyticsFocusModule';
import { ApiStudioModule } from '../modules/ApiStudioModule';
import { BookmarksModule } from '../modules/BookmarksModule';
import { CodeVaultModule } from '../modules/CodeVaultModule';
import { CommandLibraryModule } from '../modules/CommandLibraryModule';
import { DashboardModule } from '../modules/DashboardModule';
import { DataLabModule } from '../modules/DataLabModule';
import { DevAiModule } from '../modules/DevAiModule';
import { DevNotesModule } from '../modules/DevNotesModule';
import { ErrorArchiveModule } from '../modules/ErrorArchiveModule';
import { ProjectHubModule } from '../modules/ProjectHubModule';
import { SettingsModule } from '../modules/SettingsModule';
import type { WorkspaceModule } from '../types/devdesk';

interface Props {
  onGoToWebsite: () => void;
}

const NAV_ITEMS: Array<{
  id: WorkspaceModule;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'snippets', label: 'Code Vault', icon: Code2 },
  { id: 'notes', label: 'DevNotes', icon: FileText },
  { id: 'api-studio', label: 'API Studio', icon: Globe },
  { id: 'tools', label: 'Data Lab', icon: Wrench },
  { id: 'errors', label: 'Error Archive', icon: Bug },
  { id: 'projects', label: 'Project Hub', icon: FolderKanban },
  { id: 'commands', label: 'Command Library', icon: Terminal },
  { id: 'analytics', label: 'Dev Analytics', icon: BarChart3 },
  { id: 'ai', label: 'Dev AI', icon: Sparkles },
  { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const WorkspaceShell: React.FC<Props> = ({ onGoToWebsite }) => {
  const { snapshot, loading, syncStatus, isOnline, updatePreferences } = useWorkspace();
  const [activeModule, setActiveModule] = useState<WorkspaceModule>('dashboard');
  const [targetState, setTargetState] = useState<PaletteTarget | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const copy = t('en');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleNavigate = (target: PaletteTarget) => {
    setActiveModule(target.module);
    setTargetState(target);
    setMobileNavOpen(false);
  };

  const collapsed = snapshot.preferences.sidebarCollapsed;
  const currentTitle = NAV_ITEMS.find((n) => n.id === activeModule)?.label || 'Dashboard';

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-[#0B0F17] dark:text-slate-100">
      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0E1420] transition-all shrink-0 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="h-14 flex items-center justify-between px-3 border-b border-slate-200 dark:border-slate-800/80">
          {!collapsed && (
            <button
              type="button"
              onClick={() => handleNavigate({ module: 'dashboard' })}
              className="flex items-center gap-2 font-display font-bold text-base text-slate-900 dark:text-white cursor-pointer"
            >
              <img src="/icon.svg" alt="" className="w-5 h-5 rounded" />
              <span>DevDesk</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => updatePreferences({ sidebarCollapsed: !collapsed })}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer mx-auto md:mx-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5" aria-label="Workspace modules">
          {NAV_ITEMS.filter((item) => item.id !== 'ai' || snapshot.preferences.aiEnabled).map((item) => {
            const Icon = item.icon;
            const active = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate({ module: item.id })}
                title={collapsed ? item.label : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 dark:border-slate-800/80 p-2 space-y-1">
          <button
            type="button"
            onClick={onGoToWebsite}
            title={collapsed ? 'Official Website' : undefined}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ${
              collapsed ? 'justify-center px-0' : ''
            }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Website & Downloads</span>}
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation menu"
              className="md:hidden rounded-lg border border-slate-200 dark:border-slate-800 p-1.5 text-slate-600 dark:text-slate-300"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {currentTitle}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#111827] px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search workspace…</span>
              <kbd className="hidden sm:inline font-mono text-[10px] text-slate-400">Ctrl+K</kbd>
            </button>

            <span className="hidden lg:inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 px-2">
              {!isOnline && <WifiOff className="w-3.5 h-3.5 text-amber-500" />}
              <span>{copy.sync[syncStatus]}</span>
            </span>

            <PWAInstallButton variant="compact" />

            <button
              type="button"
              onClick={() =>
                updatePreferences({
                  theme: snapshot.preferences.theme === 'dark' ? 'light' : 'dark',
                })
              }
              aria-label="Toggle theme"
              className="rounded-lg border border-slate-200 dark:border-slate-800 p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {snapshot.preferences.theme === 'dark' ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        {/* Workspace Viewport */}
        <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-6 max-w-7xl w-full mx-auto">
          {loading ? (
            <div className="space-y-4">
              <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {activeModule === 'dashboard' && <DashboardModule onNavigate={handleNavigate} />}
              {activeModule === 'snippets' && (
                <CodeVaultModule
                  initialItemId={targetState?.module === 'snippets' ? targetState.itemId : undefined}
                  initialCreate={targetState?.module === 'snippets' && targetState.createAction === 'snippet'}
                />
              )}
              {activeModule === 'notes' && (
                <DevNotesModule
                  initialItemId={targetState?.module === 'notes' ? targetState.itemId : undefined}
                  initialCreate={targetState?.module === 'notes' && targetState.createAction === 'note'}
                />
              )}
              {activeModule === 'api-studio' && <ApiStudioModule />}
              {activeModule === 'tools' && (
                <DataLabModule
                  initialToolId={targetState?.module === 'tools' ? targetState.toolId : undefined}
                />
              )}
              {activeModule === 'errors' && (
                <ErrorArchiveModule
                  initialItemId={targetState?.module === 'errors' ? targetState.itemId : undefined}
                />
              )}
              {activeModule === 'projects' && (
                <ProjectHubModule
                  initialItemId={targetState?.module === 'projects' ? targetState.itemId : undefined}
                  initialCreate={targetState?.module === 'projects' && targetState.createAction === 'project'}
                />
              )}
              {activeModule === 'commands' && (
                <CommandLibraryModule
                  initialItemId={targetState?.module === 'commands' ? targetState.itemId : undefined}
                />
              )}
              {activeModule === 'analytics' && <AnalyticsFocusModule />}
              {activeModule === 'ai' && <DevAiModule />}
              {activeModule === 'bookmarks' && <BookmarksModule />}
              {activeModule === 'settings' && <SettingsModule />}
            </>
          )}
        </main>
      </div>

      {/* Mobile Compact Bottom Navigation (<= 15% mobile sticky height cap) */}
      <nav
        aria-label="Mobile quick navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-30 h-14 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0E1420]/95 backdrop-blur-md grid grid-cols-5"
      >
        {(
          [
            ['dashboard', 'Home', LayoutDashboard],
            ['snippets', 'Code', Code2],
            ['notes', 'Notes', FileText],
            ['tools', 'Tools', Wrench],
            ['settings', 'Settings', Settings],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => handleNavigate({ module: id })}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
              activeModule === id
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Mobile Full Navigation Drawer */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileNavOpen(false)} />
          <div className="relative w-72 max-w-[80vw] bg-white dark:bg-[#0E1420] h-full flex flex-col p-4 space-y-2 z-10 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="font-display font-bold text-base">DevDesk Modules</span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close menu"
                className="p-1.5 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {NAV_ITEMS.filter((item) => item.id !== 'ai' || snapshot.preferences.aiEnabled).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate({ module: item.id })}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    activeModule === item.id
                      ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={onGoToWebsite}
              className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2.5 text-sm font-medium"
            >
              <Home className="w-4 h-4" />
              <span>Website & Downloads</span>
            </button>
          </div>
        </div>
      )}

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={handleNavigate}
        onGoToWebsite={onGoToWebsite}
      />
    </div>
  );
};
