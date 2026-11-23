export type Locale = 'en';

export const messages = {
  en: {
    brand: 'DevDesk',
    tagline: 'Your entire developer workflow. One workspace.',
    nav: {
      dashboard: 'Dashboard',
      snippets: 'Code Vault',
      notes: 'DevNotes',
      apiStudio: 'API Studio',
      tools: 'Data Lab',
      errors: 'Error Archive',
      projects: 'Project Hub',
      commands: 'Command Library',
      analytics: 'Dev Analytics',
      ai: 'Dev AI',
      bookmarks: 'Bookmarks',
      settings: 'Settings',
    },
    actions: {
      launchApp: 'Launch Web App',
      newSnippet: 'New Snippet',
      newNote: 'New Note',
      newProject: 'New Project',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      copy: 'Copy',
      copied: 'Copied',
      duplicate: 'Duplicate',
      export: 'Export',
      import: 'Import',
      searchPlaceholder: 'Search snippets, notes, commands, tools…',
    },
    sync: {
      'local-only': 'Local Workspace',
      synced: 'Synced',
      syncing: 'Syncing…',
      offline: 'Offline (Cached)',
      'needs-attention': 'Sync Needs Attention',
    },
  },
} as const;

export function t(locale: Locale = 'en') {
  return messages[locale];
}
