import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { filterFreeOpenRouterModels } from './src/lib/aiModels';

const PORT = 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const DATA_DIR = path.resolve(process.cwd(), '.devdesk-data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

// Session secret from env or secure ephemeral fallback in memory
const SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16
    ? process.env.SESSION_SECRET
    : crypto.randomBytes(32).toString('hex');

interface StoredUser {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  salt: string;
  tokenVersion: number;
  createdAt: string;
}

interface StoredSupportTicket {
  id: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  createdAt: string;
}

interface ServerStore {
  users: StoredUser[];
  workspaces: Record<string, unknown>;
  supportTickets: StoredSupportTicket[];
}

function ensureStoreDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readStore(): ServerStore {
  ensureStoreDir();
  if (!fs.existsSync(STORE_FILE)) {
    return { users: [], workspaces: {}, supportTickets: [] };
  }
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<ServerStore>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      workspaces: parsed.workspaces && typeof parsed.workspaces === 'object' ? parsed.workspaces : {},
      supportTickets: Array.isArray(parsed.supportTickets) ? parsed.supportTickets : [],
    };
  } catch {
    return { users: [], workspaces: {}, supportTickets: [] };
  }
}

function writeStore(store: ServerStore) {
  ensureStoreDir();
  const tmpFile = `${STORE_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmpFile, STORE_FILE);
}

// Simple per-IP sliding window rate limiter
function createRateLimiter(maxRequests: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
    if (recent.length >= maxRequests) {
      res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
      return;
    }
    recent.push(now);
    hits.set(ip, recent);
    next();
  };
}

// Password hashing via scrypt
function hashPassword(password: string, salt?: string) {
  const usedSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, usedSalt, 64).toString('hex');
  return { hash: derived, salt: usedSalt };
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// HMAC-SHA256 stateless signed tokens with server-side tokenVersion revocation
interface TokenPayload {
  sub: string;
  ver: number;
  exp: number;
  jti: string;
}

const revokedTokens = new Set<string>();

function signToken(user: StoredUser): string {
  const payload: TokenPayload = {
    sub: user.id,
    ver: user.tokenVersion,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    jti: crypto.randomUUID(),
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as TokenPayload;
    if (!payload.sub || typeof payload.exp !== 'number' || payload.exp < Date.now()) {
      return null;
    }
    if (revokedTokens.has(payload.jti)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

interface AuthenticatedRequest extends Request {
  authUser?: StoredUser;
  tokenPayload?: TokenPayload;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const token = authHeader.slice(7).trim();
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    return;
  }
  const store = readStore();
  const user = store.users.find((u) => u.id === payload.sub);
  if (!user || user.tokenVersion !== payload.ver) {
    res.status(401).json({ error: 'Session revoked. Please sign in again.' });
    return;
  }
  req.authUser = user;
  req.tokenPayload = payload;
  next();
}

// Strict SSRF IP check for API Studio proxy
function isPrivateOrReservedIp(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (net.isIPv4(normalized)) {
    const parts = normalized.split('.').map(Number);
    const [a, b] = parts;
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // 127.0.0.0/8 loopback
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
    if (a >= 224) return true; // multicast / reserved
    return false;
  }
  if (net.isIPv6(normalized)) {
    if (normalized === '::1' || normalized === '::') return true;
    if (normalized.startsWith('fe80:') || normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    if (normalized.startsWith('::ffff:')) {
      const mapped = normalized.slice(7);
      if (net.isIPv4(mapped)) return isPrivateOrReservedIp(mapped);
    }
    return false;
  }
  return true;
}

async function validateExternalUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL format.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS protocols are permitted.');
  }
  const hostname = parsed.hostname.toLowerCase();
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    throw new Error('Local and internal hostnames are blocked for security.');
  }
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      throw new Error('Private, loopback, and metadata IP ranges are blocked.');
    }
    return parsed;
  }
  const addresses = await dns.lookup(hostname, { all: true });
  if (!addresses.length) {
    throw new Error('Hostname could not be resolved.');
  }
  for (const addr of addresses) {
    if (isPrivateOrReservedIp(addr.address)) {
      throw new Error('Target resolves to a private or reserved IP address.');
    }
  }
  return parsed;
}

function getGeminiClient(apiKey = process.env.GEMINI_API_KEY): GoogleGenAI | null {
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 30_000,
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface AiModel {
  id: string;
  name: string;
  provider: 'gemini' | 'openrouter';
}

let openRouterModelsCache: { models: ReturnType<typeof filterFreeOpenRouterModels>; expiresAt: number } | null = null;

async function getOpenRouterFreeModels() {
  if (openRouterModelsCache && openRouterModelsCache.expiresAt > Date.now()) {
    return openRouterModelsCache.models;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Accept: 'application/json' },
      redirect: 'error',
      signal: controller.signal,
    });
    if (!response.ok) return [];
    const models = filterFreeOpenRouterModels(await response.json());
    openRouterModelsCache = { models, expiresAt: Date.now() + 10 * 60_000 };
    return models;
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '4mb' }));

  const authLimiter = createRateLimiter(20, 60_000);
  const aiLimiter = createRateLimiter(20, 60_000);
  const proxyLimiter = createRateLimiter(30, 60_000);

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, version: '1.0.0', aiConfigured: !!getGeminiClient() });
  });

  // Auth routes
  app.post('/api/auth/register', authLimiter, (req, res) => {
    const { email, password, displayName } = req.body ?? {};
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanName =
      typeof displayName === 'string' && displayName.trim()
        ? displayName.trim().slice(0, 60)
        : cleanEmail.split('@')[0];

    const store = readStore();
    if (store.users.some((u) => u.email === cleanEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const { hash, salt } = hashPassword(password);
    const user: StoredUser = {
      id: crypto.randomUUID(),
      email: cleanEmail,
      displayName: cleanName,
      passwordHash: hash,
      salt,
      tokenVersion: 1,
      createdAt: new Date().toISOString(),
    };
    store.users.push(user);
    writeStore(store);

    const token = signToken(user);
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
      },
    });
  });

  app.post('/api/auth/login', authLimiter, (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    const store = readStore();
    const user = store.users.find((u) => u.email === cleanEmail);
    if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
      },
    });
  });

  app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res) => {
    if (req.tokenPayload?.jti) {
      revokedTokens.add(req.tokenPayload.jti);
    }
    res.json({ ok: true });
  });

  app.post('/api/auth/logout-all', requireAuth, (req: AuthenticatedRequest, res) => {
    const store = readStore();
    const user = store.users.find((u) => u.id === req.authUser!.id);
    if (user) {
      user.tokenVersion += 1;
      writeStore(store);
    }
    res.json({ ok: true });
  });

  app.post('/api/auth/change-password', requireAuth, (req: AuthenticatedRequest, res) => {
    const { currentPassword, newPassword } = req.body ?? {};
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters.' });
      return;
    }
    const store = readStore();
    const user = store.users.find((u) => u.id === req.authUser!.id);
    if (!user || !verifyPassword(currentPassword, user.salt, user.passwordHash)) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }
    const { hash, salt } = hashPassword(newPassword);
    user.passwordHash = hash;
    user.salt = salt;
    user.tokenVersion += 1;
    writeStore(store);
    const token = signToken(user);
    res.json({ ok: true, token });
  });

  app.delete('/api/auth/account', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.authUser!.id;
    const store = readStore();
    store.users = store.users.filter((u) => u.id !== userId);
    delete store.workspaces[userId];
    writeStore(store);
    res.json({ ok: true });
  });

  // Cloud workspace sync endpoints (authenticated, owner-scoped)
  app.get('/api/sync/pull', requireAuth, (req: AuthenticatedRequest, res) => {
    const store = readStore();
    const snapshot = store.workspaces[req.authUser!.id] || null;
    res.json({ snapshot });
  });

  app.post('/api/sync/push', requireAuth, (req: AuthenticatedRequest, res) => {
    const { snapshot } = req.body ?? {};
    if (!snapshot || typeof snapshot !== 'object') {
      res.status(400).json({ error: 'Valid workspace snapshot is required.' });
      return;
    }
    const store = readStore();
    store.workspaces[req.authUser!.id] = {
      ...snapshot,
      syncedAt: new Date().toISOString(),
    };
    writeStore(store);
    res.json({ ok: true, syncedAt: new Date().toISOString() });
  });

  // SSRF-protected API Studio proxy
  app.post('/api/proxy', proxyLimiter, async (req, res) => {
    const { url, method, headers, body } = req.body ?? {};
    if (typeof url !== 'string' || !url.trim()) {
      res.status(400).json({ error: 'Target URL is required.' });
      return;
    }
    const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    const upperMethod = typeof method === 'string' ? method.toUpperCase() : 'GET';
    if (!allowedMethods.includes(upperMethod)) {
      res.status(400).json({ error: 'Unsupported HTTP method.' });
      return;
    }

    let targetUrl: URL;
    try {
      targetUrl = await validateExternalUrl(url.trim());
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Blocked URL.' });
      return;
    }

    const safeHeaders: Record<string, string> = {};
    if (headers && typeof headers === 'object') {
      for (const [k, v] of Object.entries(headers as Record<string, unknown>)) {
        const lower = k.toLowerCase();
        if (['host', 'connection', 'content-length', 'cookie'].includes(lower)) continue;
        if (typeof v === 'string') {
          safeHeaders[k] = v;
        }
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const started = Date.now();

    try {
      const upstream = await fetch(targetUrl.toString(), {
        method: upperMethod,
        headers: safeHeaders,
        body: ['POST', 'PUT', 'PATCH'].includes(upperMethod) && typeof body === 'string' && body.length > 0 ? body : undefined,
        redirect: 'manual',
        signal: controller.signal,
      });

      const buffer = await upstream.arrayBuffer();
      if (buffer.byteLength > 2 * 1024 * 1024) {
        res.status(413).json({ error: 'Upstream response exceeded 2MB safety limit.' });
        return;
      }

      const responseHeaders: Record<string, string> = {};
      upstream.headers.forEach((val, key) => {
        responseHeaders[key] = val;
      });

      const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
      res.json({
        status: upstream.status,
        statusText: upstream.statusText,
        durationMs: Date.now() - started,
        sizeBytes: buffer.byteLength,
        headers: responseHeaders,
        body: text,
      });
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error && err.name === 'AbortError'
          ? 'Request timed out after 10 seconds.'
          : err instanceof Error
            ? err.message
            : 'Network request failed.',
      });
    } finally {
      clearTimeout(timeout);
    }
  });

  app.get('/api/ai/models', async (_req, res) => {
    const openRouterModels = await getOpenRouterFreeModels();
    const models: AiModel[] = [
      { id: 'gemini-4-hydrogen', name: 'Gemini (server or personal key)', provider: 'gemini' },
      ...openRouterModels.map((model) => ({
        id: model.id,
        name: model.name,
        provider: 'openrouter' as const,
      })),
    ];
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      models,
      providers: {
        gemini: { serverKeyConfigured: !!getGeminiClient() },
        openrouter: {
          freeModelCount: openRouterModels.length,
          serverKeyConfigured: Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'MY_OPENROUTER_API_KEY'),
        },
      },
    });
  });

  // Server-side Dev AI endpoint; provider credentials are only used for the current request.
  app.post('/api/ai/assist', aiLimiter, async (req, res) => {
    const { action, prompt, selectedContext, provider = 'gemini', model, apiKey } = req.body ?? {};
    if (typeof prompt !== 'string' || !prompt.trim()) {
      res.status(400).json({ error: 'Please enter a prompt or question.' });
      return;
    }
    if (prompt.length > 12000) {
      res.status(400).json({ error: 'Prompt exceeds maximum length (12,000 characters).' });
      return;
    }
    if (!['gemini', 'openrouter'].includes(provider)) {
      res.status(400).json({ error: 'Choose a supported AI provider.' });
      return;
    }
    if (typeof model !== 'string' || model.length < 1 || model.length > 180) {
      res.status(400).json({ error: 'Choose an available AI model first.' });
      return;
    }
    if (apiKey !== undefined && (typeof apiKey !== 'string' || apiKey.length > 4096)) {
      res.status(400).json({ error: 'The provider key is invalid.' });
      return;
    }

    const contextBlocks: string[] = [];
    if (Array.isArray(selectedContext)) {
      for (const item of selectedContext.slice(0, 5)) {
        if (item && typeof item.title === 'string' && typeof item.content === 'string') {
          contextBlocks.push(`--- [${String(item.type || 'context').toUpperCase()}] ${item.title.slice(0, 120)} ---\n${item.content.slice(0, 4000)}`);
        }
      }
    }

    const systemInstruction = [
      'You are Dev AI inside the DevDesk developer workspace.',
      'Provide concise, accurate, practical software engineering guidance using clean Markdown.',
      'Never ask for or repeat secrets/API keys. Remind the user to verify code and suggestions before production use.',
      action ? `Requested task mode: ${String(action).slice(0, 60)}.` : '',
    ]
      .filter(Boolean)
      .join(' ');

    const fullPrompt =
      contextBlocks.length > 0
        ? `User-selected workspace context:\n\n${contextBlocks.join('\n\n')}\n\nUser request:\n${prompt.trim()}`
        : prompt.trim();

    try {
      let reply = 'No response text was returned.';
      if (provider === 'gemini') {
        if (model !== 'gemini-4-hydrogen') {
          res.status(400).json({ error: 'That Gemini model is not available.' });
          return;
        }
        const ai = getGeminiClient(typeof apiKey === 'string' && apiKey.trim() ? apiKey.trim() : undefined);
        if (!ai) {
          res.status(503).json({
            error: 'Gemini needs a key. Add one in Settings > AI Providers, or configure GEMINI_API_KEY on the server.',
          });
          return;
        }
        const response = await ai.models.generateContent({
          model,
          contents: fullPrompt,
          config: { systemInstruction },
        });
        reply = response.text ?? 'No response text was returned.';
      } else if (provider === 'openrouter') {
        const currentModels = await getOpenRouterFreeModels();
        if (!currentModels.some((entry) => entry.id === model)) {
          res.status(400).json({ error: 'That model is no longer listed as free. Refresh the model list and choose another.' });
          return;
        }
        const key = typeof apiKey === 'string' && apiKey.trim() ? apiKey.trim() : process.env.OPENROUTER_API_KEY;
        if (!key || key === 'MY_OPENROUTER_API_KEY') {
          res.status(503).json({
            error: 'OpenRouter needs an API key. Create a key at openrouter.ai and add it in Settings > AI Providers.',
          });
          return;
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30_000);
        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: fullPrompt },
              ],
            }),
            redirect: 'error',
            signal: controller.signal,
          });
          if (!response.ok) {
            res.status(502).json({
              error: response.status === 401 || response.status === 403
                ? 'OpenRouter rejected this key. Check it in Settings > AI Providers.'
                : 'OpenRouter could not complete the request. The free model may be busy or unavailable; try another model.',
            });
            return;
          }
          const data = (await response.json()) as { choices?: Array<{ message?: { content?: unknown } }> };
          const content = data.choices?.[0]?.message?.content;
          reply = typeof content === 'string' ? content : 'No response text was returned.';
        } finally {
          clearTimeout(timeout);
        }
      }

      res.json({ reply, model });
    } catch (err) {
      const timedOut = err instanceof Error && err.name === 'AbortError';
      res.status(502).json({
        error: timedOut
          ? 'The AI provider took too long to respond. Try again or choose another model.'
          : 'The AI provider could not complete the request. Check its setup and try again.',
      });
    }
  });

  // Support / feedback submission endpoint
  app.post('/api/support', authLimiter, (req, res) => {
    const { email, category, subject, message } = req.body ?? {};
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (typeof subject !== 'string' || subject.trim().length < 3) {
      res.status(400).json({ error: 'Please provide a brief subject.' });
      return;
    }
    if (typeof message !== 'string' || message.trim().length < 10) {
      res.status(400).json({ error: 'Please describe your bug report or request (at least 10 characters).' });
      return;
    }
    const store = readStore();
    const ticket: StoredSupportTicket = {
      id: crypto.randomUUID(),
      email: email.trim().toLowerCase(),
      category: typeof category === 'string' ? category.slice(0, 40) : 'general',
      subject: subject.trim().slice(0, 140),
      message: message.trim().slice(0, 4000),
      createdAt: new Date().toISOString(),
    };
    store.supportTickets.push(ticket);
    writeStore(store);
    res.status(201).json({ ok: true, ticketId: ticket.id });
  });

  // 1-click full project source archive download
  app.get('/DevDesk-Full-Project.zip', (_req, res) => {
    const zipPath = path.resolve(process.cwd(), '.devdesk-archive', 'DevDesk-Full-Project.zip');
    if (!fs.existsSync(zipPath)) {
      res.status(404).json({ error: 'Project archive not found.' });
      return;
    }
    res.download(zipPath, 'DevDesk-Full-Project.zip');
  });

  if (!IS_PROD) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DevDesk server running on http://0.0.0.0:${PORT} (${IS_PROD ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start DevDesk server:', err);
  process.exit(1);
});
