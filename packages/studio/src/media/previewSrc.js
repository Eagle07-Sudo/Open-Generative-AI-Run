/** @param {unknown} value */
export function isAssetLabel(value) {
  return typeof value === 'string' && /^(image|video|audio)\d+$/.test(value);
}

/**
 * Resolve a displayable preview URL (blob/https) from asset record, label, or legacy ref.
 * @param {string} studioId
 * @param {{ thumbUrl?: string, previewUrl?: string, label?: string } | null | undefined} asset
 * @param {unknown} urlOrRef
 * @param {(studioId: string, label: string) => { thumbUrl?: string, previewUrl?: string } | undefined} [getAsset]
 */
export function resolvePreviewSrc(studioId, asset, urlOrRef, getAsset) {
  if (asset && typeof asset === 'object') {
    if (typeof asset.thumbUrl === 'string' && asset.thumbUrl) return asset.thumbUrl;
    if (typeof asset.previewUrl === 'string' && asset.previewUrl) return asset.previewUrl;
    if (typeof asset.label === 'string' && getAsset) {
      const a = getAsset(studioId, asset.label);
      if (typeof a?.thumbUrl === 'string' && a.thumbUrl) return a.thumbUrl;
      if (typeof a?.previewUrl === 'string' && a.previewUrl) return a.previewUrl;
    }
  }

  if (typeof urlOrRef !== 'string' || !urlOrRef) return null;

  if (isAssetLabel(urlOrRef) && getAsset) {
    const a = getAsset(studioId, urlOrRef);
    if (typeof a?.thumbUrl === 'string' && a.thumbUrl) return a.thumbUrl;
    if (typeof a?.previewUrl === 'string' && a.previewUrl) return a.previewUrl;
    return null;
  }

  if (
    urlOrRef.startsWith('blob:') ||
    urlOrRef.startsWith('http://') ||
    urlOrRef.startsWith('https://') ||
    urlOrRef.startsWith('data:')
  ) {
    return urlOrRef;
  }

  return null;
}
