import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createDemoWorkspaceSnapshot,
  createEmptyWorkspaceSnapshot,
  loadWorkspaceSnapshot,
  normalizeSnapshot,
  saveWorkspaceSnapshot,
} from '../lib/db';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import type {
  ActivityEvent,
  AuthUser,
  SyncStatus,
  UserPreferences,
  WorkspaceSnapshot,
} from '../types/devdesk';

export interface ToastItem {
  id: string;
  message: string;
  tone: 'info' | 'success' | 'warning' | 'error';
}

interface WorkspaceContextValue {
  snapshot: WorkspaceSnapshot;
  loading: boolean;
  syncStatus: SyncStatus;
  saveState: 'saved' | 'saving' | 'unsaved';
  user: AuthUser | null;
  authToken: string | null;
  isOnline: boolean;
  toasts: ToastItem[];
  pushToast: (message: string, tone?: ToastItem['tone']) => void;
  dismissToast: (id: string) => void;
  updateSnapshot: (
    updater: (prev: WorkspaceSnapshot) => WorkspaceSnapshot,
    activity?: Omit<ActivityEvent, 'id' | 'timestamp'>,
  ) => void;
  updatePreferences: (patch: Partial<UserPreferences>) => void;
  loadDemoWorkspace: () => void;
  clearWorkspace: () => Promise<void>;
  importWorkspaceJson: (rawJson: string) => boolean;
  registerAccount: (email: string, password: string, displayName: string) => Promise<{ ok: boolean; error?: string }>;
  loginAccount: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logoutAccount: () => Promise<void>;
  logoutAllSessions: () => Promise<void>;
  deleteAccount: () => Promise<{ ok: boolean; error?: string }>;
  syncNow: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>(() => createEmptyWorkspaceSnapshot());
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [user, setUser] = useState<AuthUser | null>(null);
  // Bearer token held strictly in React state memory (never localStorage/sessionStorage)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [pendingSync, setPendingSync] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const isOnline = useOnlineStatus();
  const persistTimer = useRef<number | null>(null);

  const pushToast = useCallback((message: string, tone: ToastItem['tone'] = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-3), { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load local IndexedDB snapshot on startup
  useEffect(() => {
    let active = true;
    loadWorkspaceSnapshot()
      .then((loaded) => {
        if (active) {
          setSnapshot(loaded);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Apply Dark / Light / System theme and font size classes to <html>
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      const pref = snapshot.preferences.theme;
      const isDark =
        pref === 'dark' ||
        (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.classList.toggle('dark', isDark);
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', isDark ? '#0B0F17' : '#F8FAFC');
      }
    };
    applyTheme();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', applyTheme);
    return () => mq.removeEventListener('change', applyTheme);
  }, [snapshot.preferences.theme]);

  const syncWithServer = useCallback(
    async (currentSnap: WorkspaceSnapshot, token: string) => {
      if (!isOnline || currentSnap.preferences.syncPaused) {
        setPendingSync(true);
        return;
      }
      setSyncing(true);
      setSyncError(false);
      try {
        const res = await fetch('/api/sync/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ snapshot: currentSnap }),
        });
        if (!res.ok) {
          throw new Error('Sync push failed');
        }
        setPendingSync(false);
      } catch {
        setSyncError(true);
        setPendingSync(true);
      } finally {
        setSyncing(false);
      }
    },
    [isOnline],
  );

  // Flush queued sync when coming back online
  useEffect(() => {
    if (isOnline && pendingSync && authToken && !snapshot.preferences.syncPaused) {
      void syncWithServer(snapshot, authToken);
    }
  }, [isOnline, pendingSync, authToken, snapshot, syncWithServer]);

  const schedulePersist = useCallback(
    (next: WorkspaceSnapshot) => {
      setSaveState('saving');
      if (persistTimer.current) {
        window.clearTimeout(persistTimer.current);
      }
      persistTimer.current = window.setTimeout(async () => {
        await saveWorkspaceSnapshot(next);
        setSaveState('saved');
        if (authToken && !next.preferences.syncPaused) {
          await syncWithServer(next, authToken);
        }
      }, 280);
    },
    [authToken, syncWithServer],
  );

  const updateSnapshot = useCallback(
    (
      updater: (prev: WorkspaceSnapshot) => WorkspaceSnapshot,
      activity?: Omit<ActivityEvent, 'id' | 'timestamp'>,
    ) => {
      setSnapshot((prev) => {
        const updated = updater(prev);
        const nextActivities = activity
          ? [
              {
                id: crypto.randomUUID(),
                ...activity,
                timestamp: new Date().toISOString(),
              },
              ...updated.activities,
            ].slice(0, 40)
          : updated.activities;
        const next: WorkspaceSnapshot = {
          ...updated,
          activities: nextActivities,
          lastModifiedAt: new Date().toISOString(),
        };
        schedulePersist(next);
        return next;
      });
    },
    [schedulePersist],
  );

  const updatePreferences = useCallback(
    (patch: Partial<UserPreferences>) => {
      updateSnapshot((prev) => ({
        ...prev,
        preferences: { ...prev.preferences, ...patch },
      }));
    },
    [updateSnapshot],
  );

  const loadDemoWorkspace = useCallback(() => {
    const demo = createDemoWorkspaceSnapshot(snapshot.preferences);
    setSnapshot(demo);
    void saveWorkspaceSnapshot(demo);
    pushToast('Demo workspace loaded. Explore any module freely.', 'success');
  }, [snapshot.preferences, pushToast]);

  const clearWorkspace = useCallback(async () => {
    const empty = createEmptyWorkspaceSnapshot();
    empty.preferences = { ...snapshot.preferences };
    setSnapshot(empty);
    await saveWorkspaceSnapshot(empty);
    pushToast('Local workspace cleared.', 'info');
  }, [snapshot.preferences, pushToast]);

  const importWorkspaceJson = useCallback(
    (rawJson: string) => {
      try {
        const parsed = JSON.parse(rawJson) as Partial<WorkspaceSnapshot>;
        if (!parsed || typeof parsed !== 'object') return false;
        const normalized = normalizeSnapshot(parsed);
        setSnapshot(normalized);
        void saveWorkspaceSnapshot(normalized);
        pushToast('Workspace backup imported successfully.', 'success');
        return true;
      } catch {
        pushToast('Invalid workspace JSON file.', 'error');
        return false;
      }
    },
    [pushToast],
  );

  const registerAccount = useCallback(
    async (email: string, password: string, displayName: string) => {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, displayName }),
        });
        const data = await res.json();
        if (!res.ok) return { ok: false, error: data.error || 'Registration failed.' };
        setUser(data.user);
        setAuthToken(data.token);
        await syncWithServer(snapshot, data.token);
        pushToast(`Signed in as ${data.user.displayName}`, 'success');
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error during registration.' };
      }
    },
    [snapshot, syncWithServer, pushToast],
  );

  const loginAccount = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) return { ok: false, error: data.error || 'Sign in failed.' };
        setUser(data.user);
        setAuthToken(data.token);

        // Pull cloud snapshot if newer than local empty or merge safely
        const pullRes = await fetch('/api/sync/pull', {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        if (pullRes.ok) {
          const pullData = await pullRes.json();
          if (pullData.snapshot) {
            const remote = normalizeSnapshot(pullData.snapshot);
            const hasLocalData =
              snapshot.snippets.length > 0 ||
              snapshot.notes.length > 0 ||
              snapshot.projects.length > 0;
            if (!hasLocalData || remote.lastModifiedAt > snapshot.lastModifiedAt) {
              setSnapshot(remote);
              await saveWorkspaceSnapshot(remote);
            } else {
              await syncWithServer(snapshot, data.token);
            }
          } else {
            await syncWithServer(snapshot, data.token);
          }
        }
        pushToast(`Signed in as ${data.user.displayName}`, 'success');
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error during sign in.' };
      }
    },
    [snapshot, syncWithServer, pushToast],
  );

  const logoutAccount = useCallback(async () => {
    if (authToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch {
        // Ignore network errors on sign out
      }
    }
    setUser(null);
    setAuthToken(null);
    setPendingSync(false);
    pushToast('Signed out. Local workspace remains cached.', 'info');
  }, [authToken, pushToast]);

  const logoutAllSessions = useCallback(async () => {
    if (!authToken) return;
    try {
      await fetch('/api/auth/logout-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
    } catch {
      // Ignore
    }
    setUser(null);
    setAuthToken(null);
    pushToast('All active sessions invalidated.', 'info');
  }, [authToken, pushToast]);

  const deleteAccount = useCallback(async () => {
    if (!authToken) return { ok: false, error: 'Not signed in.' };
    try {
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        const d = await res.json();
        return { ok: false, error: d.error || 'Failed to delete account.' };
      }
      setUser(null);
      setAuthToken(null);
      pushToast('Cloud account and synced data deleted.', 'info');
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error deleting account.' };
    }
  }, [authToken, pushToast]);

  const syncNow = useCallback(async () => {
    if (!authToken) {
      pushToast('Sign in from Settings to sync across devices.', 'info');
      return;
    }
    await syncWithServer(snapshot, authToken);
    pushToast('Workspace synced.', 'success');
  }, [authToken, snapshot, syncWithServer, pushToast]);

  const syncStatus: SyncStatus = useMemo(() => {
    if (!isOnline) return 'offline';
    if (!user || !authToken || snapshot.preferences.syncPaused) return 'local-only';
    if (syncing) return 'syncing';
    if (syncError || pendingSync) return 'needs-attention';
    return 'synced';
  }, [isOnline, user, authToken, snapshot.preferences.syncPaused, syncing, syncError, pendingSync]);

  const value: WorkspaceContextValue = {
    snapshot,
    loading,
    syncStatus,
    saveState,
    user,
    authToken,
    isOnline,
    toasts,
    pushToast,
    dismissToast,
    updateSnapshot,
    updatePreferences,
    loadDemoWorkspace,
    clearWorkspace,
    importWorkspaceJson,
    registerAccount,
    loginAccount,
    logoutAccount,
    logoutAllSessions,
    deleteAccount,
    syncNow,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider');
  return ctx;
}
