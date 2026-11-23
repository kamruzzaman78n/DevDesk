export type AppMode = 'website' | 'workspace';

export type WebsitePage =
  | 'home'
  | 'features'
  | 'download'
  | 'docs'
  | 'changelog'
  | 'faq'
  | 'privacy'
  | 'terms'
  | 'support';

export type WorkspaceModule =
  | 'dashboard'
  | 'snippets'
  | 'notes'
  | 'api-studio'
  | 'tools'
  | 'errors'
  | 'projects'
  | 'commands'
  | 'analytics'
  | 'ai'
  | 'bookmarks'
  | 'settings';

export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentColor = 'indigo' | 'cobalt' | 'emerald' | 'amber';
export type DensityMode = 'comfortable' | 'compact';
export type SyncStatus = 'local-only' | 'synced' | 'syncing' | 'offline' | 'needs-attention';

export interface CodeSnippet {
  id: string;
  title: string;
  language: string;
  code: string;
  description: string;
  tags: string[];
  folder: string;
  pinned: boolean;
  favorite: boolean;
  inputExample?: string;
  outputExample?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  relatedNoteIds?: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface DevNote {
  id: string;
  title: string;
  content: string;
  folder: string;
  tags: string[];
  pinned: boolean;
  favorite: boolean;
  templateType?: 'blank' | 'concept' | 'bug-fix' | 'api-ref' | 'learning' | 'project';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface ApiRequestItem {
  id: string;
  name: string;
  collection: string;
  method: HttpMethod;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  body: string;
  authType: 'none' | 'bearer' | 'api-key';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ApiHistoryEntry {
  id: string;
  method: HttpMethod;
  url: string;
  status: number;
  durationMs: number;
  sizeBytes: number;
  executedAt: string;
}

export interface ErrorRecord {
  id: string;
  title: string;
  language: string;
  errorMessage: string;
  context: string;
  rootCause: string;
  fixSteps: string;
  originalCode?: string;
  correctedCode?: string;
  tags: string[];
  relatedProjectId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type ProjectStatus = 'active' | 'planning' | 'paused' | 'completed';
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type PriorityLevel = 'low' | 'medium' | 'high';

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: PriorityLevel;
  techStack: string[];
  startDate?: string;
  dueDate?: string;
  repoUrl?: string;
  liveUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface TaskItem {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: PriorityLevel;
  dueDate?: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CommandItem {
  id: string;
  title: string;
  category:
    | 'Git'
    | 'Windows / PowerShell'
    | 'Linux Shell'
    | 'npm / pnpm'
    | 'Python / pip'
    | 'Docker'
    | 'SQL'
    | 'Networking'
    | 'C / C++';
  command: string;
  description: string;
  parameters?: string;
  example?: string;
  destructive?: boolean;
  favorite: boolean;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type BookmarkCategory =
  | 'documentation'
  | 'tutorial'
  | 'repository'
  | 'reference'
  | 'course'
  | 'tool';

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  category: BookmarkCategory;
  tags: string[];
  note: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface FocusSession {
  id: string;
  presetName: string;
  plannedMinutes: number;
  completedMinutes: number;
  completed: boolean;
  startedAt: string;
  endedAt: string;
}

export interface ActivityEvent {
  id: string;
  type: 'snippet' | 'note' | 'project' | 'task' | 'error' | 'focus' | 'tool' | 'command' | 'bookmark';
  action: string;
  title: string;
  timestamp: string;
}

export interface UserPreferences {
  theme: ThemeMode;
  accent: AccentColor;
  density: DensityMode;
  fontSize: 'sm' | 'md' | 'lg';
  editorTabSize: 2 | 4;
  editorLineNumbers: boolean;
  editorWordWrap: boolean;
  autosaveEnabled: boolean;
  defaultLanguage: string;
  sidebarCollapsed: boolean;
  focusSoundEnabled: boolean;
  focusNotificationsEnabled: boolean;
  aiEnabled: boolean;
  syncPaused: boolean;
  onboardingCompleted: boolean;
  onboardingDismissed: boolean;
  preferredLanguages: string[];
  favoriteTools: string[];
  recentTools: string[];
}

export interface WorkspaceSnapshot {
  version: number;
  snippets: CodeSnippet[];
  notes: DevNote[];
  apiRequests: ApiRequestItem[];
  apiHistory: ApiHistoryEntry[];
  errors: ErrorRecord[];
  projects: ProjectItem[];
  tasks: TaskItem[];
  customCommands: CommandItem[];
  favoriteCommandIds: string[];
  bookmarks: BookmarkItem[];
  focusSessions: FocusSession[];
  activities: ActivityEvent[];
  preferences: UserPreferences;
  lastModifiedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface SyncConflict {
  entityType: string;
  id: string;
  title: string;
  localUpdatedAt: string;
  remoteUpdatedAt: string;
}
