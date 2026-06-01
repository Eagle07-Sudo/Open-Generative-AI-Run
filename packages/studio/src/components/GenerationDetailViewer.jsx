'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CONTROL_STRINGS } from '../lib/controlStrings.js';
import { dispatchStudioRecreate, snapshotFromHistoryEntry } from '../studioRecreate.js';
import { getStudioAsset } from '../media/studioAssetRegistry.js';
import { parseMentionLabels } from '../media/mentionParse.js';

const SKIP_CONTROL_KEYS = new Set(['aspect_ratio', 'quality', 'resolution', 'seed']);

/**
 * @param {{
 *   entry: import('../media/generationHistoryTypes.js').GenerationHistoryEntry,
 *   mediaType?: 'image' | 'video' | 'marketing',
 *   onClose: () => void,
 *   onDownload?: (entry: object) => void,
 *   providerLabel?: (id: string) => string,
 *   extraActions?: React.ReactNode,
 * }} props
 */
export default function GenerationDetailViewer({
  entry,
  mediaType = 'image',
  onClose,
  onDownload,
  providerLabel,
  extraActions,
}) {
  const studioId =
    mediaType === 'video' ? 'video' : mediaType === 'marketing' ? 'marketing' : 'image';
  const snap = snapshotFromHistoryEntry(entry, studioId);
  const isReady = entry.status === 'ready' && entry.url;

  const handleRecreate = () => {
    if (snap) dispatchStudioRecreate(snap);
    onClose();
  };

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [onClose],
  );

  const [portalReady, setPortalReady] = useState(false);
  const prevBodyOverflow = useRef('');

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!portalReady || typeof document === 'undefined') return undefined;
    prevBodyOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevBodyOverflow.current;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [portalReady, handleKeyDown]);

  const refLabels =
    snap?.assetLabels?.length > 0
      ? snap.assetLabels
      : parseMentionLabels(snap?.prompt || entry.prompt || '');

  const controlRows = snap?.controls
    ? Object.entries(snap.controls).filter(([k]) => !SKIP_CONTROL_KEYS.has(k))
    : [];

  const overlay = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 animate-fade-in p-2 md:p-4 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label={CONTROL_STRINGS.generationDetails}
      onClick={onClose}
    >
      <div
        className="flex flex-col md:flex-row w-full max-w-6xl max-h-[95vh] bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 flex items-center justify-center bg-black min-h-[40vh] md:min-h-0 p-2">
          {isReady ? (
            mediaType === 'video' || mediaType === 'marketing' ? (
              <video
                src={entry.url}
                controls
                autoPlay
                className="max-w-full max-h-[70vh] md:max-h-[85vh] rounded-lg object-contain"
              />
            ) : (
              <img
                src={entry.url}
                alt=""
                className="max-w-full max-h-[70vh] md:max-h-[85vh] rounded-lg object-contain"
              />
            )
          ) : (
            <p className="text-white/50 text-sm">{CONTROL_STRINGS.generating}</p>
          )}
        </div>

        <aside className="w-full md:w-[min(100%,320px)] md:border-l border-white/10 flex flex-col max-h-[45vh] md:max-h-[95vh] bg-black/90">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
            <h2 className="text-sm font-semibold text-white">{CONTROL_STRINGS.generationDetails}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10"
              aria-label={CONTROL_STRINGS.close}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-4">
            <section>
              <p className="text-[10px] uppercase tracking-wide text-white/40 mb-1">Prompt</p>
              <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap" dir="auto">
                {entry.prompt || snap?.prompt || '—'}
              </p>
            </section>

            <section>
              <p className="text-[10px] uppercase tracking-wide text-white/40 mb-2">
                {CONTROL_STRINGS.settings}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {entry.model || snap?.modelId ? (
                  <span className="text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20">
                    {String(entry.model || snap?.modelId).replace(/-/g, ' ')}
                  </span>
                ) : null}
                {(entry.providerId || snap?.providerId) && providerLabel ? (
                  <span className="text-[9px] text-foreground-muted uppercase tracking-wide py-0.5">
                    via {providerLabel(entry.providerId || snap?.providerId)}
                  </span>
                ) : null}
                {snap?.controls?.aspect_ratio ? (
                  <span className="text-[10px] text-white/50 px-2 py-0.5 border border-white/10 rounded">
                    {String(snap.controls.aspect_ratio)}
                  </span>
                ) : null}
                {snap?.controls?.resolution ? (
                  <span className="text-[10px] text-white/50 px-2 py-0.5 border border-white/10 rounded">
                    {String(snap.controls.resolution)}
                  </span>
                ) : null}
                {snap?.controls?.quality ? (
                  <span className="text-[10px] text-white/50 px-2 py-0.5 border border-white/10 rounded">
                    {String(snap.controls.quality)}
                  </span>
                ) : null}
                {snap?.controls?.seed != null ? (
                  <span className="text-[10px] text-white/50 px-2 py-0.5 border border-white/10 rounded">
                    seed {String(snap.controls.seed)}
                  </span>
                ) : null}
                {controlRows.map(([k, v]) => (
                  <span
                    key={k}
                    className="text-[10px] text-white/50 px-2 py-0.5 border border-white/10 rounded"
                  >
                    {k}: {String(v)}
                  </span>
                ))}
              </div>
            </section>

            {refLabels.length > 0 ? (
              <section>
                <p className="text-[10px] uppercase tracking-wide text-white/40 mb-2">
                  {CONTROL_STRINGS.references}
                </p>
                <div className="flex flex-wrap gap-2">
                  {refLabels.map((label) => {
                    const asset = getStudioAsset(studioId, label);
                    const src = asset?.thumbUrl || asset?.previewUrl;
                    return (
                      <div
                        key={label}
                        className="w-14 h-14 rounded-md border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center"
                      >
                        {src ? (
                          <img src={src} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[9px] text-white/40">@{label}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>

          <div className="shrink-0 px-4 py-3 border-t border-white/10 flex flex-col gap-2">
            {snap ? (
              <button
                type="button"
                onClick={handleRecreate}
                className="w-full py-2.5 rounded-md bg-primary text-black text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                {CONTROL_STRINGS.recreate}
              </button>
            ) : null}
            {isReady && onDownload ? (
              <button
                type="button"
                onClick={() => onDownload(entry)}
                className="w-full py-2 rounded-md border border-white/15 text-white/80 text-sm hover:bg-white/5"
              >
                {CONTROL_STRINGS.download}
              </button>
            ) : null}
            {extraActions}
          </div>
        </aside>
      </div>
    </div>
  );

  if (!portalReady || typeof document === 'undefined') return null;
  return createPortal(overlay, document.body);
}
