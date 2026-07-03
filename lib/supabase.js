import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_DWMM_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_DWMM_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const legacySupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

const fallbackUrl = 'https://example.supabase.co';
const fallbackKey = 'public-anon-key-placeholder';

function decodeJwtPayload(token) {
  try {
    const payload = token?.split(".")?.[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoder =
      typeof window === "undefined"
        ? (value) => Buffer.from(value, "base64").toString("utf8")
        : window.atob;
    return JSON.parse(decoder(normalized));
  } catch (error) {
    return null;
  }
}

function getJwtRef(token) {
  return decodeJwtPayload(token)?.ref || null;
}

function getJwtRole(token) {
  return decodeJwtPayload(token)?.role || null;
}

function isPublishableKey(token) {
  return typeof token === "string" && token.startsWith("sb_publishable_");
}

function isPublicSupabaseKey(token) {
  if (!token) return false;
  if (isPublishableKey(token)) return true;
  return getJwtRole(token) === "anon";
}

function getProjectRefFromUrl(url) {
  try {
    return new URL(url).hostname.split(".")[0] || null;
  } catch (error) {
    return null;
  }
}

function selectSupabaseKey() {
  const legacyRef = getJwtRef(legacySupabaseKey);
  const preferredRef = legacyRef || getProjectRefFromUrl(supabaseUrl);
  const safeJwtCandidates = [supabaseAnonKey, supabasePublishableKey, legacySupabaseKey]
    .filter(Boolean)
    .filter(isPublicSupabaseKey);

  const matchingSafeJwt = safeJwtCandidates.find((candidate) => {
    const ref = getJwtRef(candidate);
    return isPublicSupabaseKey(candidate) && ref && preferredRef && ref === preferredRef;
  });
  if (matchingSafeJwt) return matchingSafeJwt;

  if (preferredRef) {
    return null;
  }

  const publishable = safeJwtCandidates.find(isPublishableKey);
  if (publishable) return publishable;
  return safeJwtCandidates[0];
}

const supabaseKey = selectSupabaseKey();
const supabaseKeyRef = getJwtRef(supabaseKey);
const supabaseKeyRole = getJwtRole(supabaseKey);
const legacySupabaseRef = getJwtRef(legacySupabaseKey);
const preferredSupabaseRef = legacySupabaseRef || getProjectRefFromUrl(supabaseUrl);
const effectiveSupabaseUrl =
  preferredSupabaseRef
    ? `https://${preferredSupabaseRef}.supabase.co`
    : supabaseUrl && supabaseKeyRef && !supabaseUrl.includes(`${supabaseKeyRef}.supabase.co`)
    ? `https://${supabaseKeyRef}.supabase.co`
    : supabaseUrl || (supabaseKeyRef ? `https://${supabaseKeyRef}.supabase.co` : undefined);

const canLogServerWarning = typeof window === "undefined";
const warnOnce = (key, message) => {
  if (!canLogServerWarning) return;
  const warningKey = `__dwmm_${key}`;
  if (globalThis[warningKey]) return;
  globalThis[warningKey] = true;
  console.warn(message);
};

if (!effectiveSupabaseUrl || !supabaseKey) {
  warnOnce('supabase_missing_env_warned', 'Supabase environment variables are missing. Using fallback client configuration for build-time execution.');
}

if (supabaseUrl && preferredSupabaseRef && !supabaseUrl.includes(`${preferredSupabaseRef}.supabase.co`)) {
  warnOnce('supabase_mismatch_warned', 'Supabase URL/key project mismatch detected. Using the project URL encoded in the selected Supabase key.');
}

export const supabase = createClient(effectiveSupabaseUrl || fallbackUrl, supabaseKey || fallbackKey);

export function getSupabaseFunctionUrl(functionName) {
  if (!effectiveSupabaseUrl || !functionName) return null;
  return `${effectiveSupabaseUrl}/functions/v1/${functionName}`;
}

export function getSupabasePublicKey() {
  return supabaseKey || null;
}

export function hasUsableSupabasePublicConfig() {
  if (!effectiveSupabaseUrl || !supabaseKey) return false;
  const ref = supabaseKeyRef;
  if (!ref) return isPublishableKey(supabaseKey);
  return effectiveSupabaseUrl.includes(`${ref}.supabase.co`);
}

export function canUseSupabaseRealtime() {
  if (!hasUsableSupabasePublicConfig()) return false;
  return supabaseKeyRole === "anon" || isPublishableKey(supabaseKey);
}

export function getSupabaseBookmarkThumbnailUrl(bookmarkId) {
  const normalizedId = String(bookmarkId || "");
  if (!/^\d+$/.test(normalizedId) || !effectiveSupabaseUrl) return null;
  return `${effectiveSupabaseUrl}/storage/v1/object/public/assets/bookmarks/${normalizedId}/thumbnail.webp`;
}
