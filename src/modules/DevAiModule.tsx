import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, FilePlus2, RefreshCw, Send, ShieldAlert, Sparkles } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { renderSafeMarkdown } from '../lib/sanitize';
import { getAiProviderKey } from '../lib/aiProviderSettings';

interface AiModelChoice {
  id: string;
  name: string;
  provider: 'gemini' | 'openrouter';
}

interface AiModelCatalog {
  models: AiModelChoice[];
  providers?: {
    openrouter?: { freeModelCount?: number };
  };
}

const QUICK_MODES = [
  { id: 'explain', label: 'Explain Code', prompt: 'Explain how the attached code works and note any edge cases.' },
  { id: 'improve', label: 'Suggest Improvements', prompt: 'Suggest clean, practical improvements for readability and reliability.' },
  { id: 'debug', label: 'Debug Error', prompt: 'Help diagnose the root cause and suggest verification steps for the attached error.' },
  { id: 'docs', label: 'Draft Docs', prompt: 'Draft concise Markdown documentation for the attached snippet or note.' },
  { id: 'sql', label: 'Explain SQL', prompt: 'Explain this SQL query step by step and check index considerations.' },
  { id: 'regex', label: 'Generate Regex', prompt: 'Create a clear regular expression with test cases for: ' },
];

interface ContextChoice {
  id: string;
  type: 'snippet' | 'note' | 'error';
  title: string;
  content: string;
}

export const DevAiModule: React.FC = () => {
  const { snapshot, updateSnapshot, updatePreferences, pushToast } = useWorkspace();
  const [actionMode, setActionMode] = useState('explain');
  const [prompt, setPrompt] = useState('');
  const [attachedIds, setAttachedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reply, setReply] = useState<string | null>(null);
  const [replyModel, setReplyModel] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [modelCatalog, setModelCatalog] = useState<AiModelCatalog>({ models: [] });
  const [selectedModel, setSelectedModel] = useState('gemini::gemini-4-hydrogen');
  const [catalogLoading, setCatalogLoading] = useState(false);

  const refreshModels = async () => {
    setCatalogLoading(true);
    try {
      const response = await fetch('/api/ai/models', { cache: 'no-store' });
      if (!response.ok) throw new Error('Model list unavailable');
      setModelCatalog(await response.json());
    } catch {
      setModelCatalog({ models: [{ id: 'gemini-4-hydrogen', name: 'Gemini (server or personal key)', provider: 'gemini' }] });
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    void refreshModels();
  }, []);

  const availableContext = useMemo<ContextChoice[]>(() => {
    return [
      ...snapshot.snippets.map((s) => ({
        id: `snip-${s.id}`,
        type: 'snippet' as const,
        title: s.title,
        content: `Language: ${s.language}\n${s.code}\n${s.description}`,
      })),
      ...snapshot.notes.map((n) => ({
        id: `note-${n.id}`,
        type: 'note' as const,
        title: n.title,
        content: n.content,
      })),
      ...snapshot.errors.map((e) => ({
        id: `err-${e.id}`,
        type: 'error' as const,
        title: e.title,
        content: `Error: ${e.errorMessage}\nContext: ${e.context}\nRoot cause: ${e.rootCause}`,
      })),
    ];
  }, [snapshot.snippets, snapshot.notes, snapshot.errors]);

  const toggleAttach = (id: string) => {
    setAttachedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 5 ? [...prev, id] : prev,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setErrorMsg(null);
    setLoading(true);
    try {
      const choice = modelCatalog.models.find((item) => `${item.provider}::${item.id}` === selectedModel);
      if (!choice) {
        setErrorMsg('No model is available for that selection. Refresh the model list and choose a model.');
        return;
      }
      const selectedContext = availableContext
        .filter((item) => attachedIds.includes(item.id))
        .map(({ type, title, content }) => ({ type, title, content }));

      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionMode,
          prompt: prompt.trim(),
          selectedContext,
          provider: choice.provider,
          model: choice.id,
          apiKey: choice.provider === 'gemini'
            ? getAiProviderKey('gemini') || undefined
            : getAiProviderKey('openrouter') || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'AI request failed.');
      } else {
        setReply(data.reply);
        setReplyModel(data.model);
      }
    } catch {
      setErrorMsg('Network error reaching Dev AI server endpoint.');
    } finally {
      setLoading(false);
    }
  };

  const saveReplyToNotes = () => {
    if (!reply) return;
    const now = new Date().toISOString();
    updateSnapshot(
      (prev) => ({
        ...prev,
        notes: [
          {
            id: crypto.randomUUID(),
            title: `AI Note: ${prompt.slice(0, 48)}`,
            content: reply,
            folder: 'Dev AI',
            tags: ['ai-draft'],
            pinned: false,
            favorite: false,
            createdAt: now,
            updatedAt: now,
          },
          ...prev.notes,
        ],
      }),
      { type: 'note', action: 'Saved AI draft to DevNotes', title: prompt.slice(0, 40) },
    );
    pushToast('Saved response to DevNotes.', 'success');
  };

  if (!snapshot.preferences.aiEnabled) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center space-y-4">
        <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
        <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          Dev AI is Disabled
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          DevDesk works completely without AI. You can re-enable the opt-in Dev AI module here or in Settings anytime.
        </p>
        <button
          type="button"
          onClick={() => updatePreferences({ aiEnabled: true })}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 cursor-pointer"
        >
          Enable Dev AI Module
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Dev AI Assistant
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Online assistant. Internet access is required, and providers may require an account or API key. No local model installation or download is needed. Only prompts and items you explicitly attach below are sent to the selected provider.
          </p>
        </div>
        <button
          type="button"
          onClick={() => updatePreferences({ aiEnabled: false })}
          className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer self-start"
        >
          Disable AI
        </button>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
        <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Do not submit passwords, API keys, or private credentials. Treat AI responses as suggestions and verify before using in production.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Explicit Context Picker */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>Attach Workspace Context (max 5)</span>
            <span className="tabular-nums text-slate-500">{attachedIds.length}/5</span>
          </div>
          {availableContext.length === 0 ? (
            <p className="text-xs text-slate-500">
              No snippets, notes, or errors in your workspace yet. You can still ask general questions.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-1.5">
              {availableContext.map((item) => {
                const checked = attachedIds.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={`flex items-start gap-2 rounded-lg border p-2 text-xs cursor-pointer ${
                      checked
                        ? 'border-indigo-500 bg-indigo-600/10'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAttach(item.id)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{item.title}</div>
                      <div className="text-[11px] text-slate-500">{item.type}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Prompt & Response */}
        <div className="lg:col-span-8 space-y-4">
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-3"
          >
            <div className="flex flex-wrap gap-1.5">
              {QUICK_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setActionMode(m.id);
                    if (!prompt.trim()) setPrompt(m.prompt);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer ${
                    actionMode === m.id
                      ? 'bg-indigo-600 text-white'
                      : 'border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="dev-ai-model" className="text-xs font-medium shrink-0">AI model</label>
              <select
                id="dev-ai-model"
                value={selectedModel}
                onChange={(event) => setSelectedModel(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] px-3 py-2 text-xs"
              >
                {(['gemini', 'openrouter'] as const).map((provider) => {
                  const providerModels = modelCatalog.models.filter((item) => item.provider === provider);
                  if (providerModels.length === 0) return null;
                  const label = provider === 'gemini' ? 'Gemini · online' : 'OpenRouter · online live free catalog';
                  return (
                    <optgroup key={provider} label={label}>
                      {providerModels.map((item) => (
                        <option key={`${item.provider}::${item.id}`} value={`${item.provider}::${item.id}`}>
                          {item.name}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              <button
                type="button"
                onClick={() => void refreshModels()}
                disabled={catalogLoading}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${catalogLoading ? 'animate-spin' : ''}`} />
                Refresh models
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              {modelCatalog.providers?.openrouter?.freeModelCount
                ? `${modelCatalog.providers.openrouter.freeModelCount} OpenRouter models currently report zero input and output prices; catalog availability changes.`
                : 'No free OpenRouter models were returned right now.'}{' '}
              These are online services and require internet. A provider account and API key may be needed; free availability or usage is not guaranteed.
            </p>
            <textarea
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask Dev AI about your attached snippet, note, error, SQL query, or regex…"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] p-3 text-xs focus:border-indigo-500 focus:outline-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {attachedIds.length > 0
                  ? `${attachedIds.length} item(s) will be sent with this prompt`
                  : 'No workspace items attached'}
              </span>
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-60 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Generating…' : 'Send to Dev AI'}</span>
              </button>
            </div>
          </form>

          {errorMsg && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-600 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          {reply && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs font-mono text-slate-500">Model: {replyModel || 'Gemini'}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(reply);
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1500);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-xs cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                  <button
                    type="button"
                    onClick={saveReplyToNotes}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white cursor-pointer"
                  >
                    <FilePlus2 className="w-3.5 h-3.5" />
                    <span>Save to DevNotes</span>
                  </button>
                </div>
              </div>
              <div
                className="devdesk-prose text-slate-800 dark:text-slate-200"
                dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(reply) }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
