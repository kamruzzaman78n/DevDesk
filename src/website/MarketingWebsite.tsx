import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Code2,
  Cpu,
  Download,
  FileText,
  FolderKanban,
  Globe,
  Laptop,
  Lock,
  Menu,
  Moon,
  Shield,
  Smartphone,
  Sun,
  Terminal,
  Wrench,
  X,
} from 'lucide-react';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { useWorkspace } from '../context/WorkspaceContext';
import type { WebsitePage } from '../types/devdesk';

interface Props {
  activePage: WebsitePage;
  onChangePage: (page: WebsitePage) => void;
  onLaunchApp: () => void;
}

export const MarketingWebsite: React.FC<Props> = ({
  activePage,
  onChangePage,
  onLaunchApp,
}) => {
  const { snapshot, updatePreferences, pushToast } = useWorkspace();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Support form state
  const [supportEmail, setSupportEmail] = useState('');
  const [supportCategory, setSupportCategory] = useState('bug');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportTicketId, setSupportTicketId] = useState<string | null>(null);
  const [supportError, setSupportError] = useState<string | null>(null);

  const navigate = (page: WebsitePage) => {
    onChangePage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupportError(null);
    setSupportSubmitting(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: supportEmail,
          category: supportCategory,
          subject: supportSubject,
          message: supportMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSupportError(data.error || 'Could not submit request.');
      } else {
        setSupportTicketId(data.ticketId);
        setSupportSubject('');
        setSupportMessage('');
        pushToast('Support request submitted.', 'success');
      }
    } catch {
      setSupportError('Network error submitting request. Please try again.');
    } finally {
      setSupportSubmitting(false);
    }
  };

  const toggleTheme = () => {
    updatePreferences({
      theme: snapshot.preferences.theme === 'dark' ? 'light' : 'dark',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-[#0B0F17] dark:text-slate-100">
      {/* Top Bar Contract: 3 exact zones (Brand wordmark — 5 nav links — 1 primary CTA) */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/90 dark:bg-[#0B0F17]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 h-16">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            <img src="/icon.svg" alt="" className="w-6 h-6 rounded-md" />
            <span>DevDesk</span>
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            {(
              [
                ['features', 'Features'],
                ['download', 'Download'],
                ['docs', 'Docs'],
                ['changelog', 'Changelog'],
                ['support', 'Support'],
              ] as [WebsitePage, string][]
            ).map(([page, label]) => (
              <button
                key={page}
                type="button"
                onClick={() => navigate(page)}
                className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-950 dark:hover:text-white cursor-pointer ${
                  activePage === page
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : ''
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onLaunchApp}
              className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Launch Web App</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              className="md:hidden rounded-lg border border-slate-200 dark:border-slate-800 p-2 text-slate-700 dark:text-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-4 py-4 space-y-2">
            {(
              [
                ['home', 'Home'],
                ['features', 'Features'],
                ['download', 'Download'],
                ['docs', 'Documentation'],
                ['changelog', 'Changelog'],
                ['faq', 'FAQ'],
                ['support', 'Support'],
              ] as [WebsitePage, string][]
            ).map(([page, label]) => (
              <button
                key={page}
                type="button"
                onClick={() => navigate(page)}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={onLaunchApp}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white"
            >
              <span>Launch Web App</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      <main className="flex-1">
        {activePage === 'home' && (
          <>
            {/* Hero */}
            <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-14 pb-16 lg:pt-20 lg:pb-24">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-6 space-y-6">
                  <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    Web App · Installable PWA · Local-First Storage
                  </p>
                  <h1
                    className="font-display font-bold tracking-tight text-slate-950 dark:text-white leading-[1.12]"
                    style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', textWrap: 'balance' }}
                  >
                    Your entire developer workflow. One workspace.
                  </h1>
                  <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                    DevDesk brings your code snippets, Markdown technical notes, API tests, local developer utilities, command library, error logs, and project tasks into one unified, offline-capable workspace.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onLaunchApp}
                      className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Launch Web App</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <PWAInstallButton variant="secondary" fallbackLabel="Install Web App" />
                    <button
                      type="button"
                      onClick={() => navigate('download')}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Platforms & Releases</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>IndexedDB local cache</span>
                    <span aria-hidden="true">·</span>
                    <span>Optional account sync</span>
                    <span aria-hidden="true">·</span>
                    <span>Opt-in Dev AI</span>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="inline-flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {snapshot.preferences.theme === 'dark' ? (
                        <>
                          <Sun className="w-3.5 h-3.5" />
                          <span>Switch to Light</span>
                        </>
                      ) : (
                        <>
                          <Moon className="w-3.5 h-3.5" />
                          <span>Switch to Dark</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Authentic interactive UI workspace preview */}
                <div className="lg:col-span-6">
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 bg-slate-100/70 dark:bg-[#0F1523]">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                        <Code2 className="w-4 h-4 text-indigo-500" />
                        <span>DevDesk Workspace</span>
                        <span className="text-slate-400">/</span>
                        <span>Code Vault</span>
                      </div>
                      <span className="text-xs font-mono text-slate-500">Ctrl+K</span>
                    </div>
                    <div className="grid grid-cols-12 min-h-[300px]">
                      <div className="col-span-4 border-r border-slate-200 dark:border-slate-800 p-3 space-y-1.5 text-xs">
                        <div className="font-medium text-slate-900 dark:text-slate-100 px-2 py-1.5 rounded-md bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
                          Code Vault
                        </div>
                        <div className="px-2 py-1.5 text-slate-600 dark:text-slate-400">DevNotes</div>
                        <div className="px-2 py-1.5 text-slate-600 dark:text-slate-400">API Studio</div>
                        <div className="px-2 py-1.5 text-slate-600 dark:text-slate-400">Data Lab</div>
                        <div className="px-2 py-1.5 text-slate-600 dark:text-slate-400">Command Library</div>
                        <div className="px-2 py-1.5 text-slate-600 dark:text-slate-400">Error Archive</div>
                        <div className="px-2 py-1.5 text-slate-600 dark:text-slate-400">Project Hub</div>
                      </div>
                      <div className="col-span-8 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              useDebouncedValue.ts
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              TypeScript · Frontend · Autosaved
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={onLaunchApp}
                            className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-500 cursor-pointer"
                          >
                            Open Editor
                          </button>
                        </div>
                        <pre className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200 p-3 text-xs font-mono overflow-x-auto leading-relaxed">
{`export function useDebouncedValue<T>(value: T, ms = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}`}
                        </pre>
                        <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-2">
                            <div className="text-slate-500 dark:text-slate-400">Data Lab</div>
                            <div className="font-medium text-slate-900 dark:text-slate-100 mt-0.5">16 Local Tools</div>
                          </div>
                          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-2">
                            <div className="text-slate-500 dark:text-slate-400">Offline</div>
                            <div className="font-medium text-slate-900 dark:text-slate-100 mt-0.5">IndexedDB</div>
                          </div>
                          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-2">
                            <div className="text-slate-500 dark:text-slate-400">Privacy</div>
                            <div className="font-medium text-slate-900 dark:text-slate-100 mt-0.5">Local-First</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Core Capabilities */}
            <section className="border-t border-slate-200 dark:border-slate-800/80 py-16">
              <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="max-w-2xl">
                  <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
                    Built as one cohesive engineering environment
                  </h2>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">
                    Stop scattering snippets, architecture notes, curl commands, and debugging solutions across disconnected browser tabs.
                  </p>
                </div>

                <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      icon: Code2,
                      title: '01. Code Vault & DevNotes',
                      desc: 'Organize reusable snippets with syntax highlighting, complexity metadata, and sanitized Markdown notes with templates and autosave.',
                      span: 'md:col-span-2',
                    },
                    {
                      icon: Wrench,
                      title: '02. Local Data Lab',
                      desc: '16 developer utilities—JSON, Base64, SHA-256/512 hashes, UUIDs, Regex, Diff, SQL, XML, JWT decode, QR—running locally in your browser.',
                      span: '',
                    },
                    {
                      icon: Terminal,
                      title: '03. Command Library & Error Archive',
                      desc: 'Searchable CLI commands with destructive warnings plus a structured log for root causes and verified fixes.',
                      span: '',
                    },
                    {
                      icon: Globe,
                      title: '04. API Studio & Project Hub',
                      desc: 'Test HTTP endpoints with SSRF-protected proxying and track project tasks across List and Kanban boards.',
                      span: 'md:col-span-2',
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 ${item.span}`}
                      >
                        <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="mt-4 font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Platforms & Security */}
            <section className="border-t border-slate-200 dark:border-slate-800/80 py-16 bg-white/50 dark:bg-[#0E131F]">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h2 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
                    Cross-platform delivery, documented honestly
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Use DevDesk immediately in any modern browser or install it as a standalone Progressive Web App on desktop and Android. Native Windows (Tauri) and signed Android APK builds are part of the official release roadmap and will only be linked once compiled and verified.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('download')}
                    className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <span>View platform availability</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-3">
                  <div className="flex items-center gap-2.5 text-slate-900 dark:text-slate-100 font-semibold">
                    <Shield className="w-5 h-5 text-emerald-500" />
                    <span>Privacy & Security Architecture</span>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>Local-first IndexedDB storage works without requiring an account.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>Dev AI is strictly opt-in and only receives context you explicitly attach.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span>API Studio backend proxy blocks private IPs, loopback, and metadata endpoints.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </>
        )}

        {activePage === 'features' && (
          <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14 space-y-10">
            <div className="max-w-2xl">
              <h1 className="font-display text-3xl font-bold text-slate-950 dark:text-white">
                Complete Workspace Modules
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Every module shares one keyboard-first Command Palette (<span className="font-mono">Ctrl+K</span>), consistent theming, and local-first IndexedDB persistence.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Code2, title: 'Code Vault', text: 'Searchable snippet library with language filters, folders, complexity notes, input/output examples, and JSON export.' },
                { icon: FileText, title: 'DevNotes', text: 'Split-view Markdown editor with sanitized preview, reusable technical templates, checklists, and .md export.' },
                { icon: Globe, title: 'API Studio', text: 'HTTP request builder (GET/POST/PUT/PATCH/DELETE), query params, headers, saved collections, and SSRF-safe proxy.' },
                { icon: Wrench, title: 'Data Lab', text: '16 local browser utilities: JSON, Base64, URL, SHA-256/512, UUID, Regex, Timestamp, Color, Diff, SQL, XML, JWT, QR.' },
                { icon: Terminal, title: 'Command Library', text: 'Categorized Git, Docker, Shell, PowerShell, npm, Python, and SQL references with destructive warnings and custom commands.' },
                { icon: FolderKanban, title: 'Project Hub & Focus', text: 'List and Kanban task tracking linked with real Pomodoro focus sessions and activity tracking.' },
                { icon: Cpu, title: 'Dev AI (Opt-In)', text: 'Optional Gemini-powered assistant to explain code, debug errors, or draft docs using only explicitly attached context.' },
                { icon: Lock, title: 'Backup & Sync', text: 'Full JSON workspace backup/restore plus optional scrypt-authenticated account sync.' },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.title} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
                    <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="mt-3 font-semibold text-slate-900 dark:text-slate-100">{m.title}</h2>
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{m.text}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activePage === 'download' && (
          <section className="mx-auto max-w-6xl px-4 sm:px-6 py-14 space-y-10">
            <div className="max-w-2xl">
              <h1 className="font-display text-3xl font-bold text-slate-950 dark:text-white">
                Download & Platform Access
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                We only publish direct installer downloads after artifacts have been compiled, checksummed, and tested.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Web & PWA — Available Now */}
              <div className="rounded-xl border border-indigo-500/40 bg-white dark:bg-[#111827] p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <Globe className="w-6 h-6 text-indigo-500" />
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Available Now · v1.0.0
                    </span>
                  </div>
                  <h2 className="mt-4 font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Web App & Installable PWA
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Works across Windows, macOS, Linux, Android, and iOS browsers. Supports standalone installation and offline IndexedDB caching for snippets, notes, commands, and local Data Lab tools.
                  </p>
                  <ul className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <li>Chrome, Edge, Firefox, Safari</li>
                    <li>Offline-ready via Workbox service worker</li>
                    <li>No installation permissions required</li>
                  </ul>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onLaunchApp}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors cursor-pointer"
                  >
                    <span>Launch Web App</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <PWAInstallButton variant="secondary" fallbackLabel="Install PWA" />
                </div>
              </div>

              {/* Windows Tauri Desktop */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <Laptop className="w-6 h-6 text-slate-500" />
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      Planned / Build via Tauri
                    </span>
                  </div>
                  <h2 className="mt-4 font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Windows Desktop (Tauri)
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    No pre-built Windows <span className="font-mono">.msi</span> or <span className="font-mono">.exe</span> installer binary is published in this web preview environment yet.
                  </p>
                  <ul className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <li>Target OS: Windows 10 / 11 (x64)</li>
                    <li>Planned shell: Tauri v2 wrapping the shared React app</li>
                    <li>Recommended today: Install as Desktop PWA via Edge or Chrome</li>
                  </ul>
                </div>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => navigate('docs')}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <span>Read Tauri Build Guide</span>
                  </button>
                </div>
              </div>

              {/* Android */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <Smartphone className="w-6 h-6 text-slate-500" />
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      PWA Ready · APK Planned
                    </span>
                  </div>
                  <h2 className="mt-4 font-display text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Android App
                  </h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Use the installable Android PWA in Chrome today. A signed Capacitor Android APK will be published with SHA-256 verification once native Android testing is complete.
                  </p>
                  <ul className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <li>Android 10+ via Chrome “Add to Home screen / Install app”</li>
                    <li>Never install unofficial third-party APKs</li>
                    <li>iOS uses responsive Safari PWA (Add to Home Screen)</li>
                  </ul>
                </div>
                <div className="mt-6">
                  <PWAInstallButton variant="secondary" fallbackLabel="Mobile Install Guide" />
                </div>
              </div>
            </div>

            {/* 1-Click Full Source Zip Archive */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Full Project Source Code (.zip)
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Organized <span className="font-mono">DevDesk/</span> source archive including frontend, Express backend, PWA assets, and unit tests (excludes <span className="font-mono">node_modules</span> and build output).
                </p>
              </div>
              <a
                href="/DevDesk-Full-Project.zip"
                download="DevDesk-Full-Project.zip"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download Project (.zip)</span>
              </a>
            </div>
          </section>
        )}

        {activePage === 'docs' && (
          <section className="mx-auto max-w-4xl px-4 sm:px-6 py-14 space-y-8">
            <h1 className="font-display text-3xl font-bold text-slate-950 dark:text-white">
              Documentation
            </h1>
            <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  1. Local-First Storage & Offline Behavior
                </h2>
                <p>
                  DevDesk persists snippets, Markdown notes, API request collections, error logs, projects, tasks, bookmarks, and preferences in browser IndexedDB (<span className="font-mono">devdesk_workspace_db</span>). All Data Lab utilities run locally in the browser without uploading input.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  2. Keyboard Shortcuts
                </h2>
                <p>
                  Press <span className="font-mono">Ctrl+K</span> (or <span className="font-mono">Cmd+K</span> on macOS) anywhere inside the Workspace to open Universal Search & the Command Palette.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  3. API Studio CORS & Proxy Security
                </h2>
                <p>
                  Client-side browser requests are used by default. When target APIs do not send CORS headers, you can toggle the built-in DevDesk server proxy (<span className="font-mono">/api/proxy</span>), which restricts schemes to HTTP/HTTPS, resolves DNS, blocks loopback/private/link-local metadata IPs, disables automatic redirects, and enforces a 10-second timeout and 2MB cap.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  4. Windows (Tauri) & Android (Capacitor) Packaging
                </h2>
                <p>
                  Because DevDesk is built as a modular Vite + React + TypeScript SPA with isolated storage adapters, wrapping the production <span className="font-mono">dist/</span> bundle in Tauri (<span className="font-mono">npm run build</span> followed by <span className="font-mono">tauri build</span>) or Capacitor (<span className="font-mono">npx cap sync android</span>) requires zero UI rewrite.
                </p>
              </div>
            </div>
          </section>
        )}

        {activePage === 'changelog' && (
          <section className="mx-auto max-w-4xl px-4 sm:px-6 py-14 space-y-8">
            <h1 className="font-display text-3xl font-bold text-slate-950 dark:text-white">
              Changelog & Releases
            </h1>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  v1.0.0 — Web Workspace & PWA Release
                </h2>
                <span className="text-xs font-mono text-slate-500">Web / PWA</span>
              </div>
              <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300 list-disc pl-5">
                <li>Launched official DevDesk marketing site, download center, and unified Workspace shell.</li>
                <li>Implemented Code Vault, DevNotes (sanitized Markdown), Command Library, and 16 local Data Lab utilities.</li>
                <li>Added API Studio with SSRF-hardened backend proxy, Error Archive, Project Hub (List + Kanban), Focus Timer, and Bookmarks.</li>
                <li>Added scrypt-hashed account authentication, Bearer session revocation, and workspace sync endpoints.</li>
                <li>Configured Workbox PWA service worker, web manifest, and in-app install flow.</li>
              </ul>
            </div>
          </section>
        )}

        {activePage === 'faq' && (
          <section className="mx-auto max-w-4xl px-4 sm:px-6 py-14 space-y-6">
            <h1 className="font-display text-3xl font-bold text-slate-950 dark:text-white">
              Frequently Asked Questions
            </h1>
            {[
              {
                q: 'Can I use DevDesk without creating an account?',
                a: 'Yes. DevDesk runs local-first using IndexedDB in your browser. You can export and import full JSON backups anytime without signing in.',
              },
              {
                q: 'Does Dev AI automatically read my snippets and notes?',
                a: 'No. Dev AI never reads or transmits your workspace unless you explicitly attach specific items in the Dev AI context picker.',
              },
              {
                q: 'Are the Windows .exe or Android .apk files available right now?',
                a: 'Not yet in this web release. You can install DevDesk immediately as a standalone PWA on Windows, macOS, Linux, Android, and iOS.',
              },
              {
                q: 'Does the JWT Decoder verify signatures?',
                a: 'No. It decodes header and payload JSON locally for inspection and explicitly warns that signature validity is not verified.',
              },
            ].map((item) => (
              <div key={item.q} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">{item.q}</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </section>
        )}

        {activePage === 'privacy' && (
          <section className="mx-auto max-w-4xl px-4 sm:px-6 py-14 space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h1 className="font-display text-3xl font-bold text-slate-950 dark:text-white">
              Privacy Policy
            </h1>
            <p>
              DevDesk is designed around local-first ownership. Workspace items created while signed out stay inside your device browser storage (IndexedDB).
            </p>
            <p>
              If you choose to create an account and enable sync, your workspace snapshot is transmitted over HTTPS to your account store and can be exported or permanently deleted at any time from Settings.
            </p>
            <p>
              When using Dev AI, only the prompt and items you explicitly attach are sent to the server-side AI endpoint. Do not submit passwords, private keys, or customer secrets to AI prompts.
            </p>
          </section>
        )}

        {activePage === 'terms' && (
          <section className="mx-auto max-w-4xl px-4 sm:px-6 py-14 space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <h1 className="font-display text-3xl font-bold text-slate-950 dark:text-white">
              Terms of Use
            </h1>
            <p>
              DevDesk is provided as a developer productivity workspace. You retain ownership of all code snippets, notes, and project records you store inside the application.
            </p>
            <p>
              Do not use the API Studio proxy to probe internal networks, restricted infrastructure, or unauthorized third-party services. AI-generated outputs are suggestions and must be reviewed before production deployment.
            </p>
          </section>
        )}

        {activePage === 'support' && (
          <section className="mx-auto max-w-2xl px-4 sm:px-6 py-14 space-y-6">
            <div>
              <h1 className="font-display text-3xl font-bold text-slate-950 dark:text-white">
                Contact & Support
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Report a bug, request a feature, or ask a question about DevDesk.
              </p>
            </div>

            {supportTicketId && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                Thank you. Your support ticket has been recorded (ID: <span className="font-mono">{supportTicketId}</span>).
              </div>
            )}

            {supportError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
                {supportError}
              </div>
            )}

            <form
              onSubmit={handleSupportSubmit}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-4"
            >
              <div>
                <label htmlFor="support-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email address
                </label>
                <input
                  id="support-email"
                  type="email"
                  required
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="developer@example.com"
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="support-cat" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Category
                </label>
                <select
                  id="support-cat"
                  value={supportCategory}
                  onChange={(e) => setSupportCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="bug">Report a Bug</option>
                  <option value="feature">Suggest a Feature</option>
                  <option value="sync">Account / Sync Help</option>
                  <option value="general">General Question</option>
                </select>
              </div>
              <div>
                <label htmlFor="support-subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Subject
                </label>
                <input
                  id="support-subject"
                  type="text"
                  required
                  minLength={3}
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  placeholder="Brief summary of the issue or request"
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="support-msg" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Details
                </label>
                <textarea
                  id="support-msg"
                  rows={5}
                  required
                  minLength={10}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Steps to reproduce, expected behavior, or feature details…"
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={supportSubmitting}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {supportSubmitting ? 'Submitting…' : 'Submit Support Request'}
              </button>
            </form>
          </section>
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-800 dark:text-slate-200">DevDesk</span>
            <span aria-hidden="true">·</span>
            <span>Web Workspace v1.0.0</span>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <button type="button" onClick={() => navigate('features')} className="hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">
              Features
            </button>
            <button type="button" onClick={() => navigate('download')} className="hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">
              Download
            </button>
            <button type="button" onClick={() => navigate('docs')} className="hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">
              Docs
            </button>
            <button type="button" onClick={() => navigate('faq')} className="hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">
              FAQ
            </button>
            <button type="button" onClick={() => navigate('privacy')} className="hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">
              Privacy
            </button>
            <button type="button" onClick={() => navigate('terms')} className="hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">
              Terms
            </button>
            <button type="button" onClick={() => navigate('support')} className="hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">
              Support
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
