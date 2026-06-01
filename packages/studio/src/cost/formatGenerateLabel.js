/**
 * @param {number | null | undefined} usd
 * @param {{ approximate?: boolean }} [opts]
 * @returns {string | null}
 */
export function formatCostUsd(usd, opts = {}) {
  if (usd == null || !Number.isFinite(usd) || usd <= 0) return null;
  const prefix = opts.approximate ? '~' : '';
  if (usd < 0.01) return `${prefix}<$0.01`;
  return `${prefix}$${usd.toFixed(2)}`;
}

/**
 * @typedef {'muapi' | 'runware-estimate' | null} CostSource
 */

/**
 * @param {{
 *   generating?: boolean,
 *   generateError?: string | null,
 *   uploadPhase?: string | null,
 *   unitCostUsd?: number | null,
 *   batchSize?: number,
 *   source?: CostSource,
 *   isLoadingCost?: boolean,
 *   primaryLabel?: string,
 * }} opts
 * @returns {{
 *   primary: string,
 *   secondary: string | null,
 *   ariaLabel: string,
 *   tooltip: string | null,
 * }}
 */
export function formatGenerateButtonLabels(opts = {}) {
  const {
    generating = false,
    generateError = null,
    uploadPhase = null,
    unitCostUsd = null,
    batchSize = 1,
    source = null,
    isLoadingCost = false,
    primaryLabel = 'Generate',
  } = opts;

  if (generating) {
    return {
      primary: uploadPhase || 'Generating…',
      secondary: null,
      ariaLabel: 'Generating',
      tooltip: null,
    };
  }

  if (generateError) {
    return {
      primary: `Error: ${generateError}`,
      secondary: null,
      ariaLabel: `Generation error: ${generateError}`,
      tooltip: null,
    };
  }

  const batch = Math.max(1, Number(batchSize) || 1);
  const total =
    unitCostUsd != null && Number.isFinite(unitCostUsd)
      ? Math.round(unitCostUsd * batch * 100) / 100
      : null;

  const secondary = isLoadingCost
    ? '···'
    : formatCostUsd(total, { approximate: source === 'runware-estimate' });

  let tooltip = null;
  if (source === 'muapi') tooltip = 'Quoted by Muapi';
  else if (source === 'runware-estimate') tooltip = 'Estimated from Runware catalog (approx.)';
  else if (!secondary && !isLoadingCost) tooltip = 'Price unavailable';

  let ariaLabel = primaryLabel;
  if (secondary && secondary !== '···') {
    const kind = source === 'runware-estimate' ? 'estimated' : 'quoted';
    ariaLabel = `${primaryLabel}, ${kind} cost ${secondary.replace('~', '')}`;
  }

  return {
    primary: primaryLabel,
    secondary,
    ariaLabel,
    tooltip,
  };
}
