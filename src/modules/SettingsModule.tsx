import React, { useEffect, useRef, useState } from 'react';
import { Download, LogOut, RefreshCw, Shield, Trash2, Upload, User } from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { useWorkspace } from '../context/WorkspaceContext';
import type { ThemeMode } from '../types/devdesk';
import { getAiProviderKey, saveAiProviderKey } from '../lib/aiProviderSettings';

type AiProvider = 'gemini' | 'openrouter';

export const SettingsModule: React.FC = () => {
  const {
    snapshot,
    user,
    syncStatus,
    updatePreferences,
    registerAccount,
    loginAccount,
    logoutAccount,
    logoutAllSessions,
    deleteAccount,
    syncNow,
    loadDemoWorkspace,
    clearWorkspace,
    importWorkspaceJson,
    pushToast,
  } = useWorkspace();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [confirmDeleteAcctOpen, setConfirmDeleteAcctOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [aiKeyDrafts, setAiKeyDrafts] = useState<Record<AiProvider, string>>({ gemini: '', openrouter: '' });
  const [aiKeySaved, setAiKeySaved] = useState<Record<AiProvider, boolean>>({
    gemini: Boolean(getAiProviderKey('gemini')),
    openrouter: Boolean(getAiProviderKey('openrouter')),
  });
  const [aiServerKeySaved, setAiServerKeySaved] = useState<Record<AiProvider, boolean>>({
    gemini: false,
    openrouter: false,
  });
  const [openRouterModelCount, setOpenRouterModelCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/ai/models')
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        setOpenRouterModelCount(typeof data?.providers?.openrouter?.freeModelCount === 'number'
          ? data.providers.openrouter.freeModelCount
          : 0);
        setAiServerKeySaved({
          gemini: data?.providers?.gemini?.serverKeyConfigured === true,
          openrouter: data?.providers?.openrouter?.serverKeyConfigured === true,
        });
      })
      .catch(() => setOpenRouterModelCount(0));
  }, []);

  const storeAiKey = (provider: AiProvider, key: string) => {
    if (!saveAiProviderKey(provider, key.trim())) {
      pushToast('Could not save this key in this browser tab. Check your browser storage settings.', 'error');
      return;
    }
    setAiKeySaved((current) => ({ ...current, [provider]: Boolean(key.trim()) }));
    setAiKeyDrafts((current) => ({ ...current, [provider]: '' }));
    pushToast(key.trim() ? 'AI provider key saved for this browser tab.' : 'AI provider key removed.', 'success');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthBusy(true);
    const res =
      authMode === 'login'
        ? await loginAccount(email, password)
        : await registerAccount(email, password, displayName);
    setAuthBusy(false);
    if (!res.ok) {
      setAuthError(res.error || 'Authentication failed.');
    } else {
      setPassword('');
    }
  };

  const handleFullExport = () => {
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devdesk-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast('Full workspace backup downloaded.', 'success');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      importWorkspaceJson(String(reader.result));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          Settings & Account
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage appearance, editor defaults, optional cloud sync, privacy controls, and full JSON backups.
        </p>
      </div>

      {/* Account & Sync */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-display text-base font-semibold">
            <User className="w-4 h-4 text-indigo-500" />
            <span>Account & Sync</span>
          </div>
          <span className="text-xs font-mono text-slate-500">Status: {syncStatus}</span>
        </div>

        {user ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {user.displayName}
                </div>
                <div className="text-xs text-slate-500">{user.email}</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={syncNow}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Now</span>
                </button>
                <button
                  type="button"
                  onClick={logoutAccount}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={snapshot.preferences.syncPaused}
                  onChange={(e) => updatePreferences({ syncPaused: e.target.checked })}
                />
                <span>Pause cloud sync (keep edits local)</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={logoutAllSessions}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs cursor-pointer"
                >
                  Sign Out All Sessions
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteAcctOpen(true)}
                  className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 cursor-pointer"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAuthSubmit} className="space-y-3">
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`rounded-lg px-3 py-1.5 font-medium cursor-pointer ${
                  authMode === 'login' ? 'bg-indigo-600 text-white' : 'border border-slate-300 dark:border-slate-700'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`rounded-lg px-3 py-1.5 font-medium cursor-pointer ${
                  authMode === 'register' ? 'bg-indigo-600 text-white' : 'border border-slate-300 dark:border-slate-700'
                }`}
              >
                Create Account
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {authMode === 'register' && (
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display Name"
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-xs"
                />
              )}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-xs"
              />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 8 chars)"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-xs"
              />
            </div>
            {authError && <div className="text-xs text-red-500">{authError}</div>}
            <button
              type="submit"
              disabled={authBusy}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-60 cursor-pointer"
            >
              {authBusy ? 'Please wait…' : authMode === 'login' ? 'Sign In & Sync' : 'Create Account'}
            </button>
          </form>
        )}
      </div>

      {/* AI Providers */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
        <div>
          <h2 className="font-display text-base font-semibold">AI Providers</h2>
          <p className="mt-1 text-xs text-slate-500">
            Dev AI uses online providers and needs an internet connection. A provider account and API key may be required to use a model.
            Keys entered here stay in this browser tab's session storage and are sent only to DevDesk when you submit a prompt. They are not included in workspace backups or cloud sync.
          </p>
        </div>
        {([
          { id: 'gemini', title: 'Google Gemini', link: 'https://aistudio.google.com/app/apikey', hint: 'Get a Gemini API key' },
          { id: 'openrouter', title: 'OpenRouter free models', link: 'https://openrouter.ai/keys', hint: 'Create an OpenRouter key' },
        ] as const).map((provider) => (
          <div key={provider.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium">{provider.title}</span>
              <span className={`text-xs ${aiKeySaved[provider.id] || aiServerKeySaved[provider.id] ? 'text-emerald-600' : 'text-slate-500'}`}>
                {aiKeySaved[provider.id]
                  ? 'Key saved in this tab'
                  : aiServerKeySaved[provider.id]
                    ? 'Server key configured'
                    : 'No key configured'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                autoComplete="new-password"
                value={aiKeyDrafts[provider.id]}
                onChange={(event) => setAiKeyDrafts((current) => ({ ...current, [provider.id]: event.target.value }))}
                placeholder={aiKeySaved[provider.id] ? 'Saved (enter a new key to replace)' : 'Paste provider API key'}
                aria-label={`${provider.title} API key`}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={() => storeAiKey(provider.id, aiKeyDrafts[provider.id])}
                disabled={!aiKeyDrafts[provider.id].trim()}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-50 cursor-pointer"
              >
                Save key
              </button>
              <button
                type="button"
                onClick={() => storeAiKey(provider.id, '')}
                disabled={!aiKeySaved[provider.id]}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs disabled:opacity-50 cursor-pointer"
              >
                Remove
              </button>
            </div>
            <a href={provider.link} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 underline">
              {provider.hint}
            </a>
          </div>
        ))}
        <p className="text-xs text-slate-500">
          You can also configure GEMINI_API_KEY or OPENROUTER_API_KEY on your own server. OpenRouter currently reports {openRouterModelCount === null ? '…' : openRouterModelCount} models with zero prompt and completion prices (up to 25 are listed). This price listing does not guarantee a provider account can use them, that they will be available, or that free terms will continue. Gemini access and free quotas depend on Google's current terms.
        </p>
      </section>

      {/* Appearance & Editor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
          <h2 className="font-display text-base font-semibold">Appearance & PWA</h2>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">Theme</label>
            <div className="flex gap-2">
              {(['dark', 'light', 'system'] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updatePreferences({ theme: mode })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize cursor-pointer ${
                    snapshot.preferences.theme === mode
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-2">
            <PWAInstallButton variant="secondary" fallbackLabel="Install DevDesk PWA" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3 text-xs">
          <h2 className="font-display text-base font-semibold">Editor & AI Privacy</h2>
          <label className="flex items-center justify-between cursor-pointer">
            <span>Show line numbers in Code Vault</span>
            <input
              type="checkbox"
              checked={snapshot.preferences.editorLineNumbers}
              onChange={(e) => updatePreferences({ editorLineNumbers: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span>Word wrap in code editor</span>
            <input
              type="checkbox"
              checked={snapshot.preferences.editorWordWrap}
              onChange={(e) => updatePreferences({ editorWordWrap: e.target.checked })}
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span>Enable optional Dev AI module</span>
            <input
              type="checkbox"
              checked={snapshot.preferences.aiEnabled}
              onChange={(e) => updatePreferences({ aiEnabled: e.target.checked })}
            />
          </label>
        </div>
      </div>

      {/* Backup & Data Controls */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
        <div className="flex items-center gap-2 font-display text-base font-semibold">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>Data Backup & Workspace Management</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleFullExport}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Full Backup (JSON)</span>
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-medium cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restore from JSON</span>
          </button>
          <button
            type="button"
            onClick={loadDemoWorkspace}
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-medium cursor-pointer"
          >
            Load Demo Workspace
          </button>
          <a
            href="/DevDesk-Full-Project.zip"
            download="DevDesk-Full-Project.zip"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Project (.zip)</span>
          </a>
          <button
            type="button"
            onClick={() => setConfirmClearOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3.5 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Local Data</span>
          </button>
        </div>
        <div className="text-xs text-slate-500">
          DevDesk Web Workspace · Version 1.0.0-web
        </div>
      </div>

      <ConfirmDialog
        open={confirmClearOpen}
        title="Clear All Local Workspace Data?"
        description="This removes all snippets, notes, projects, errors, bookmarks, and focus history stored in your browser IndexedDB."
        confirmLabel="Clear Everything"
        onConfirm={() => {
          void clearWorkspace();
          setConfirmClearOpen(false);
        }}
        onCancel={() => setConfirmClearOpen(false)}
      />

      <ConfirmDialog
        open={confirmDeleteAcctOpen}
        title="Delete Cloud Account?"
        description="This permanently deletes your cloud account and synced server backup. Your local browser copy will remain until cleared."
        confirmLabel="Delete Account"
        onConfirm={async () => {
          await deleteAccount();
          setConfirmDeleteAcctOpen(false);
        }}
        onCancel={() => setConfirmDeleteAcctOpen(false)}
      />
    </div>
  );
};
