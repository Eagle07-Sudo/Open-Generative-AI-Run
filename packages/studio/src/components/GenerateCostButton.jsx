'use client';

import { formatGenerateButtonLabels } from '../cost/formatGenerateLabel.js';

/**
 * @param {{
 *   onClick: () => void,
 *   disabled?: boolean,
 *   generating?: boolean,
 *   generateError?: string | null,
 *   uploadPhase?: string | null,
 *   unitCostUsd?: number | null,
 *   batchSize?: number,
 *   source?: import('../cost/resolveGenerationCost.js').CostSource | null,
 *   isLoadingCost?: boolean,
 *   className?: string,
 *   primaryLabel?: string,
 * }}
 */
export default function GenerateCostButton({
  onClick,
  disabled = false,
  generating = false,
  generateError = null,
  uploadPhase = null,
  unitCostUsd = null,
  batchSize = 1,
  source = null,
  isLoadingCost = false,
  className = '',
  primaryLabel = 'Generate',
}) {
  const labels = formatGenerateButtonLabels({
    generating,
    generateError,
    uploadPhase,
    unitCostUsd,
    batchSize,
    source,
    isLoadingCost,
    primaryLabel,
  });

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={labels.tooltip || undefined}
      aria-label={labels.ariaLabel}
      className={
        className ||
        'bg-primary text-black px-4 py-2 rounded-md font-medium text-sm hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-0.5 w-full sm:w-auto min-w-[100px] shadow-lg shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed z-10'
      }
    >
      <span className="leading-tight">{labels.primary}</span>
      {labels.secondary ? (
        <span
          className={`text-[10px] font-semibold leading-none ${
            isLoadingCost ? 'opacity-60 animate-pulse' : 'opacity-80'
          }`}
          dir="ltr"
        >
          {labels.secondary}
        </span>
      ) : null}
    </button>
  );
}
