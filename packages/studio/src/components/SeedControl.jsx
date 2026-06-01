'use client';

import { CONTROL_STRINGS } from '../lib/controlStrings.js';
import { randomSeed } from '../lib/seedControl.js';

const PROMPT_CHIP =
  'flex items-center gap-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.06] rounded-md transition-all border border-white/[0.03] group whitespace-nowrap';

/**
 * @param {{
 *   value: number | null,
 *   onChange: (v: number | null) => void,
 *   disabled?: boolean,
 *   className?: string,
 * }} props
 */
export default function SeedControl({ value, onChange, disabled, className = '' }) {
  const display = value != null && value >= 0 ? String(value) : '';

  return (
    <div
      className={`flex items-center gap-1.5 shrink-0 ${className}`}
      title={CONTROL_STRINGS.seedNextHint}
    >
      <label className="sr-only" htmlFor="studio-seed-input">
        {CONTROL_STRINGS.seed}
      </label>
      <input
        id="studio-seed-input"
        type="number"
        min={0}
        inputMode="numeric"
        disabled={disabled}
        value={display}
        placeholder={CONTROL_STRINGS.seedPlaceholder}
        onChange={(e) => {
          const raw = e.target.value.trim();
          if (!raw) {
            onChange(null);
            return;
          }
          const n = parseInt(raw, 10);
          onChange(Number.isFinite(n) && n >= 0 ? n : null);
        }}
        className="w-[88px] px-2 py-1.5 text-xs font-semibold text-white/80 bg-white/[0.03] border border-white/[0.06] rounded-md focus:outline-none focus:border-primary/40 disabled:opacity-40"
        aria-describedby="studio-seed-hint"
      />
      <button
        type="button"
        disabled={disabled}
        title={CONTROL_STRINGS.seedRandom}
        aria-label={CONTROL_STRINGS.seedRandom}
        onClick={() => onChange(randomSeed())}
        className={`${PROMPT_CHIP} px-2 py-1.5 disabled:opacity-40`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
        </svg>
      </button>
      <span id="studio-seed-hint" className="hidden sm:inline text-[9px] text-white/35 max-w-[120px]">
        {CONTROL_STRINGS.seedNextHint}
      </span>
    </div>
  );
}
