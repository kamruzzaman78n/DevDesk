export type KeyedAiProvider = 'gemini' | 'openrouter';

const SESSION_KEY_NAMES: Record<KeyedAiProvider, string> = {
  gemini: 'devdesk.ai.geminiKey',
  openrouter: 'devdesk.ai.openrouterKey',
};

export function getAiProviderKey(provider: KeyedAiProvider): string {
  try {
    return typeof window === 'undefined' ? '' : window.sessionStorage.getItem(SESSION_KEY_NAMES[provider]) || '';
  } catch {
    return '';
  }
}

export function saveAiProviderKey(provider: KeyedAiProvider, key: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    if (key) window.sessionStorage.setItem(SESSION_KEY_NAMES[provider], key);
    else window.sessionStorage.removeItem(SESSION_KEY_NAMES[provider]);
    return true;
  } catch {
    return false;
  }
}
