import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import type { ApiRequestItem, HttpMethod, KeyValuePair } from '../types/devdesk';

interface ApiResponseView {
  status: number;
  statusText: string;
  durationMs: number;
  sizeBytes: number;
  headers: Record<string, string>;
  body: string;
}

export const ApiStudioModule: React.FC = () => {
  const { snapshot, updateSnapshot, pushToast } = useWorkspace();
  const [selectedId, setSelectedId] = useState<string | null>(snapshot.apiRequests[0]?.id || null);
  const [name, setName] = useState(snapshot.apiRequests[0]?.name || 'New Request');
  const [collection, setCollection] = useState(snapshot.apiRequests[0]?.collection || 'General');
  const [method, setMethod] = useState<HttpMethod>(snapshot.apiRequests[0]?.method || 'GET');
  const [url, setUrl] = useState(snapshot.apiRequests[0]?.url || 'https://api.github.com/zen');
  const [params, setParams] = useState<KeyValuePair[]>(snapshot.apiRequests[0]?.params || []);
  const [headers, setHeaders] = useState<KeyValuePair[]>(
    snapshot.apiRequests[0]?.headers || [{ id: 'h1', key: 'Accept', value: 'application/json', enabled: true }],
  );
  const [body, setBody] = useState(snapshot.apiRequests[0]?.body || '');
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'api-key'>('none');
  // Held strictly in React memory — never persisted as plaintext cloud secrets
  const [authSecret, setAuthSecret] = useState('');
  const [apiKeyHeader, setApiKeyHeader] = useState('X-API-Key');

  const [useProxy, setUseProxy] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [response, setResponse] = useState<ApiResponseView | null>(null);
  const [respTab, setRespTab] = useState<'pretty' | 'raw' | 'headers'>('pretty');
  const [respSearch, setRespSearch] = useState('');
  const [copied, setCopied] = useState(false);

  const loadRequest = (item: ApiRequestItem) => {
    setSelectedId(item.id);
    setName(item.name);
    setCollection(item.collection);
    setMethod(item.method);
    setUrl(item.url);
    setParams(item.params);
    setHeaders(item.headers);
    setBody(item.body);
    setAuthType(item.authType);
    setAuthSecret('');
    setErrorMsg(null);
  };

  const buildFinalUrl = () => {
    const activeParams = params.filter((p) => p.enabled && p.key.trim());
    if (!activeParams.length) return url.trim();
    try {
      const u = new URL(url.trim());
      for (const p of activeParams) {
        u.searchParams.set(p.key.trim(), p.value);
      }
      return u.toString();
    } catch {
      return url.trim();
    }
  };

  const handleSaveRequest = () => {
    const now = new Date().toISOString();
    const id = selectedId || crypto.randomUUID();
    const record: ApiRequestItem = {
      id,
      name: name.trim() || 'Untitled Request',
      collection: collection.trim() || 'General',
      method,
      url: url.trim(),
      params,
      headers,
      body,
      authType,
      createdAt: now,
      updatedAt: now,
    };
    updateSnapshot((prev) => {
      const exists = prev.apiRequests.some((r) => r.id === id);
      return {
        ...prev,
        apiRequests: exists
          ? prev.apiRequests.map((r) => (r.id === id ? record : r))
          : [record, ...prev.apiRequests],
      };
    });
    setSelectedId(id);
    pushToast('Request saved (auth tokens excluded from storage).', 'success');
  };

  const handleSend = async () => {
    setErrorMsg(null);
    const targetUrl = buildFinalUrl();
    if (!targetUrl) {
      setErrorMsg('Enter a valid HTTP or HTTPS URL.');
      return;
    }

    const reqHeaders: Record<string, string> = {};
    for (const h of headers) {
      if (h.enabled && h.key.trim()) {
        reqHeaders[h.key.trim()] = h.value;
      }
    }
    if (authType === 'bearer' && authSecret.trim()) {
      reqHeaders['Authorization'] = `Bearer ${authSecret.trim()}`;
    } else if (authType === 'api-key' && authSecret.trim() && apiKeyHeader.trim()) {
      reqHeaders[apiKeyHeader.trim()] = authSecret.trim();
    }

    setSending(true);
    const started = performance.now();

    try {
      let resView: ApiResponseView;
      if (useProxy) {
        const res = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: targetUrl,
            method,
            headers: reqHeaders,
            body: ['POST', 'PUT', 'PATCH'].includes(method) ? body : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Proxy request failed.');
        }
        resView = data as ApiResponseView;
      } else {
        const upstream = await fetch(targetUrl, {
          method,
          headers: reqHeaders,
          body: ['POST', 'PUT', 'PATCH'].includes(method) && body.trim() ? body : undefined,
        });
        const text = await upstream.text();
        const respHeaders: Record<string, string> = {};
        upstream.headers.forEach((v, k) => {
          respHeaders[k] = v;
        });
        resView = {
          status: upstream.status,
          statusText: upstream.statusText,
          durationMs: Math.round(performance.now() - started),
          sizeBytes: new Blob([text]).size,
          headers: respHeaders,
          body: text,
        };
      }

      setResponse(resView);
      updateSnapshot((prev) => ({
        ...prev,
        apiHistory: [
          {
            id: crypto.randomUUID(),
            method,
            url: targetUrl,
            status: resView.status,
            durationMs: resView.durationMs,
            sizeBytes: resView.sizeBytes,
            executedAt: new Date().toISOString(),
          },
          ...prev.apiHistory,
        ].slice(0, 25),
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Request failed.';
      setErrorMsg(
        useProxy
          ? msg
          : `${msg} (If the target server blocks browser CORS, enable the SSRF-protected DevDesk Proxy toggle.)`,
      );
    } finally {
      setSending(false);
    }
  };

  const prettyBody = useMemo(() => {
    if (!response) return '';
    try {
      return JSON.stringify(JSON.parse(response.body), null, 2);
    } catch {
      return response.body;
    }
  }, [response]);

  const filteredResponseText = useMemo(() => {
    const src = respTab === 'raw' ? response?.body || '' : prettyBody;
    if (!respSearch.trim()) return src;
    const q = respSearch.toLowerCase();
    return src
      .split('\n')
      .filter((line) => line.toLowerCase().includes(q))
      .join('\n');
  }, [respTab, response, prettyBody, respSearch]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            API Studio
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Lightweight HTTP client. Requests run directly from your browser by default, with an optional SSRF-protected proxy for CORS-restricted public APIs.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSaveRequest}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Request</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Saved Requests & History */}
        <div className="lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-3 space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
              <span>Saved Requests</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setName('New Request');
                  setUrl('https://');
                  setBody('');
                }}
                className="text-indigo-500 hover:underline cursor-pointer"
              >
                New
              </button>
            </div>
            {snapshot.apiRequests.length === 0 ? (
              <p className="text-xs text-slate-500">No saved requests yet.</p>
            ) : (
              <div className="space-y-1">
                {snapshot.apiRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => loadRequest(req)}
                      className={`flex-1 truncate rounded-md px-2 py-1.5 text-left text-xs cursor-pointer ${
                        selectedId === req.id
                          ? 'bg-indigo-600/10 text-indigo-500 font-medium'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="font-mono mr-1.5">{req.method}</span>
                      {req.name}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSnapshot((prev) => ({
                          ...prev,
                          apiRequests: prev.apiRequests.filter((r) => r.id !== req.id),
                        }))
                      }
                      aria-label="Delete request"
                      className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Recent History
            </div>
            {snapshot.apiHistory.length === 0 ? (
              <p className="text-xs text-slate-500">No calls executed yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {snapshot.apiHistory.slice(0, 10).map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      setMethod(h.method);
                      setUrl(h.url);
                    }}
                    className="block w-full text-left rounded-md px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <div className="flex justify-between text-[11px] font-mono">
                      <span>{h.method}</span>
                      <span className="tabular-nums">{h.status} · {h.durationMs}ms</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{h.url}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Request & Response Area */}
        <div className="lg:col-span-9 space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Request Name"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs font-medium"
              />
              <input
                type="text"
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                placeholder="Collection"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-1.5 text-xs"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                aria-label="HTTP Method"
                value={method}
                onChange={(e) => setMethod(e.target.value as HttpMethod)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] px-3 py-2 font-mono text-xs font-semibold"
              >
                {(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as HttpMethod[]).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/v1/resource"
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-3 py-2 font-mono text-xs"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-60 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? 'Sending…' : 'Send'}</span>
              </button>
            </div>

            {/* Proxy & Auth */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 pt-3 text-xs">
              <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useProxy}
                  onChange={(e) => setUseProxy(e.target.checked)}
                />
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Use DevDesk Proxy (blocks private/local IPs; helps bypass public CORS)</span>
              </label>

              <div className="flex items-center gap-2">
                <select
                  aria-label="Authentication preset"
                  value={authType}
                  onChange={(e) => setAuthType(e.target.value as 'none' | 'bearer' | 'api-key')}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] px-2.5 py-1 text-xs"
                >
                  <option value="none">No Auth</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="api-key">API Key Header</option>
                </select>
                {authType === 'api-key' && (
                  <input
                    type="text"
                    value={apiKeyHeader}
                    onChange={(e) => setApiKeyHeader(e.target.value)}
                    placeholder="Header name"
                    className="w-28 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-xs font-mono"
                  />
                )}
                {authType !== 'none' && (
                  <input
                    type="password"
                    value={authSecret}
                    onChange={(e) => setAuthSecret(e.target.value)}
                    placeholder="Token (memory only)"
                    className="w-40 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-xs font-mono"
                  />
                )}
              </div>
            </div>

            {/* Query Params & Headers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800 pt-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span>Query Parameters</span>
                  <button
                    type="button"
                    onClick={() =>
                      setParams((p) => [...p, { id: crypto.randomUUID(), key: '', value: '', enabled: true }])
                    }
                    className="inline-flex items-center gap-1 text-indigo-500 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                {params.map((p) => (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={p.enabled}
                      onChange={(e) =>
                        setParams((prev) => prev.map((x) => (x.id === p.id ? { ...x, enabled: e.target.checked } : x)))
                      }
                    />
                    <input
                      type="text"
                      value={p.key}
                      onChange={(e) =>
                        setParams((prev) => prev.map((x) => (x.id === p.id ? { ...x, key: e.target.value } : x)))
                      }
                      placeholder="key"
                      className="flex-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 font-mono text-xs"
                    />
                    <input
                      type="text"
                      value={p.value}
                      onChange={(e) =>
                        setParams((prev) => prev.map((x) => (x.id === p.id ? { ...x, value: e.target.value } : x)))
                      }
                      placeholder="value"
                      className="flex-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setParams((prev) => prev.filter((x) => x.id !== p.id))}
                      className="text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span>Headers</span>
                  <button
                    type="button"
                    onClick={() =>
                      setHeaders((h) => [...h, { id: crypto.randomUUID(), key: '', value: '', enabled: true }])
                    }
                    className="inline-flex items-center gap-1 text-indigo-500 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                {headers.map((h) => (
                  <div key={h.id} className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={h.enabled}
                      onChange={(e) =>
                        setHeaders((prev) => prev.map((x) => (x.id === h.id ? { ...x, enabled: e.target.checked } : x)))
                      }
                    />
                    <input
                      type="text"
                      value={h.key}
                      onChange={(e) =>
                        setHeaders((prev) => prev.map((x) => (x.id === h.id ? { ...x, key: e.target.value } : x)))
                      }
                      placeholder="Header"
                      className="flex-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 font-mono text-xs"
                    />
                    <input
                      type="text"
                      value={h.value}
                      onChange={(e) =>
                        setHeaders((prev) => prev.map((x) => (x.id === h.id ? { ...x, value: e.target.value } : x)))
                      }
                      placeholder="Value"
                      className="flex-1 rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setHeaders((prev) => prev.filter((x) => x.id !== h.id))}
                      className="text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {['POST', 'PUT', 'PATCH'].includes(method) && (
              <div>
                <label className="block text-xs font-medium mb-1">Request Body (JSON / Text)</label>
                <textarea
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder='{"key": "value"}'
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] p-3 font-mono text-xs"
                />
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {response && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                  <span className={response.status < 400 ? 'text-emerald-500 font-semibold' : 'text-red-500 font-semibold'}>
                    Status: {response.status} {response.statusText}
                  </span>
                  <span className="text-slate-500">{response.durationMs} ms</span>
                  <span className="text-slate-500">{response.sizeBytes} bytes</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={respSearch}
                    onChange={(e) => setRespSearch(e.target.value)}
                    placeholder="Filter response…"
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent px-2.5 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(response.body);
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1400);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-xs cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs">
                {(['pretty', 'raw', 'headers'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRespTab(t)}
                    className={`rounded-md px-2.5 py-1 font-medium cursor-pointer ${
                      respTab === t ? 'bg-indigo-600 text-white' : 'text-slate-500'
                    }`}
                  >
                    {t === 'pretty' ? 'Pretty' : t === 'raw' ? 'Raw' : `Headers (${Object.keys(response.headers).length})`}
                  </button>
                ))}
              </div>

              {respTab === 'headers' ? (
                <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-mono">
                  {Object.entries(response.headers).map(([k, v]) => (
                    <div key={k} className="py-1.5 flex justify-between gap-4">
                      <span className="text-slate-500">{k}</span>
                      <span className="text-slate-900 dark:text-slate-100 break-all">{v}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="max-h-96 overflow-auto rounded-lg bg-slate-950 text-slate-100 p-3 font-mono text-xs">
                  {filteredResponseText}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
