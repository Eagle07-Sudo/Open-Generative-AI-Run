'use client';

import { CONTROL_STRINGS } from '../lib/controlStrings.js';

/**
 * Batch size control: − n/max +
 * @param {{
 *   value: number,
 *   min?: number,
 *   max?: number,
 *   onChange: (n: number) => void,
 *   sizeLabel?: string,
 *   className?: string,
 * }}
 */
export default function BatchSizeStepper({
  value,
  min = 1,
  max = 4,
  onChange,
  sizeLabel = CONTROL_STRINGS.batchSizeLabel,
  className = '',
}) {
  const canDec = value > min;
  const canInc = value < max;

  return (
    <div className={`flex flex-col items-start gap-0.5 ${className}`}>
      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest leading-none">
        {sizeLabel}
      </span>
      <div
        className="flex items-center gap-0 bg-card-bg rounded-md border border-border-subtle overflow-hidden"
        role="group"
        aria-label={`Batch size, ${value} of ${max}`}
      >
        <button
          type="button"
          aria-label="Decrease batch size"
          disabled={!canDec}
          onClick={() => canDec && onChange(value - 1)}
          className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          −
        </button>
        <span className="px-2 min-w-[2.5rem] text-center text-xs font-black tabular-nums" dir="ltr">
          <span className="text-white">{value}</span>
          <span className="text-white/35">/{max}</span>
        </span>
        <button
          type="button"
          aria-label="Increase batch size"
          disabled={!canInc}
          onClick={() => canInc && onChange(value + 1)}
          className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}
