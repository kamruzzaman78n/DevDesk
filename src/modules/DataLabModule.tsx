import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, RotateCcw, Search, Star } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
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
  formatXml,
  generateLoremIpsum,
  generateShaHash,
  generateUuids,
  minifyJson,
  parseTimestamp,
  testRegexSafe,
} from '../lib/tools';

interface ToolMeta {
  id: string;
  name: string;
  summary: string;
}

const TOOLS: ToolMeta[] = [
  { id: 'json', name: 'JSON Formatter & Validator', summary: 'Pretty-print, validate, or minify JSON locally.' },
  { id: 'base64', name: 'Base64 Encode / Decode', summary: 'UTF-8 safe Base64 conversion.' },
  { id: 'url', name: 'URL Encode / Decode', summary: 'Percent-encode or decode URI components.' },
  { id: 'hash', name: 'Hash Generator (SHA)', summary: 'Compute SHA-256, SHA-384, or SHA-512 via Web Crypto.' },
  { id: 'uuid', name: 'UUID v4 Generator', summary: 'Generate cryptographically random UUIDs.' },
  { id: 'regex', name: 'Regex Tester', summary: 'Test regular expressions and inspect match groups safely.' },
  { id: 'timestamp', name: 'Timestamp Converter', summary: 'Convert Unix seconds/ms to ISO UTC and local time.' },
  { id: 'color', name: 'Color Converter', summary: 'Convert HEX to RGB and HSL with live preview.' },
  { id: 'diff', name: 'Text Diff Checker', summary: 'Line-by-line comparison between two text blocks.' },
  { id: 'sql', name: 'SQL Formatter', summary: 'Format SQL clauses for clean readability.' },
  { id: 'xml', name: 'XML Formatter / Validator', summary: 'Validate and indent XML documents.' },
  { id: 'html', name: 'HTML Entity Encode / Decode', summary: 'Escape or unescape HTML special characters.' },
  { id: 'counter', name: 'Word & Character Counter', summary: 'Count words, characters, lines, and reading time.' },
  { id: 'base', name: 'Number Base Converter', summary: 'Convert between Binary, Octal, Decimal, and Hex.' },
  { id: 'jwt', name: 'JWT Decoder', summary: 'Inspect JWT header and payload (decode only).' },
  { id: 'qr', name: 'QR Code Generator', summary: 'Generate QR codes locally without external APIs.' },
];

export const DataLabModule: React.FC<{ initialToolId?: string }> = ({ initialToolId }) => {
  const { snapshot, updatePreferences, pushToast } = useWorkspace();
  const [activeTool, setActiveTool] = useState(initialToolId || 'json');
  const [toolSearch, setToolSearch] = useState('');
  const [copied, setCopied] = useState(false);

  // Tool states
  const [jsonInput, setJsonInput] = useState('{"name":"DevDesk","localFirst":true}');
  const [jsonOutput, setJsonOutput] = useState('');
  const [jsonError, setJsonError] = useState('');

  const [b64Input, setB64Input] = useState('DevDesk Local Workspace');
  const [b64Output, setB64Output] = useState('');
  const [b64Error, setB64Error] = useState('');

  const [urlInput, setUrlInput] = useState('https://example.com/search?q=dev desk');
  const [urlOutput, setUrlOutput] = useState('');
  const [urlError, setUrlError] = useState('');

  const [hashInput, setHashInput] = useState('devdesk');
  const [hashAlg, setHashAlg] = useState<'SHA-256' | 'SHA-384' | 'SHA-512'>('SHA-256');
  const [hashOutput, setHashOutput] = useState('');

  const [uuidCount, setUuidCount] = useState(5);
  const [uuids, setUuids] = useState<string[]>(() => generateUuids(5));

  const [regexPattern, setRegexPattern] = useState('\\b[A-Z][a-z]+\\b');
  const [regexFlags, setRegexFlags] = useState('g');
  const [regexText, setRegexText] = useState('DevDesk organizes Code Vault and DevNotes locally.');

  const [tsInput, setTsInput] = useState('');

  const [hexInput, setHexInput] = useState('#4F46E5');

  const [diffLeft, setDiffLeft] = useState('const mode = "local";\nconst sync = false;');
  const [diffRight, setDiffRight] = useState('const mode = "local";\nconst sync = true;\nconst pwa = true;');

  const [sqlInput, setSqlInput] = useState('select id, title from snippets where favorite = true order by updated_at desc limit 10');
  const [sqlOutput, setSqlOutput] = useState('');

  const [xmlInput, setXmlInput] = useState('<workspace><module>CodeVault</module><module>DevNotes</module></workspace>');
  const [xmlOutput, setXmlOutput] = useState('');
  const [xmlError, setXmlError] = useState('');

  const [htmlInput, setHtmlInput] = useState('<div class="card">DevDesk & Co</div>');
  const [htmlOutput, setHtmlOutput] = useState('');

  const [countInput, setCountInput] = useState('');
  const [loremCount, setLoremCount] = useState(2);

  const [baseInput, setBaseInput] = useState('255');
  const [fromBase, setFromBase] = useState<2 | 8 | 10 | 16>(10);

  const [jwtInput, setJwtInput] = useState('');

  const [qrInput, setQrInput] = useState('https://devdesk.app');
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (initialToolId) setActiveTool(initialToolId);
  }, [initialToolId]);

  const selectTool = (id: string) => {
    setActiveTool(id);
    const nextRecent = [id, ...snapshot.preferences.recentTools.filter((t) => t !== id)].slice(0, 6);
    updatePreferences({ recentTools: nextRecent });
  };

  const toggleFavoriteTool = (id: string) => {
    const exists = snapshot.preferences.favoriteTools.includes(id);
    updatePreferences({
      favoriteTools: exists
        ? snapshot.preferences.favoriteTools.filter((t) => t !== id)
        : [...snapshot.preferences.favoriteTools, id],
    });
  };

  useEffect(() => {
    if (activeTool === 'hash') {
      generateShaHash(hashInput, hashAlg).then((res) => {
        if (res.ok && res.output) setHashOutput(res.output);
      });
    }
  }, [activeTool, hashInput, hashAlg]);

  useEffect(() => {
    if (activeTool === 'qr' && qrInput.trim()) {
      QRCode.toDataURL(qrInput.trim(), { width: 220, margin: 2 })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(''));
    }
  }, [activeTool, qrInput]);

  const filteredTools = useMemo(() => {
    const q = toolSearch.trim().toLowerCase();
    return TOOLS.filter(
      (t) =>
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q),
    );
  }, [toolSearch]);

  const currentMeta = TOOLS.find((t) => t.id === activeTool) || TOOLS[0];

  const copyValue = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
      pushToast('Copied output.', 'success');
    } catch {
      pushToast('Clipboard access blocked.', 'error');
    }
  };

  const regexResult = useMemo(
    () => (activeTool === 'regex' ? testRegexSafe(regexPattern, regexFlags, regexText) : null),
    [activeTool, regexPattern, regexFlags, regexText],
  );
  const tsResult = useMemo(
    () => (activeTool === 'timestamp' ? parseTimestamp(tsInput) : null),
    [activeTool, tsInput],
  );
  const colorResult = useMemo(
    () => (activeTool === 'color' ? convertHexColor(hexInput) : null),
    [activeTool, hexInput],
  );
  const diffLines = useMemo(
    () => (activeTool === 'diff' ? computeLineDiff(diffLeft, diffRight) : []),
    [activeTool, diffLeft, diffRight],
  );
  const textStats = useMemo(() => countTextStats(countInput), [countInput]);
  const baseResult = useMemo(
    () => (activeTool === 'base' ? convertNumberBase(baseInput, fromBase) : null),
    [activeTool, baseInput, fromBase],
  );
  const jwtResult = useMemo(
    () => (activeTool === 'jwt' && jwtInput.trim() ? decodeJwtUnverified(jwtInput) : null),
    [activeTool, jwtInput],
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          Data Lab
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          16 local developer utilities running directly in your browser. Input stays on your device.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Tool Selector Sidebar */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-3 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={toolSearch}
              onChange={(e) => setToolSearch(e.target.value)}
              placeholder="Search utilities…"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent pl-9 pr-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="max-h-[540px] overflow-y-auto space-y-1">
            {filteredTools.map((tool) => {
              const isFav = snapshot.preferences.favoriteTools.includes(tool.id);
              const isActive = activeTool === tool.id;
              return (
                <div
                  key={tool.id}
                  className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => selectTool(tool.id)}
                    className="flex-1 text-left truncate cursor-pointer"
                  >
                    {tool.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFavoriteTool(tool.id)}
                    aria-label={`Favorite ${tool.name}`}
                    className="p-1 text-slate-400 hover:text-amber-500 cursor-pointer"
                  >
                    <Star className={`w-3.5 h-3.5 ${isFav ? 'text-amber-500 fill-amber-500' : ''}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Tool Panel */}
        <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
              {currentMeta.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{currentMeta.summary}</p>
          </div>

          {activeTool === 'json' && (
            <div className="space-y-3">
              <textarea
                rows={7}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste raw JSON here…"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] p-3 font-mono text-xs"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const r = formatJson(jsonInput, 2);
                    if (r.ok && r.output) {
                      setJsonOutput(r.output);
                      setJsonError('');
                    } else setJsonError(r.error || 'Invalid JSON');
                  }}
                  className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 cursor-pointer"
                >
                  Format (2 Spaces)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const r = minifyJson(jsonInput);
                    if (r.ok && r.output) {
                      setJsonOutput(r.output);
                      setJsonError('');
                    } else setJsonError(r.error || 'Invalid JSON');
                  }}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-1.5 text-xs font-medium cursor-pointer"
                >
                  Minify
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setJsonInput('');
                    setJsonOutput('');
                    setJsonError('');
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
              {jsonError && <div className="text-xs text-red-500">{jsonError}</div>}
              {jsonOutput && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Output</span>
                    <button type="button" onClick={() => copyValue(jsonOutput)} className="inline-flex items-center gap-1 text-indigo-500 cursor-pointer">
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-100 p-3 font-mono text-xs overflow-x-auto">
                    {jsonOutput}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTool === 'base64' && (
            <div className="space-y-3">
              <textarea
                rows={5}
                value={b64Input}
                onChange={(e) => setB64Input(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] p-3 font-mono text-xs"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const r = encodeBase64(b64Input);
                    if (r.ok && r.output !== undefined) {
                      setB64Output(r.output);
                      setB64Error('');
                    } else setB64Error(r.error || 'Error');
                  }}
                  className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white cursor-pointer"
                >
                  Encode Base64
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const r = decodeBase64(b64Input);
                    if (r.ok && r.output !== undefined) {
                      setB64Output(r.output);
                      setB64Error('');
                    } else setB64Error(r.error || 'Error');
                  }}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-1.5 text-xs font-medium cursor-pointer"
                >
                  Decode Base64
                </button>
              </div>
              {b64Error && <div className="text-xs text-red-500">{b64Error}</div>}
              {b64Output && (
                <div className="space-y-1.5">
                  <button type="button" onClick={() => copyValue(b64Output)} className="text-xs text-indigo-500 cursor-pointer">
                    Copy Output
                  </button>
                  <pre className="rounded-lg bg-slate-950 text-slate-100 p-3 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                    {b64Output}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTool === 'url' && (
            <div className="space-y-3">
              <textarea
                rows={4}
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] p-3 font-mono text-xs"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const r = encodeUrl(urlInput);
                    if (r.ok && r.output !== undefined) {
                      setUrlOutput(r.output);
                      setUrlError('');
                    } else setUrlError(r.error || 'Error');
                  }}
                  className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white cursor-pointer"
                >
                  URL Encode
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const r = decodeUrl(urlInput);
                    if (r.ok && r.output !== undefined) {
                      setUrlOutput(r.output);
                      setUrlError('');
                    } else setUrlError(r.error || 'Error');
                  }}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-1.5 text-xs font-medium cursor-pointer"
                >
                  URL Decode
                </button>
              </div>
              {urlError && <div className="text-xs text-red-500">{urlError}</div>}
              {urlOutput && (
                <pre className="rounded-lg bg-slate-950 text-slate-100 p-3 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                  {urlOutput}
                </pre>
              )}
            </div>
          )}

          {activeTool === 'hash' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {(['SHA-256', 'SHA-384', 'SHA-512'] as const).map((alg) => (
                  <button
                    key={alg}
                    type="button"
                    onClick={() => setHashAlg(alg)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer ${
                      hashAlg === alg
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {alg}
                  </button>
                ))}
              </div>
              <textarea
                rows={4}
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                placeholder="Enter text to hash…"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] p-3 font-mono text-xs"
              />
              <div className="rounded-lg bg-slate-950 text-slate-100 p-3 font-mono text-xs break-all">
                {hashOutput}
              </div>
              <button
                type="button"
                onClick={() => copyValue(hashOutput)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium cursor-pointer"
              >
                Copy Digest
              </button>
            </div>
          )}

          {activeTool === 'uuid' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-600 dark:text-slate-300">Count:</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={uuidCount}
                  onChange={(e) => setUuidCount(Number(e.target.value) || 1)}
                  className="w-20 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2.5 py-1.5 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setUuids(generateUuids(uuidCount))}
                  className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white cursor-pointer"
                >
                  Generate UUIDs
                </button>
                <button
                  type="button"
                  onClick={() => copyValue(uuids.join('\n'))}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs cursor-pointer"
                >
                  Copy All
                </button>
              </div>
              <pre className="rounded-lg bg-slate-950 text-slate-100 p-3 font-mono text-xs leading-6">
                {uuids.join('\n')}
              </pre>
            </div>
          )}

          {activeTool === 'regex' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  value={regexPattern}
                  onChange={(e) => setRegexPattern(e.target.value)}
                  placeholder="Pattern"
                  className="sm:col-span-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 font-mono text-xs"
                />
                <input
                  type="text"
                  value={regexFlags}
                  onChange={(e) => setRegexFlags(e.target.value)}
                  placeholder="Flags (gim)"
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 font-mono text-xs"
                />
              </div>
              <textarea
                rows={4}
                value={regexText}
                onChange={(e) => setRegexText(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] p-3 font-mono text-xs"
              />
              {regexResult && !regexResult.ok && (
                <div className="text-xs text-red-500">{regexResult.error}</div>
              )}
              {regexResult && regexResult.ok && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                    Matches found: {regexResult.output?.length || 0}
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-lg border border-slate-200 dark:border-slate-800">
                    {(regexResult.output || []).map((m, idx) => (
                      <div key={idx} className="px-3 py-2 font-mono text-xs flex justify-between">
                        <span className="text-indigo-500">{JSON.stringify(m.match)}</span>
                        <span className="text-slate-500 tabular-nums">index {m.index}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTool === 'timestamp' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tsInput}
                  onChange={(e) => setTsInput(e.target.value)}
                  placeholder="Leave blank for now, or enter Unix seconds/ms or ISO string"
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setTsInput(String(Math.floor(Date.now() / 1000)))}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs cursor-pointer"
                >
                  Now
                </button>
              </div>
              {tsResult && !tsResult.ok && <div className="text-xs text-red-500">{tsResult.error}</div>}
              {tsResult && tsResult.ok && tsResult.output && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {[
                    ['Unix Seconds', String(tsResult.output.unixSeconds)],
                    ['Unix Milliseconds', String(tsResult.output.unixMillis)],
                    ['ISO 8601 (UTC)', tsResult.output.isoUtc],
                    ['Local Time', tsResult.output.localReadable],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                      <div className="text-slate-500">{k}</div>
                      <div className="mt-1 font-mono text-slate-900 dark:text-slate-100 tabular-nums">{v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTool === 'color' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={colorResult?.ok && colorResult.output ? colorResult.output.hex : '#4F46E5'}
                  onChange={(e) => setHexInput(e.target.value)}
                  className="h-10 w-12 rounded border border-slate-300 dark:border-slate-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => setHexInput(e.target.value)}
                  placeholder="#4F46E5"
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 font-mono text-xs"
                />
              </div>
              {colorResult && !colorResult.ok && <div className="text-xs text-red-500">{colorResult.error}</div>}
              {colorResult && colorResult.ok && colorResult.output && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {[
                    ['HEX', colorResult.output.hex],
                    ['RGB', colorResult.output.rgb],
                    ['HSL', colorResult.output.hsl],
                  ].map(([label, val]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => copyValue(val)}
                      className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-left hover:border-indigo-500 cursor-pointer"
                    >
                      <div className="text-slate-500">{label} (click to copy)</div>
                      <div className="mt-1 font-mono font-medium">{val}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTool === 'diff' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <textarea
                  rows={6}
                  value={diffLeft}
                  onChange={(e) => setDiffLeft(e.target.value)}
                  aria-label="Original text"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] p-3 font-mono text-xs"
                />
                <textarea
                  rows={6}
                  value={diffRight}
                  onChange={(e) => setDiffRight(e.target.value)}
                  aria-label="Modified text"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] p-3 font-mono text-xs"
                />
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 p-3 font-mono text-xs space-y-0.5 overflow-x-auto">
                {diffLines.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.type === 'added'
                        ? 'bg-emerald-500/15 text-emerald-300 px-2'
                        : line.type === 'removed'
                          ? 'bg-red-500/15 text-red-300 px-2'
                          : 'text-slate-300 px-2'
                    }
                  >
                    <span className="select-none mr-2 opacity-60">
                      {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                    </span>
                    {line.text || ' '}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTool === 'sql' && (
            <div className="space-y-3">
              <textarea
                rows={5}
                value={sqlInput}
                onChange={(e) => setSqlInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] p-3 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  const r = formatSql(sqlInput);
                  if (r.ok && r.output) setSqlOutput(r.output);
                }}
                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white cursor-pointer"
              >
                Format SQL
              </button>
              {sqlOutput && (
                <pre className="rounded-lg bg-slate-950 text-slate-100 p-3 font-mono text-xs overflow-x-auto">
                  {sqlOutput}
                </pre>
              )}
            </div>
          )}

          {activeTool === 'xml' && (
            <div className="space-y-3">
              <textarea
                rows={5}
                value={xmlInput}
                onChange={(e) => setXmlInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] p-3 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  const r = formatXml(xmlInput);
                  if (r.ok && r.output) {
                    setXmlOutput(r.output);
                    setXmlError('');
                  } else setXmlError(r.error || 'Invalid XML');
                }}
                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white cursor-pointer"
              >
                Validate & Format XML
              </button>
              {xmlError && <div className="text-xs text-red-500">{xmlError}</div>}
              {xmlOutput && (
                <pre className="rounded-lg bg-slate-950 text-slate-100 p-3 font-mono text-xs overflow-x-auto">
                  {xmlOutput}
                </pre>
              )}
            </div>
          )}

          {activeTool === 'html' && (
            <div className="space-y-3">
              <textarea
                rows={4}
                value={htmlInput}
                onChange={(e) => setHtmlInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] p-3 font-mono text-xs"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setHtmlOutput(encodeHtmlEntities(htmlInput))}
                  className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white cursor-pointer"
                >
                  Encode Entities
                </button>
                <button
                  type="button"
                  onClick={() => setHtmlOutput(decodeHtmlEntities(htmlInput))}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-1.5 text-xs font-medium cursor-pointer"
                >
                  Decode Entities
                </button>
              </div>
              {htmlOutput && (
                <pre className="rounded-lg bg-slate-950 text-slate-100 p-3 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                  {htmlOutput}
                </pre>
              )}
            </div>
          )}

          {activeTool === 'counter' && (
            <div className="space-y-3">
              <textarea
                rows={6}
                value={countInput}
                onChange={(e) => setCountInput(e.target.value)}
                placeholder="Paste or type text here…"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] p-3 text-xs"
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  ['Words', textStats.words],
                  ['Characters', textStats.characters],
                  ['No Spaces', textStats.charactersNoSpaces],
                  ['Lines', textStats.lines],
                ].map(([label, val]) => (
                  <div key={String(label)} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                    <div className="text-slate-500">{label}</div>
                    <div className="mt-1 font-mono text-lg font-semibold tabular-nums">{val}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={loremCount}
                  onChange={(e) => setLoremCount(Number(e.target.value) || 1)}
                  className="w-16 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setCountInput(generateLoremIpsum(loremCount))}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs cursor-pointer"
                >
                  Generate Sample Paragraphs
                </button>
              </div>
            </div>
          )}

          {activeTool === 'base' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={fromBase}
                  onChange={(e) => setFromBase(Number(e.target.value) as 2 | 8 | 10 | 16)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] px-3 py-2 text-xs"
                >
                  <option value={10}>Decimal (10)</option>
                  <option value={2}>Binary (2)</option>
                  <option value={8}>Octal (8)</option>
                  <option value={16}>Hexadecimal (16)</option>
                </select>
                <input
                  type="text"
                  value={baseInput}
                  onChange={(e) => setBaseInput(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 font-mono text-xs"
                />
              </div>
              {baseResult && !baseResult.ok && <div className="text-xs text-red-500">{baseResult.error}</div>}
              {baseResult && baseResult.ok && baseResult.output && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {[
                    ['Binary (2)', baseResult.output.bin],
                    ['Octal (8)', baseResult.output.oct],
                    ['Decimal (10)', baseResult.output.dec],
                    ['Hex (16)', baseResult.output.hex],
                  ].map(([label, val]) => (
                    <div key={label} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                      <div className="text-slate-500">{label}</div>
                      <div className="mt-1 font-mono tabular-nums break-all">{val}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTool === 'jwt' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                Decode only: This tool inspects JWT Base64URL segments locally and does not verify cryptographic signatures.
              </div>
              <textarea
                rows={4}
                value={jwtInput}
                onChange={(e) => setJwtInput(e.target.value)}
                placeholder="Paste JWT (header.payload.signature)…"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] p-3 font-mono text-xs"
              />
              {jwtResult && !jwtResult.ok && <div className="text-xs text-red-500">{jwtResult.error}</div>}
              {jwtResult && jwtResult.ok && jwtResult.output && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <pre className="rounded-lg bg-slate-950 text-slate-100 p-3 font-mono text-xs overflow-x-auto">
                    {JSON.stringify(jwtResult.output.header, null, 2)}
                  </pre>
                  <pre className="rounded-lg bg-slate-950 text-slate-100 p-3 font-mono text-xs overflow-x-auto">
                    {JSON.stringify(jwtResult.output.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTool === 'qr' && (
            <div className="space-y-4">
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Enter URL or text for QR code…"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 text-xs"
              />
              {qrDataUrl && (
                <div className="flex flex-col items-start gap-3">
                  <img
                    src={qrDataUrl}
                    alt="Generated QR code"
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white p-2"
                  />
                  <a
                    href={qrDataUrl}
                    download="devdesk-qr.png"
                    className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                  >
                    Download PNG
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
