// SECURITY: never log full API keys or Bearer tokens.
const RUNWARE_API = 'https://api.runware.ai/v1';

export const BASE_URL =
  typeof window !== 'undefined' && window.location?.protocol?.startsWith('http')
    ? '/api/runware/v1'
    : RUNWARE_API;

export function notifyAuthRequired(status, detail) {
  if (typeof window === 'undefined') return;
  if (status !== 401 && status !== 403) return;
  window.dispatchEvent(
    new CustomEvent('runware:auth-required', { detail: { status, message: detail } })
  );
}

/**
 * @param {object} [body]
 * @param {string} [fallback]
 * @returns {{ message: string, code?: string }}
 */
const GENERIC_RUNWARE_MESSAGE = /please read documentation|an error has occurred/i;

export function parseRunwareErrorDetails(body, fallback = '') {
  if (body?.errors?.length) {
    const first = body.errors[0];
    const rawMessage = typeof first.message === 'string' ? first.message : '';
    const rawCode = typeof first.code === 'string' ? first.code : undefined;
    let message = rawMessage;
    if (
      (!message || GENERIC_RUNWARE_MESSAGE.test(message)) &&
      rawCode &&
      !GENERIC_RUNWARE_MESSAGE.test(rawCode)
    ) {
      message = rawCode.slice(0, 500);
    } else if (!message) {
      message = rawCode || JSON.stringify(first).slice(0, 240);
    } else if (rawCode && rawCode.length > message.length) {
      message = `${message} — ${rawCode.slice(0, 200)}`;
    }
    const code = rawCode;
    return { message, code };
  }
  if (body?.error) {
    return { message: String(body.error).slice(0, 240) };
  }
  return { message: fallback };
}

/** @param {object} [body] @param {string} [fallback] */
export function parseRunwareError(body, fallback) {
  return parseRunwareErrorDetails(body, fallback).message;
}

/**
 * @param {string} apiKey
 * @param {object[]} tasks
 */
export async function postTasks(apiKey, tasks) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(tasks),
  });

  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    const { message: detail, code } = parseRunwareErrorDetails(body, text.slice(0, 100));
    notifyAuthRequired(response.status, detail);
    const err = new Error(`Runware API failed: ${response.status} - ${detail}`);
    err.status = response.status;
    if (code) err.code = code;
    throw err;
  }

  return body;
}

export function extractImageFromResponse(body, taskUUID) {
  const items = body?.data || [];
  const match =
    items.find((item) => item.taskUUID === taskUUID) ||
    items.find((item) => item.imageURL) ||
    items[0];

  if (!match) {
    throw new Error(parseRunwareError(body, 'No image in Runware response'));
  }

  if (match.error || match.status === 'failed' || match.status === 'error') {
    throw new Error(match.error || match.message || 'Runware generation failed');
  }

  const url = match.imageURL || match.url || match.output?.url;
  if (!url) {
    throw new Error(parseRunwareError(body, 'No image URL in Runware response'));
  }

  const costUsd = typeof match.cost === 'number' && Number.isFinite(match.cost) ? match.cost : undefined;

  const seed =
    typeof match.seed === 'number' && Number.isFinite(match.seed) ? match.seed : undefined;

  return {
    ok: true,
    url,
    id: match.taskUUID || taskUUID,
    costUsd,
    seed,
    providerMeta: match,
  };
}

export function extractVideoFromResponse(body, taskUUID) {
  const items = body?.data || [];
  const match =
    items.find((item) => item.taskUUID === taskUUID) ||
    items.find((item) => item.videoURL) ||
    items[0];

  if (!match) {
    throw new Error(parseRunwareError(body, 'No video in Runware response'));
  }

  const url = match.videoURL || match.url;
  if (!url) {
    throw new Error(parseRunwareError(body, 'No video URL in Runware response'));
  }

  const costUsd = typeof match.cost === 'number' && Number.isFinite(match.cost) ? match.cost : undefined;

  const seed =
    typeof match.seed === 'number' && Number.isFinite(match.seed) ? match.seed : undefined;

  return {
    ok: true,
    url,
    id: match.taskUUID || taskUUID,
    costUsd,
    seed,
    providerMeta: match,
  };
}

/**
 * @param {string} apiKey
 * @param {string} taskUUID
 * @param {(body: object) => { ok: boolean, url?: string, id?: string, costUsd?: number }} extractFn
 */
export async function pollGetResponse(
  apiKey,
  taskUUID,
  extractFn,
  maxAttempts = 60,
  intervalMs = 2000
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const body = await postTasks(apiKey, [{ taskType: 'getResponse', taskUUID }]);
    try {
      return extractFn(body, taskUUID);
    } catch (err) {
      const msg = err.message || '';
      if (
        (msg.includes('No image') || msg.includes('No video') || msg.includes('processing')) &&
        attempt < maxAttempts
      ) {
        continue;
      }
      throw err;
    }
  }
  throw new Error('Runware generation timed out after polling.');
}

export async function pollImageResponse(apiKey, taskUUID) {
  return pollGetResponse(apiKey, taskUUID, extractImageFromResponse);
}

export async function pollVideoResponse(apiKey, taskUUID) {
  return pollGetResponse(apiKey, taskUUID, extractVideoFromResponse);
}
