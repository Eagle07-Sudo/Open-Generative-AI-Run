'use client';

import { CONTROL_STRINGS } from '../lib/controlStrings.js';

/**
 * Compact switch for studio prompt bars (e.g. Generate audio).
 * @param {{
 *   checked: boolean,
 *   onChange: (checked: boolean) => void,
 *   label?: string,
 *   statusText?: string,
 *   ariaLabel?: string,
 *   className?: string,
 * }}
 */
export default function StudioToggle({
  checked,
  onChange,
  label = CONTROL_STRINGS.genAudio,
  statusText,
  ariaLabel,
  className = '',
}) {
  const title = ariaLabel || (statusText ? `${label} ${statusText}` : label);
  return (
    <label
      className={`inline-flex items-center gap-2 cursor-pointer select-none ${className}`}
      title={title}
    >
      <span className="text-[10px] font-semibold text-white/60 uppercase tracking-wide whitespace-nowrap">
        {label}
      </span>
      {statusText ? (
        <span className="text-[10px] font-semibold text-white/45 tabular-nums">{statusText}</span>
      ) : null}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel || label}
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full border transition-colors shrink-0 ${
          checked
            ? 'bg-primary/30 border-primary/50'
            : 'bg-white/[0.06] border-white/[0.08]'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-4 bg-primary' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}
