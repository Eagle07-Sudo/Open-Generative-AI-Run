'use client';

import { normalizeImageTier } from '../providers/runwareImageTier.js';

const TIER_PX = {
  '1k': '1024px',
  '2k': '2048px',
  '4k': '4096px',
};

/**
 * @param {string} tier
 */
export function formatTierChipLabel(tier) {
  const n = normalizeImageTier(tier);
  if (n === '1k') return '1K';
  if (n === '2k') return '2K';
  if (n === '4k') return '4K';
  return String(tier);
}

/**
 * Resolution tier dropdown with pixel subtitles (GPT Image 2 style).
 * @param {{
 *   title?: string,
 *   options: string[],
 *   selected: string,
 *   onSelect: (val: string) => void,
 *   onClose: () => void,
 * }}
 */
export default function TierOptionDropdown({
  title = 'Select resolution',
  options,
  selected,
  onSelect,
  onClose,
}) {
  const normSelected = normalizeImageTier(selected);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div className="text-xs font-bold text-white/20 border-b border-white/[0.03] mb-2 px-1">
        {title}
      </div>
      <div className="flex flex-col gap-0.5">
        {options.map((tier) => {
          const norm = normalizeImageTier(tier);
          const active = norm === normSelected;
          return (
            <button
              key={tier}
              type="button"
              className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-white/5 rounded-md transition-all text-left w-full"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(tier);
                onClose();
              }}
            >
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white/90">{formatTierChipLabel(tier)}</span>
                <span className="text-[10px] text-white/40">{TIER_PX[norm] || ''}</span>
              </div>
              {active ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <span className="w-3.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
