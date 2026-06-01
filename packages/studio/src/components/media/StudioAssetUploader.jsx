'use client';

import { useRef, useState } from 'react';
import MediaPreviewThumb from './MediaPreviewThumb.jsx';
import { mentionTagForLabel } from '../../media/studioAssetTypes.js';

/**
 * @param {{
 *   assets: import('../../media/studioAssetTypes.js').StudioAsset[],
 *   maxCount?: number,
 *   accept?: string,
 *   onStage: (file: File) => Promise<import('../../media/studioAssetTypes.js').StudioAsset>,
 *   onRemove: (label: string) => void,
 *   disabled?: boolean,
 *   disabledTitle?: string,
 *   triggerClassName?: string,
 *   children?: React.ReactNode,
 * }}
 */
export default function StudioAssetUploader({
  assets,
  maxCount = 1,
  accept = 'image/*',
  onStage,
  onRemove,
  disabled = false,
  disabledTitle,
  triggerClassName = '',
  children,
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files) => {
    if (!files?.length || disabled) return;
    const room = maxCount - assets.length;
    if (room <= 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files).slice(0, room)) {
        await onStage(file);
      }
    } catch (err) {
      alert(err?.message || 'Failed to add file');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const main = assets[0];

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={maxCount > 1}
        className="hidden"
        disabled={disabled || busy}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        title={disabled ? disabledTitle : main ? mentionTagForLabel(main.label) : 'Add media'}
        disabled={disabled}
        onClick={() => !disabled && inputRef.current?.click()}
        className={triggerClassName}
      >
        {children ? (
          children({ assets, busy, main })
        ) : main ? (
          <div className="relative w-full h-full overflow-hidden rounded-full">
            <MediaPreviewThumb
              asset={main}
              url={main.label || main.thumbUrl}
              kind={main.kind}
              className="w-full h-full"
            />
            {busy && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-4 h-4 border border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <span className="text-white/40 text-lg">+</span>
        )}
      </button>
      {main && !children && (
        <button
          type="button"
          className="sr-only"
          onClick={() => onRemove(main.label)}
          aria-label="Remove"
        />
      )}
    </>
  );
}
