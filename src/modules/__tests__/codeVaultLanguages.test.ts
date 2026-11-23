import { describe, expect, it } from 'vitest';
import { CODE_LANGUAGES, highlightCode } from '../codeVaultLanguages';

describe('Code Vault language catalog', () => {
  it('offers at least 50 distinct languages with labels and extensions', () => {
    expect(CODE_LANGUAGES.length).toBeGreaterThanOrEqual(50);
    expect(new Set(CODE_LANGUAGES.map(({ id }) => id)).size).toBe(CODE_LANGUAGES.length);
    expect(CODE_LANGUAGES.every(({ label, extension }) => label && extension)).toBe(true);
  });
});

describe('Code Vault syntax highlighting', () => {
  it('highlights JavaScript keywords, function calls, strings, numbers, and comments', () => {
    const tokens = highlightCode('const answer = greet("world", 42); // hello', 'javascript');
    expect(tokens).toContainEqual({ text: 'const', kind: 'keyword' });
    expect(tokens).toContainEqual({ text: 'greet', kind: 'function' });
    expect(tokens).toContainEqual({ text: '"world"', kind: 'string' });
    expect(tokens).toContainEqual({ text: '42', kind: 'number' });
    expect(tokens).toContainEqual({ text: '// hello', kind: 'comment' });
  });

  it('recognizes Python keywords, comments, and triple-quoted strings', () => {
    const tokens = highlightCode('def greet():\n    """hello"""\n    return True # done', 'python');
    expect(tokens).toContainEqual({ text: 'def', kind: 'keyword' });
    expect(tokens).toContainEqual({ text: '"""hello"""', kind: 'string' });
    expect(tokens).toContainEqual({ text: 'return', kind: 'keyword' });
    expect(tokens).toContainEqual({ text: '# done', kind: 'comment' });
  });
});
