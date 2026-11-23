import { describe, expect, it } from 'vitest';
import {
  computeLineDiff,
  convertHexColor,
  convertNumberBase,
  countTextStats,
  decodeBase64,
  decodeHtmlEntities,
  decodeJwtUnverified,
  decodeUrl,
  encodeBase64,
  encodeHtmlEntities,
  encodeUrl,
  formatJson,
  formatSql,
  generateUuids,
  minifyJson,
  parseTimestamp,
  testRegexSafe,
} from '../tools';
import { isSafeHttpUrl, normalizeSafeUrl } from '../sanitize';
import { filterFreeOpenRouterModels } from '../aiModels';

describe('DevDesk Data Lab utilities', () => {
  it('only lists live OpenRouter models explicitly priced at zero and limits the catalog', () => {
    const models = filterFreeOpenRouterModels({
      data: [
        { id: 'vendor/free', name: 'Free model', pricing: { prompt: '0', completion: 0 } },
        { id: 'vendor/paid', pricing: { prompt: '0.0001', completion: '0' } },
        { id: 'vendor/unknown', pricing: { prompt: '0', completion: undefined } },
        ...Array.from({ length: 30 }, (_, index) => ({
          id: `vendor/free-${index}`,
          pricing: { prompt: '0', completion: '0' },
        })),
      ],
    });
    expect(models).toHaveLength(25);
    expect(models[0]).toEqual({ id: 'vendor/free', name: 'Free model' });
    expect(models.every((model) => !model.id.includes('paid') && !model.id.includes('unknown'))).toBe(true);
    expect(filterFreeOpenRouterModels({ data: 'invalid' })).toEqual([]);
  });

  it('formats and minifies valid JSON and rejects invalid JSON', () => {
    const formatted = formatJson('{"a":1,"b":2}', 2);
    expect(formatted.ok).toBe(true);
    expect(formatted.output).toContain('\n  "a": 1');

    const minified = minifyJson('{\n  "a": 1\n}');
    expect(minified.ok).toBe(true);
    expect(minified.output).toBe('{"a":1}');

    const bad = formatJson('{bad}');
    expect(bad.ok).toBe(false);
  });

  it('roundtrips UTF-8 Base64 and URL encoding', () => {
    const sample = 'DevDesk Workspace — বাংলা & ASCII';
    const b64 = encodeBase64(sample);
    expect(b64.ok).toBe(true);
    const decoded = decodeBase64(b64.output!);
    expect(decoded.output).toBe(sample);

    const urlEnc = encodeUrl('hello world?x=1&y=2');
    expect(decodeUrl(urlEnc.output!).output).toBe('hello world?x=1&y=2');
  });

  it('generates requested number of valid UUID v4 strings', () => {
    const ids = generateUuids(3);
    expect(ids).toHaveLength(3);
    ids.forEach((id) => {
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  it('runs safe regex matching and catches invalid patterns', () => {
    const res = testRegexSafe('\\d+', 'g', 'port 3000 and 5432');
    expect(res.ok).toBe(true);
    expect(res.output?.map((m) => m.match)).toEqual(['3000', '5432']);

    const bad = testRegexSafe('[unclosed', 'g', 'abc');
    expect(bad.ok).toBe(false);
  });

  it('converts timestamps, colors, number bases, SQL, HTML entities, and counts text', () => {
    const ts = parseTimestamp('1700000000');
    expect(ts.ok).toBe(true);
    expect(ts.output?.isoUtc).toBe('2023-11-14T22:13:20.000Z');

    const color = convertHexColor('#4F46E5');
    expect(color.ok).toBe(true);
    expect(color.output?.rgb).toBe('rgb(79, 70, 229)');

    const base = convertNumberBase('FF', 16);
    expect(base.ok).toBe(true);
    expect(base.output?.dec).toBe('255');
    expect(base.output?.bin).toBe('11111111');

    const sql = formatSql('select id from users where active = true');
    expect(sql.output).toContain('SELECT');
    expect(sql.output).toContain('\nFROM');

    const escaped = encodeHtmlEntities('<script>alert(1)</script>');
    expect(escaped).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(decodeHtmlEntities(escaped)).toBe('<script>alert(1)</script>');

    const stats = countTextStats('one two\nthree');
    expect(stats.words).toBe(3);
    expect(stats.lines).toBe(2);
  });

  it('computes line diffs and decodes JWT segments', () => {
    const diff = computeLineDiff('a\nb', 'a\nc');
    expect(diff).toEqual([
      { type: 'same', text: 'a' },
      { type: 'removed', text: 'b' },
      { type: 'added', text: 'c' },
    ]);

    const header = btoa('{"alg":"HS256","typ":"JWT"}').replace(/=/g, '');
    const payload = btoa('{"sub":"user-1"}').replace(/=/g, '');
    const jwt = decodeJwtUnverified(`${header}.${payload}.sig`);
    expect(jwt.ok).toBe(true);
    expect(jwt.output?.payload.sub).toBe('user-1');
  });

  it('blocks unsafe URL schemes like javascript: and data:', () => {
    expect(isSafeHttpUrl('https://devdesk.app')).toBe(true);
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
    expect(normalizeSafeUrl('data:text/html,<script>')).toBeNull();
  });
});
