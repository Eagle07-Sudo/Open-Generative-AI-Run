/**
 * Client-side thumbnail for small preview chrome (not for API payloads).
 * @param {File} file
 * @param {import('./studioAssetTypes.js').StudioAssetKind} kind
 * @param {number} [maxSize]
 * @returns {Promise<string>} blob URL
 */
export async function createThumbnailBlobUrl(file, kind, maxSize = 256) {
  if (kind === 'audio') {
    return URL.createObjectURL(file);
  }

  if (kind === 'video' && typeof document !== 'undefined') {
    return videoPosterBlobUrl(file, maxSize);
  }

  if (kind === 'image' && typeof document !== 'undefined') {
    return imageThumbnailBlobUrl(file, maxSize);
  }

  return URL.createObjectURL(file);
}

/**
 * @param {File} file
 * @param {number} maxSize
 */
function imageThumbnailBlobUrl(file, maxSize) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas unsupported');
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(blobUrl);
            if (!blob) {
              resolve(URL.createObjectURL(file));
              return;
            }
            resolve(URL.createObjectURL(blob));
          },
          'image/jpeg',
          0.85,
        );
      } catch (e) {
        URL.revokeObjectURL(blobUrl);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      resolve(URL.createObjectURL(file));
    };
    img.src = blobUrl;
  });
}

/**
 * @param {File} file
 * @param {number} maxSize
 */
function videoPosterBlobUrl(file, maxSize) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const blobUrl = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(blobUrl);
    };

    video.onloadeddata = () => {
      try {
        const scale = Math.min(1, maxSize / Math.max(video.videoWidth, video.videoHeight, 1));
        const w = Math.max(1, Math.round(video.videoWidth * scale));
        const h = Math.max(1, Math.round(video.videoHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          resolve(URL.createObjectURL(file));
          return;
        }
        ctx.drawImage(video, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            cleanup();
            resolve(blob ? URL.createObjectURL(blob) : URL.createObjectURL(file));
          },
          'image/jpeg',
          0.85,
        );
      } catch {
        cleanup();
        resolve(URL.createObjectURL(file));
      }
    };

    video.onerror = () => {
      cleanup();
      resolve(URL.createObjectURL(file));
    };

    video.src = blobUrl;
    video.currentTime = 0.1;
  });
}
