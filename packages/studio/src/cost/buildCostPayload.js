/**
 * Build Muapi calculate_dynamic_cost payload (metadata only, no raw files).
 * @param {Record<string, unknown>} params
 * @returns {Record<string, unknown>}
 */
export function buildCostPayload(params = {}) {
  const out = {};
  const keys = [
    'model',
    'prompt',
    'aspect_ratio',
    'duration',
    'resolution',
    'quality',
    'mode',
    'name',
    'images_list',
    'image_url',
    'video_url',
    'request_id',
  ];
  for (const k of keys) {
    if (params[k] !== undefined && params[k] !== null && params[k] !== '') {
      out[k] = params[k];
    }
  }
  if (Array.isArray(out.images_list)) {
    out.images_list = out.images_list.map((x) =>
      typeof x === 'string' && (x.startsWith('blob:') || x.startsWith('data:'))
        ? '[staged]'
        : x,
    );
  }
  if (typeof out.image_url === 'string' && (out.image_url.startsWith('blob:') || out.image_url.startsWith('data:'))) {
    out.image_url = '[staged]';
  }
  return out;
}
