/**
 * Transient vs permanent API errors + Runware circuit breaker (stability plan L2).
 */

const RUNWARE_CB_MS = 60_000;
const RUNWARE_FAIL_THRESHOLD = 3;

let runwareFailureStreak = 0;
let runwareCircuitOpenUntil = 0;

/**
 * @param {unknown} err
 * @returns {boolean}
 */
export function isPermanentApiError(err) {
  const status = extractHttpStatus(err);
  if (status === 401 || status === 403 || status === 400 || status === 402) return true;
  if (status === 429) return true;
  const msg = String(err?.message || '').toLowerCase();
  if (msg.includes('missing api key') || msg.includes('not supported')) return true;
  return false;
}

/**
 * @param {unknown} err
 * @returns {boolean}
 */
export function isTransientApiError(err) {
  if (isPermanentApiError(err)) return false;
  const status = extractHttpStatus(err);
  if (status != null && status >= 500) return true;
  if (status === 408) return true;
  const code = err?.code;
  if (code === 'ECONNABORTED' || code === 'ETIMEDOUT' || code === 'ENOTFOUND') return true;
  const msg = String(err?.message || '').toLowerCase();
  if (msg.includes('timeout') || msg.includes('network') || msg.includes('fetch failed')) {
    return true;
  }
  return status == null && err instanceof Error;
}

/**
 * @param {unknown} err
 * @returns {number | undefined}
 */
export function extractHttpStatus(err) {
  const direct = err?.status ?? err?.response?.status ?? err?.cause?.status;
  if (typeof direct === 'number') return direct;
  const msg = String(err?.message || '');
  const m = msg.match(/\b(4\d{2}|5\d{2})\b/);
  return m ? Number(m[1]) : undefined;
}

/**
 * @param {'runware' | 'muapi'} providerId
 * @returns {boolean}
 */
export function isProviderCircuitOpen(providerId) {
  if (providerId !== 'runware') return false;
  return Date.now() < runwareCircuitOpenUntil;
}

/**
 * @param {'runware' | 'muapi'} providerId
 */
export function recordProviderSuccess(providerId) {
  if (providerId !== 'runware') return;
  runwareFailureStreak = 0;
  runwareCircuitOpenUntil = 0;
}

/**
 * @param {'runware' | 'muapi'} providerId
 * @param {unknown} err
 */
export function recordProviderFailure(providerId, err) {
  if (providerId !== 'runware' || !isTransientApiError(err)) return;
  runwareFailureStreak += 1;
  if (runwareFailureStreak >= RUNWARE_FAIL_THRESHOLD) {
    runwareCircuitOpenUntil = Date.now() + RUNWARE_CB_MS;
    runwareFailureStreak = 0;
  }
}

/** @internal test reset */
export function resetRoutingCircuitForTests() {
  runwareFailureStreak = 0;
  runwareCircuitOpenUntil = 0;
}
