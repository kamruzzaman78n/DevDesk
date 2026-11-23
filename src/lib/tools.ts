export interface ToolResult<T = string> {
  ok: boolean;
  output?: T;
  error?: string;
}

export function formatJson(input: string, indent = 2): ToolResult {
  if (!input.trim()) return { ok: false, error: 'Enter JSON text to format.' };
  try {
    const parsed = JSON.parse(input);
    return { ok: true, output: JSON.stringify(parsed, null, indent) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Invalid JSON.' };
  }
}

export function minifyJson(input: string): ToolResult {
  if (!input.trim()) return { ok: false, error: 'Enter JSON text to minify.' };
  try {
    const parsed = JSON.parse(input);
    return { ok: true, output: JSON.stringify(parsed) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Invalid JSON.' };
  }
}

export function encodeBase64(input: string): ToolResult {
  try {
    const bytes = new TextEncoder().encode(input);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return { ok: true, output: btoa(binary) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Encoding failed.' };
  }
}

export function decodeBase64(input: string): ToolResult {
  try {
    const cleaned = input.trim();
    const binary = atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return { ok: true, output: new TextDecoder().decode(bytes) };
  } catch {
    return { ok: false, error: 'Invalid Base64 string.' };
  }
}

export function encodeUrl(input: string): ToolResult {
  try {
    return { ok: true, output: encodeURIComponent(input) };
  } catch {
    return { ok: false, error: 'Failed to URL-encode input.' };
  }
}

export function decodeUrl(input: string): ToolResult {
  try {
    return { ok: true, output: decodeURIComponent(input) };
  } catch {
    return { ok: false, error: 'Malformed URI sequence.' };
  }
}

export async function generateShaHash(
  input: string,
  algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256',
): Promise<ToolResult> {
  try {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest(algorithm, data);
    const hex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return { ok: true, output: hex };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Hashing unavailable.' };
  }
}

export function generateUuids(count = 5): string[] {
  const safeCount = Math.max(1, Math.min(50, Math.floor(count)));
  return Array.from({ length: safeCount }, () => crypto.randomUUID());
}

export interface RegexMatchResult {
  match: string;
  index: number;
  groups: string[];
}

export function testRegexSafe(
  pattern: string,
  flags: string,
  text: string,
): ToolResult<RegexMatchResult[]> {
  if (!pattern) return { ok: true, output: [] };
  if (pattern.length > 500) {
    return { ok: false, error: 'Pattern exceeds 500-character safety limit.' };
  }
  if (text.length > 50_000) {
    return { ok: false, error: 'Test input exceeds 50,000-character safety limit.' };
  }
  try {
    const cleanFlags = Array.from(new Set(flags.replace(/[^gimsuy]/g, '').split(''))).join('');
    const regex = new RegExp(pattern, cleanFlags);
    const matches: RegexMatchResult[] = [];
    if (cleanFlags.includes('g')) {
      let m: RegExpExecArray | null;
      let guard = 0;
      while ((m = regex.exec(text)) !== null && guard < 500) {
        matches.push({ match: m[0], index: m.index, groups: m.slice(1) });
        if (m[0].length === 0) regex.lastIndex += 1;
        guard += 1;
      }
    } else {
      const m = regex.exec(text);
      if (m) {
        matches.push({ match: m[0], index: m.index, groups: m.slice(1) });
      }
    }
    return { ok: true, output: matches };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Invalid regular expression.' };
  }
}

export interface TimestampInfo {
  unixSeconds: number;
  unixMillis: number;
  isoUtc: string;
  localReadable: string;
}

export function parseTimestamp(input: string): ToolResult<TimestampInfo> {
  const trimmed = input.trim();
  if (!trimmed) {
    const now = new Date();
    return {
      ok: true,
      output: {
        unixSeconds: Math.floor(now.getTime() / 1000),
        unixMillis: now.getTime(),
        isoUtc: now.toISOString(),
        localReadable: now.toLocaleString(),
      },
    };
  }
  let date: Date;
  if (/^-?\d+$/.test(trimmed)) {
    const num = Number(trimmed);
    const ms = Math.abs(num) < 1e12 ? num * 1000 : num;
    date = new Date(ms);
  } else {
    date = new Date(trimmed);
  }
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: 'Unrecognized timestamp or ISO date string.' };
  }
  return {
    ok: true,
    output: {
      unixSeconds: Math.floor(date.getTime() / 1000),
      unixMillis: date.getTime(),
      isoUtc: date.toISOString(),
      localReadable: date.toLocaleString(),
    },
  };
}

export interface ColorConversion {
  hex: string;
  rgb: string;
  hsl: string;
  r: number;
  g: number;
  b: number;
}

export function convertHexColor(input: string): ToolResult<ColorConversion> {
  let hex = input.trim().replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    return { ok: false, error: 'Enter a valid 3- or 6-digit HEX color (e.g. #4F46E5).' };
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    ok: true,
    output: {
      hex: `#${hex.toUpperCase()}`,
      rgb: `rgb(${r}, ${g}, ${b})`,
      hsl: `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`,
      r,
      g,
      b,
    },
  };
}

export interface DiffLine {
  type: 'same' | 'added' | 'removed';
  text: string;
}

export function computeLineDiff(left: string, right: string): DiffLine[] {
  const a = left.split('\n');
  const b = right.split('\n');
  const m = a.length;
  const n = b.length;
  // LCS DP table for accurate diff on reasonably sized inputs
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }
  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      result.push({ type: 'same', text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: 'removed', text: a[i] });
      i++;
    } else {
      result.push({ type: 'added', text: b[j] });
      j++;
    }
  }
  while (i < m) result.push({ type: 'removed', text: a[i++] });
  while (j < n) result.push({ type: 'added', text: b[j++] });
  return result;
}

export function formatSql(input: string): ToolResult {
  if (!input.trim()) return { ok: false, error: 'Enter a SQL query to format.' };
  const keywords = [
    'SELECT',
    'FROM',
    'WHERE',
    'INNER JOIN',
    'LEFT JOIN',
    'RIGHT JOIN',
    'FULL JOIN',
    'JOIN',
    'ON',
    'GROUP BY',
    'ORDER BY',
    'HAVING',
    'LIMIT',
    'OFFSET',
    'INSERT INTO',
    'VALUES',
    'UPDATE',
    'SET',
    'DELETE FROM',
    'AND',
    'OR',
  ];
  let out = input.replace(/\s+/g, ' ').trim();
  for (const kw of keywords) {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    out = out.replace(regex, `\n${kw}`);
  }
  out = out
    .replace(/^\n+/, '')
    .split('\n')
    .map((line) => (line.startsWith('AND ') || line.startsWith('OR ') ? `  ${line}` : line))
    .join('\n');
  return { ok: true, output: out };
}

export function formatXml(input: string): ToolResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: 'Enter XML content to format.' };
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, 'application/xml');
    if (doc.querySelector('parsererror')) {
      return { ok: false, error: 'Malformed XML: syntax error detected.' };
    }
  }
  const normalized = trimmed.replace(/>\s*</g, '><');
  const tokens = normalized.replace(/(>)(<)(\/*)/g, '$1\n$2$3').split('\n');
  let pad = 0;
  const lines: string[] = [];
  for (const token of tokens) {
    let indent = 0;
    if (/^<\/\w/.test(token)) {
      pad = Math.max(0, pad - 1);
    } else if (/^<\w[^>]*[^/]>.*$/.test(token) && !/<\/[^>]+>$/.test(token)) {
      indent = 1;
    }
    lines.push('  '.repeat(pad) + token);
    pad += indent;
  }
  return { ok: true, output: lines.join('\n') };
}

export function encodeHtmlEntities(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

export function convertNumberBase(
  input: string,
  fromBase: 2 | 8 | 10 | 16,
): ToolResult<{ bin: string; oct: string; dec: string; hex: string }> {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: 'Enter a number to convert.' };
  const validators: Record<number, RegExp> = {
    2: /^[+-]?[01]+$/,
    8: /^[+-]?[0-7]+$/,
    10: /^[+-]?[0-9]+$/,
    16: /^[+-]?(0x)?[0-9a-fA-F]+$/,
  };
  if (!validators[fromBase].test(trimmed)) {
    return { ok: false, error: `Invalid base-${fromBase} number.` };
  }
  const normalized = fromBase === 16 ? trimmed.replace(/^0x/i, '') : trimmed;
  const parsed = parseInt(normalized, fromBase);
  if (!Number.isSafeInteger(parsed)) {
    return { ok: false, error: 'Number exceeds safe JavaScript integer range.' };
  }
  return {
    ok: true,
    output: {
      bin: parsed.toString(2),
      oct: parsed.toString(8),
      dec: parsed.toString(10),
      hex: parsed.toString(16).toUpperCase(),
    },
  };
}

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signaturePresent: boolean;
}

export function decodeJwtUnverified(token: string): ToolResult<DecodedJwt> {
  const parts = token.trim().split('.');
  if (parts.length < 2 || parts.length > 3) {
    return { ok: false, error: 'JWT must have 2 or 3 dot-separated segments.' };
  }
  const decodePart = (segment: string) => {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4 ? '='.repeat(4 - (base64.length % 4)) : '';
    const res = decodeBase64(base64 + pad);
    if (!res.ok || !res.output) throw new Error('Invalid Base64URL segment');
    return JSON.parse(res.output) as Record<string, unknown>;
  };
  try {
    const header = decodePart(parts[0]);
    const payload = decodePart(parts[1]);
    return {
      ok: true,
      output: {
        header,
        payload,
        signaturePresent: Boolean(parts[2] && parts[2].length > 0),
      },
    };
  } catch {
    return { ok: false, error: 'Failed to decode JWT JSON payload.' };
  }
}

export function countTextStats(input: string) {
  const characters = input.length;
  const charactersNoSpaces = input.replace(/\s/g, '').length;
  const words = input.trim() ? input.trim().split(/\s+/).length : 0;
  const lines = input.length === 0 ? 0 : input.split('\n').length;
  const readingMinutes = Math.max(0, Math.ceil(words / 200));
  return { characters, charactersNoSpaces, words, lines, readingMinutes };
}

export function generateLoremIpsum(paragraphs = 2): string {
  const sentences = [
    'Modular software architecture keeps domain boundaries explicit and testable across web and desktop runtimes.',
    'Local-first storage ensures code snippets and technical notes remain available even without an active connection.',
    'Consistent design tokens reduce cognitive overhead when switching between editing, debugging, and endpoint verification.',
    'Predictable keyboard navigation allows engineers to move from search results directly into active workspaces.',
    'Structured error logs preserve root causes and verified fixes so recurring issues take minutes instead of hours.',
  ];
  const count = Math.max(1, Math.min(8, paragraphs));
  return Array.from({ length: count }, (_, idx) => {
    const rotated = [...sentences.slice(idx % sentences.length), ...sentences.slice(0, idx % sentences.length)];
    return rotated.slice(0, 4).join(' ');
  }).join('\n\n');
}
