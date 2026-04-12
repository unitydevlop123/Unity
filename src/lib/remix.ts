/**
 * Remix — local encode/decode for shareable chat codes.
 *
 * Code format: UnityDev-<6char>-<base64url JSON payload>
 * Stored in localStorage for same-device import without a backend.
 *
 * Usage tracking:
 *   remix_payload_<id>  → full RemixPayload JSON
 *   remix_uses_<id>     → current use count (integer string)
 *   remix_used_<id>     → comma-separated list of chat IDs that used this code
 */

import { Chat } from '@/types';

const PREFIX_PAYLOAD = 'remix_payload_';
const PREFIX_USES    = 'remix_uses_';
const PREFIX_USED    = 'remix_used_';
const CODE_PREFIX    = 'UnityDev';

export interface RemixPayload {
  id: string;
  chat: Chat;
  createdAt: number;
  expiresAt: number | null;
  maxUses: number | null; // null = unlimited
}

// ── Helpers ────────────────────────────────────────────────────

function generateId(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function toBase64Url(str: string): string {
  return btoa(encodeURIComponent(str))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4;
  const fixed = pad ? padded + '===='.slice(pad) : padded;
  return decodeURIComponent(atob(fixed));
}

// ── Expiry helpers ──────────────────────────────────────────────

export type RemixExpiry = '24h' | '7d' | 'never';

function expiryMs(expiry: RemixExpiry): number | null {
  if (expiry === '24h') return Date.now() + 24 * 60 * 60 * 1000;
  if (expiry === '7d')  return Date.now() + 7 * 24 * 60 * 60 * 1000;
  return null;
}

// ── Usage tracking helpers ──────────────────────────────────────

/** Get how many times a code has been used on this device */
function getUseCount(id: string): number {
  try {
    return parseInt(localStorage.getItem(`${PREFIX_USES}${id}`) ?? '0', 10) || 0;
  } catch { return 0; }
}

/** Increment the use count for a code, recording which chat ID used it */
function recordUse(id: string, chatId: string): void {
  try {
    const count = getUseCount(id) + 1;
    localStorage.setItem(`${PREFIX_USES}${id}`, String(count));
    const prev = localStorage.getItem(`${PREFIX_USED}${id}`) ?? '';
    const list = prev ? prev.split(',') : [];
    if (!list.includes(chatId)) {
      list.push(chatId);
      localStorage.setItem(`${PREFIX_USED}${id}`, list.join(','));
    }
  } catch { /* storage full */ }
}

/** Check if a specific chat has already been imported via this code */
function chatAlreadyUsedCode(id: string, activeChatIds: string[]): boolean {
  try {
    const raw = localStorage.getItem(`${PREFIX_USED}${id}`) ?? '';
    const used = raw ? raw.split(',') : [];
    return used.some(uid => activeChatIds.includes(uid));
  } catch { return false; }
}

// ── Create a remix code ─────────────────────────────────────────

export function createRemixCode(
  chat: Chat,
  expiry: RemixExpiry = '7d',
  maxUses: number | null = null
): string {
  const id = generateId(6);
  const payload: RemixPayload = {
    id,
    chat,
    createdAt: Date.now(),
    expiresAt: expiryMs(expiry),
    maxUses,
  };

  const encoded = toBase64Url(JSON.stringify(payload));
  // Code always starts with "UnityDev-"
  const code = `${CODE_PREFIX}-${id}-${encoded}`;

  try {
    localStorage.setItem(`${PREFIX_PAYLOAD}${id}`, JSON.stringify(payload));
    localStorage.setItem(`${PREFIX_USES}${id}`, '0');
  } catch { /* storage full */ }

  return code;
}

// ── Decode a remix code ─────────────────────────────────────────

export interface RemixResult {
  ok: boolean;
  chat?: Chat;
  codeId?: string;
  error?: string;
}

/**
 * @param rawCode     The full remix code string pasted by the user
 * @param existingChatIds  All current chat IDs — used to detect "already remixed" on this device
 */
export function decodeRemixCode(
  rawCode: string,
  existingChatIds: string[] = []
): RemixResult {
  const trimmed = rawCode.trim();

  // Must start with "UnityDev-"
  if (!trimmed.toUpperCase().startsWith(`${CODE_PREFIX.toUpperCase()}-`)) {
    return { ok: false, error: 'Invalid Remix code. Codes must start with "UnityDev-".' };
  }

  // Parse: UnityDev-<6char>-<encoded>
  const parts = trimmed.split('-');
  // parts[0] = "UnityDev", parts[1] = 6-char ID, parts[2..] = encoded (may contain '-')
  if (parts.length < 3) {
    return { ok: false, error: 'Invalid Remix code format.' };
  }

  const id = parts[1].toUpperCase();
  const encoded = parts.slice(2).join('-');

  // ── Try local storage first ────────────────────────────────
  const stored = localStorage.getItem(`${PREFIX_PAYLOAD}${id}`);
  let payload: RemixPayload | null = null;

  if (stored) {
    try { payload = JSON.parse(stored); } catch { /* fall through */ }
  }

  // ── Fall back to decoding the encoded segment ──────────────
  if (!payload && encoded) {
    try {
      const json = fromBase64Url(encoded);
      payload = JSON.parse(json);
    } catch {
      return { ok: false, error: 'Could not read Remix code. Make sure you copied the full code.' };
    }
  }

  if (!payload) {
    return { ok: false, error: 'Invalid or unreadable Remix code.' };
  }

  // ── Expiry check ───────────────────────────────────────────
  if (payload.expiresAt && Date.now() > payload.expiresAt) {
    try { localStorage.removeItem(`${PREFIX_PAYLOAD}${id}`); } catch { /* ignore */ }
    return { ok: false, error: 'This Remix code has expired.' };
  }

  // ── Already-remixed check (same device) ───────────────────
  if (existingChatIds.length > 0 && chatAlreadyUsedCode(id, existingChatIds)) {
    return {
      ok: false,
      error: 'You already imported this Remix code. Delete that chat first to import again.',
    };
  }

  // ── Usage limit check ──────────────────────────────────────
  if (payload.maxUses !== null) {
    const used = getUseCount(id);
    if (used >= payload.maxUses) {
      return {
        ok: false,
        error: `🔥 This creator is popular! Remix limit reached (${payload.maxUses}/${payload.maxUses} uses). Code is now closed.`,
      };
    }
  }

  return { ok: true, chat: payload.chat, codeId: id };
}

/** Call after a successful import to record the use */
export function consumeRemixCode(codeId: string, newChatId: string): void {
  recordUse(codeId, newChatId);
}

// ── My Codes (creator view) ─────────────────────────────────────

export interface MyRemixCode {
  id: string;
  chatTitle: string;
  createdAt: number;
  expiresAt: number | null;
  maxUses: number | null;
  useCount: number;
  usedByIds: string[];
  fullCode: string; // the full UnityDev-ID-encoded string (reconstructed)
}

/**
 * Reads all remix codes that were created on this device from localStorage.
 * Returns them sorted newest-first.
 */
export function getMyRemixCodes(): MyRemixCode[] {
  const codes: MyRemixCode[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(PREFIX_PAYLOAD)) continue;
      const id = key.slice(PREFIX_PAYLOAD.length);
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      let payload: RemixPayload;
      try { payload = JSON.parse(raw); } catch { continue; }

      const useCount = getUseCount(id);
      const usedRaw = localStorage.getItem(`${PREFIX_USED}${id}`) ?? '';
      const usedByIds = usedRaw ? usedRaw.split(',').filter(Boolean) : [];

      // Re-encode the payload to reconstruct the shareable code
      const encoded = toBase64Url(JSON.stringify(payload));
      const fullCode = `${CODE_PREFIX}-${id}-${encoded}`;

      codes.push({
        id,
        chatTitle: payload.chat?.title ?? 'Untitled',
        createdAt: payload.createdAt,
        expiresAt: payload.expiresAt,
        maxUses: payload.maxUses,
        useCount,
        usedByIds,
        fullCode,
      });
    }
  } catch { /* ignore */ }
  return codes.sort((a, b) => b.createdAt - a.createdAt);
}

/** Delete a stored remix code from localStorage. */
export function deleteMyRemixCode(id: string): void {
  try {
    localStorage.removeItem(`${PREFIX_PAYLOAD}${id}`);
    localStorage.removeItem(`${PREFIX_USES}${id}`);
    localStorage.removeItem(`${PREFIX_USED}${id}`);
  } catch { /* ignore */ }
}
