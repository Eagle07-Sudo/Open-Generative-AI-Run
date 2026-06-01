'use client';

import { CONTROL_STRINGS } from '../lib/controlStrings.js';

/**
 * Thumbnail-only gallery card (ADR-012). Metadata + Recreate live in GenerationDetailViewer.
 * @param {{
 *   entry: import('../media/generationHistoryTypes.js').GenerationHistoryEntry,
 *   mediaType?: 'image' | 'video' | 'marketing',
 *   onOpen?: (entry: object) => void,
 *   onDownload?: (entry: object) => void,
 *   onRetry?: (entry: object) => void,
 *   extraActions?: React.ReactNode,
 * }} props
 */
export default function GenerationHistoryCard({
  entry,
  mediaType = 'image',
  onOpen,
  onDownload,
  onRetry,
  extraActions,
}) {
  const isPending = entry.status === 'pending';
  const isFailed = entry.status === 'failed';
  const isReady = entry.status === 'ready' && entry.url;
  const ar = entry.aspect_ratio || entry.snapshot?.controls?.aspect_ratio || '1:1';
  const aspectClass =
    ar === '9:16' || ar === '3:4' ? 'aspect-[9/16]' : ar === '16:9' || ar === '21:9' ? 'aspect-video' : 'aspect-square';

  const openEntry = () => {
    if (isReady && onOpen) onOpen(entry);
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-white/10 bg-[#0a0a0a] shadow-xl hover:border-primary/50 transition-all duration-300">
      <div className={`relative w-full ${aspectClass} bg-black/40`}>
        {isReady ? (
          mediaType === 'video' || mediaType === 'marketing' ? (
            <video
              src={entry.url}
              className="w-full h-full object-cover cursor-pointer"
              muted
              playsInline
              preload="metadata"
              onClick={openEntry}
            />
          ) : (
            <img
              src={entry.url}
              alt=""
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={openEntry}
            />
          )
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-2 p-4"
            role="status"
            aria-live="polite"
            aria-label={isFailed ? CONTROL_STRINGS.generationFailed : CONTROL_STRINGS.generating}
          >
            {isFailed ? (
              <>
                <span className="text-xs font-semibold text-amber-400">{CONTROL_STRINGS.generationFailed}</span>
                <span className="text-[10px] text-white/50 text-center line-clamp-3">{entry.error}</span>
                {onRetry && entry.snapshot ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetry(entry);
                    }}
                    className="mt-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-md bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors"
                    aria-label={CONTROL_STRINGS.retryAria}
                  >
                    {CONTROL_STRINGS.retry}
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <span className="text-xs font-semibold text-primary">{CONTROL_STRINGS.generating}</span>
              </>
            )}
          </div>
        )}

        {isReady && (
          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity pointer-events-none sm:pointer-events-auto">
            {onOpen ? (
              <button
                type="button"
                title={CONTROL_STRINGS.openDetails}
                aria-label={CONTROL_STRINGS.openDetailsAria}
                onClick={(e) => {
                  e.stopPropagation();
                  openEntry();
                }}
                className="pointer-events-auto p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </button>
            ) : null}
            {onDownload ? (
              <button
                type="button"
                title={CONTROL_STRINGS.download}
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(entry);
                }}
                className="pointer-events-auto p-2 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-primary hover:text-black transition-all border border-white/10"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
              </button>
            ) : null}
            {extraActions}
          </div>
        )}
      </div>
    </div>
  );
}
