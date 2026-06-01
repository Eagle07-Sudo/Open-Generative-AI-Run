const RATIO_MAP = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
  '4:3': { width: 1152, height: 896 },
  '3:4': { width: 896, height: 1152 },
  '3:2': { width: 1216, height: 832 },
  '2:3': { width: 832, height: 1216 },
  '21:9': { width: 1536, height: 640 },
};

/**
 * Map aspect ratio string to Runware width/height (multiples of 64).
 * @param {string} [aspectRatio]
 * @returns {{ width: number, height: number }}
 */
export function aspectRatioToRunwareSize(aspectRatio) {
  const mapped = aspectRatio && RATIO_MAP[aspectRatio];
  if (mapped) return { ...mapped };
  return { width: 1024, height: 1024 };
}
