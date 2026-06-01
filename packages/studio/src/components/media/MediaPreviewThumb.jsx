'use client';

import { getStudioAsset } from '../../media/studioAssetRegistry.js';
import { resolvePreviewSrc } from '../../media/previewSrc.js';

/**
 * Small preview chrome — uses thumbUrl (blob), never data: URIs in <img>.
 * @param {{
 *   studioId?: string,
 *   asset?: { thumbUrl?: string, previewUrl?: string, kind?: string, fileName?: string, label?: string },
 *   url?: unknown,
 *   kind?: 'image' | 'video' | 'audio',
 *   className?: string,
 *   alt?: string,
 * }}
 */
export default function MediaPreviewThumb({
  studioId = 'image',
  asset,
  url,
  kind: kindProp,
  className = '',
  alt = '',
}) {
  const kind = asset?.kind || kindProp || 'image';
  const src = resolvePreviewSrc(studioId, asset, url, getStudioAsset);

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-white/5 ${className}`}>
        <span className="text-[8px] text-white/40 uppercase">{kind}</span>
      </div>
    );
  }

  if (typeof src === 'string' && src.startsWith('data:')) {
    return (
      <div
        className={`flex items-center justify-center bg-amber-500/10 ${className}`}
        title="Re-select file"
      >
        <span className="text-[8px] text-amber-400">!</span>
      </div>
    );
  }

  if (kind === 'audio') {
    return (
      <div className={`flex flex-col items-center justify-center bg-primary/10 ${className}`}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
        >
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </div>
    );
  }

  if (kind === 'video') {
    return (
      <video
        src={src}
        className={`object-cover ${className}`}
        muted
        playsInline
        preload="metadata"
        aria-label={alt || asset?.fileName || 'Video preview'}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt || asset?.fileName || 'Preview'}
      className={`object-cover ${className}`}
    />
  );
}
