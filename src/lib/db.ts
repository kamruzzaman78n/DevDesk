import type { UserPreferences, WorkspaceSnapshot } from '../types/devdesk';

const DB_NAME = 'devdesk_workspace_db';
const DB_VERSION = 1;
const STORE_NAME = 'snapshots';
const SNAPSHOT_KEY = 'primary_workspace';
const FALLBACK_LS_KEY = 'devdesk_snapshot_fallback_v1';

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  accent: 'indigo',
  density: 'comfortable',
  fontSize: 'md',
  editorTabSize: 2,
  editorLineNumbers: true,
  editorWordWrap: true,
  autosaveEnabled: true,
  defaultLanguage: 'typescript',
  sidebarCollapsed: false,
  focusSoundEnabled: true,
  focusNotificationsEnabled: false,
  aiEnabled: true,
  syncPaused: false,
  onboardingCompleted: false,
  onboardingDismissed: false,
  preferredLanguages: ['TypeScript', 'Python', 'SQL'],
  favoriteTools: ['json', 'uuid', 'hash', 'diff'],
  recentTools: ['json'],
};

export function createEmptyWorkspaceSnapshot(): WorkspaceSnapshot {
  return {
    version: 1,
    snippets: [],
    notes: [],
    apiRequests: [],
    apiHistory: [],
    errors: [],
    projects: [],
    tasks: [],
    customCommands: [],
    favoriteCommandIds: [],
    bookmarks: [],
    focusSessions: [],
    activities: [],
    preferences: { ...DEFAULT_PREFERENCES },
    lastModifiedAt: new Date().toISOString(),
  };
}

export function createDemoWorkspaceSnapshot(existingPrefs?: UserPreferences): WorkspaceSnapshot {
  const now = new Date();
  const iso = (minsAgo: number) => new Date(now.getTime() - minsAgo * 60_000).toISOString();
  const projectId = 'demo-proj-1';

  return {
    version: 1,
    snippets: [
      {
        id: 'demo-snip-1',
        title: 'Debounced Async Search Hook',
        language: 'typescript',
        code: `import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}`,
        description: 'Prevents unnecessary search queries or API requests on every keystroke.',
        tags: ['react', 'hooks', 'performance'],
        folder: 'Frontend',
        pinned: true,
        favorite: true,
        timeComplexity: 'O(1)',
        spaceComplexity: 'O(1)',
        usageCount: 4,
        createdAt: iso(360),
        updatedAt: iso(90),
      },
      {
        id: 'demo-snip-2',
        title: 'PostgreSQL Upsert with Conflict Return',
        language: 'sql',
        code: `INSERT INTO user_preferences (user_id, theme, updated_at)
VALUES ($1, $2, NOW())
ON CONFLICT (user_id)
DO UPDATE SET
  theme = EXCLUDED.theme,
  updated_at = NOW()
RETURNING *;`,
        description: 'Idempotent single-query insert or update pattern for PostgreSQL.',
        tags: ['postgres', 'upsert'],
        folder: 'Database',
        pinned: false,
        favorite: true,
        usageCount: 2,
        createdAt: iso(720),
        updatedAt: iso(240),
      },
    ],
    notes: [
      {
        id: 'demo-note-1',
        title: 'Local-First Sync Architecture Notes',
        folder: 'Architecture',
        tags: ['indexeddb', 'offline', 'sync'],
        pinned: true,
        favorite: true,
        templateType: 'concept',
        content: `# Local-First Sync Architecture

DevDesk stores your workspace locally in **IndexedDB** so edits remain fast and available offline.

## Key Principles
- [x] Instant local writes with visible save status
- [x] Explicit sync queue and conflict visibility
- [ ] Optional cloud backup when signed in

> Always keep credentials and API tokens out of shared note exports.`,
        createdAt: iso(600),
        updatedAt: iso(120),
      },
    ],
    apiRequests: [
      {
        id: 'demo-api-1',
        name: 'GitHub Zen Quote (Public Test)',
        collection: 'Public Endpoints',
        method: 'GET',
        url: 'https://api.github.com/zen',
        params: [],
        headers: [{ id: 'h1', key: 'Accept', value: 'text/plain', enabled: true }],
        body: '',
        authType: 'none',
        createdAt: iso(400),
        updatedAt: iso(400),
      },
    ],
    apiHistory: [],
    errors: [
      {
        id: 'demo-err-1',
        title: 'Vite Tailwind v4 Dark Class Ignored',
        language: 'css',
        errorMessage: 'dark:bg-slate-900 stays light even when <html class="dark"> is toggled',
        context: 'Switching app theme manually with Tailwind CSS v4 @import "tailwindcss";',
        rootCause: 'Tailwind v4 defaults dark: utilities to prefers-color-scheme media query unless @custom-variant dark is declared.',
        fixSteps: '1. Open src/index.css\n2. Add @custom-variant dark (&:where(.dark, .dark *)); right below @import "tailwindcss";',
        originalCode: '@import "tailwindcss";',
        correctedCode: '@import "tailwindcss";\n@custom-variant dark (&:where(.dark, .dark *));',
        tags: ['tailwind', 'css', 'dark-mode'],
        relatedProjectId: projectId,
        createdAt: iso(500),
        updatedAt: iso(500),
      },
    ],
    projects: [
      {
        id: projectId,
        name: 'DevDesk v1.0 Workspace Launch',
        description: 'Sample demo project showing task completion progress and Kanban tracking.',
        status: 'active',
        priority: 'high',
        techStack: ['React', 'TypeScript', 'Tailwind', 'Express'],
        startDate: now.toISOString().slice(0, 10),
        dueDate: new Date(now.getTime() + 7 * 86400_000).toISOString().slice(0, 10),
        notes: 'Demo workspace item — safe to edit or clear in Settings.',
        createdAt: iso(800),
        updatedAt: iso(60),
      },
    ],
    tasks: [
      {
        id: 'demo-task-1',
        projectId,
        title: 'Configure PWA manifest & offline cache',
        description: 'Ensure standalone display and 192/512 PNG icons are served.',
        status: 'done',
        priority: 'high',
        labels: ['pwa'],
        createdAt: iso(700),
        updatedAt: iso(300),
      },
      {
        id: 'demo-task-2',
        projectId,
        title: 'Verify SSRF protections on API Studio proxy',
        description: 'Block loopback, private IP ranges, and unsafe redirects.',
        status: 'in-progress',
        priority: 'high',
        labels: ['security'],
        createdAt: iso(650),
        updatedAt: iso(150),
      },
      {
        id: 'demo-task-3',
        projectId,
        title: 'Add custom snippets to Code Vault',
        description: 'Save reusable utilities for daily development.',
        status: 'todo',
        priority: 'medium',
        labels: ['workflow'],
        createdAt: iso(500),
        updatedAt: iso(500),
      },
    ],
    customCommands: [],
    favoriteCommandIds: ['cmd-git-status', 'cmd-git-switch-create'],
    bookmarks: [
      {
        id: 'demo-bm-1',
        title: 'MDN Web Docs — Web Crypto API',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API',
        category: 'documentation',
        tags: ['crypto', 'security', 'browser'],
        note: 'Reference for SHA-256 and randomUUID browser APIs.',
        favorite: true,
        createdAt: iso(450),
        updatedAt: iso(450),
      },
    ],
    focusSessions: [
      {
        id: 'demo-focus-1',
        presetName: 'Pomodoro 25/5',
        plannedMinutes: 25,
        completedMinutes: 25,
        completed: true,
        startedAt: iso(180),
        endedAt: iso(155),
      },
    ],
    activities: [
      {
        id: 'demo-act-1',
        type: 'project',
        action: 'Loaded demo workspace',
        title: 'DevDesk v1.0 Workspace Launch',
        timestamp: iso(1),
      },
    ],
    preferences: {
      ...(existingPrefs || DEFAULT_PREFERENCES),
      onboardingCompleted: true,
    },
    lastModifiedAt: now.toISOString(),
  };
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
  });
}

export async function loadWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  try {
    const db = await openDb();
    const result = await new Promise<WorkspaceSnapshot | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(SNAPSHOT_KEY);
      req.onsuccess = () => resolve(req.result as WorkspaceSnapshot | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (result && typeof result === 'object') {
      return normalizeSnapshot(result);
    }
  } catch {
    try {
      const raw = localStorage.getItem(FALLBACK_LS_KEY);
      if (raw) {
        return normalizeSnapshot(JSON.parse(raw) as WorkspaceSnapshot);
      }
    } catch {
      // Ignore storage errors
    }
  }
  return createEmptyWorkspaceSnapshot();
}

export async function saveWorkspaceSnapshot(snapshot: WorkspaceSnapshot): Promise<void> {
  const normalized = normalizeSnapshot({
    ...snapshot,
    lastModifiedAt: new Date().toISOString(),
  });
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(normalized, SNAPSHOT_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    db.close();
  } catch {
    try {
      localStorage.setItem(FALLBACK_LS_KEY, JSON.stringify(normalized));
    } catch {
      // Ignore quota errors
    }
  }
}

export function normalizeSnapshot(raw: Partial<WorkspaceSnapshot>): WorkspaceSnapshot {
  const base = createEmptyWorkspaceSnapshot();
  return {
    version: typeof raw.version === 'number' ? raw.version : 1,
    snippets: Array.isArray(raw.snippets) ? raw.snippets : base.snippets,
    notes: Array.isArray(raw.notes) ? raw.notes : base.notes,
    apiRequests: Array.isArray(raw.apiRequests) ? raw.apiRequests : base.apiRequests,
    apiHistory: Array.isArray(raw.apiHistory) ? raw.apiHistory : base.apiHistory,
    errors: Array.isArray(raw.errors) ? raw.errors : base.errors,
    projects: Array.isArray(raw.projects) ? raw.projects : base.projects,
    tasks: Array.isArray(raw.tasks) ? raw.tasks : base.tasks,
    customCommands: Array.isArray(raw.customCommands) ? raw.customCommands : base.customCommands,
    favoriteCommandIds: Array.isArray(raw.favoriteCommandIds) ? raw.favoriteCommandIds : base.favoriteCommandIds,
    bookmarks: Array.isArray(raw.bookmarks) ? raw.bookmarks : base.bookmarks,
    focusSessions: Array.isArray(raw.focusSessions) ? raw.focusSessions : base.focusSessions,
    activities: Array.isArray(raw.activities) ? raw.activities : base.activities,
    preferences: { ...DEFAULT_PREFERENCES, ...(raw.preferences || {}) },
    lastModifiedAt: raw.lastModifiedAt || base.lastModifiedAt,
  };
}
