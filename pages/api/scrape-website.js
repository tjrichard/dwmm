const SCRAPE_TIMEOUT_MS = 60000;

function decodeJwtPayload(token) {
  try {
    const payload = token?.split('.')?.[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(normalized, 'base64').toString('utf8'));
  } catch (error) {
    return null;
  }
}

function getProjectUrlFromKey(token) {
  const ref = decodeJwtPayload(token)?.ref;
  return ref ? `https://${ref}.supabase.co` : null;
}

function getScrapeFunctionUrl(functionName) {
  const projectUrl =
    process.env.SCRAPE_WEBSITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_DWMM_SUPABASE_URL ||
    getProjectUrlFromKey(process.env.NEXT_PUBLIC_SUPABASE_KEY) ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!projectUrl || !functionName) return null;
  return `${projectUrl.replace(/\/$/, '')}/functions/v1/${functionName}`;
}

function getScrapeFunctionKey() {
  return (
    process.env.SCRAPE_WEBSITE_SUPABASE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_DWMM_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_KEY ||
    null
  );
}

function normalizeSubmittedUrl(value) {
  const trimmedUrl = String(value || '').trim();
  if (!trimmedUrl) return null;

  try {
    const parsedUrl = new URL(trimmedUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) return null;
    return parsedUrl.toString();
  } catch (error) {
    return null;
  }
}

function parseJsonPayload(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch (error) {
    return { message: text };
  }
}

function getPayloadMessage(payload) {
  if (!payload) return null;
  if (typeof payload.error === 'string') return payload.error;
  if (payload.error?.message) return payload.error.message;
  if (typeof payload.message === 'string') return payload.message;
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = normalizeSubmittedUrl(req.body?.url);
  if (!url) {
    return res.status(400).json({ error: 'Valid URL is required' });
  }

  const functionUrl = getScrapeFunctionUrl('scrape-website');
  const functionKey = getScrapeFunctionKey();

  if (!functionUrl || !functionKey) {
    return res.status(500).json({ error: 'Supabase function configuration is missing.' });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: functionKey,
        Authorization: `Bearer ${functionKey}`,
      },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });

    const payload = parseJsonPayload(await response.text());
    if (!response.ok) {
      return res.status(response.status).json({
        error: getPayloadMessage(payload) || `Edge Function failed with ${response.status}`,
      });
    }

    return res.status(200).json(payload || {});
  } catch (error) {
    if (error?.name === 'AbortError') {
      return res.status(504).json({
        error: '스크래핑 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
      });
    }

    return res.status(502).json({
      error: error?.message || 'Failed to call scrape function.',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
