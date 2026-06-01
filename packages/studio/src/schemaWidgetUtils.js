/** Schema-driven widget selection (ADR-008 / ADR-012). */

const TIER_VALUES = new Set(['1k', '2k', '4k']);

/** Fields rendered by dedicated studio chrome — not CatalogInputChips. */
export const RESERVED_INPUT_FIELDS = new Set([
  'prompt',
  'image_url',
  'images_list',
  'video_url',
  'audio_url',
  'name',
]);

/**
 * @param {unknown[]} options
 */
export function isTierResolutionOptions(options) {
  if (!Array.isArray(options) || options.length === 0) return false;
  return options.every((o) => typeof o === 'string' && TIER_VALUES.has(o.toLowerCase()));
}

/**
 * @param {object | null | undefined} schema
 * @returns {'tier' | 'enum' | 'range' | 'boolean' | 'unknown'}
 */
export function getSchemaWidgetKind(schema) {
  if (!schema) return 'unknown';
  if (schema.type === 'boolean' || schema.name === 'generateAudio') return 'boolean';
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    if (isTierResolutionOptions(schema.enum)) return 'tier';
    return 'enum';
  }
  if (typeof schema.minValue === 'number' && typeof schema.maxValue === 'number') {
    return 'range';
  }
  return 'unknown';
}

/**
 * Catalog input fields that should appear in CatalogInputChips overflow.
 * @param {object | null | undefined} model
 * @param {Set<string>} [alreadyShown]
 */
export function listOverflowCatalogFields(model, alreadyShown = new Set()) {
  const inputs = model?.inputs;
  if (!inputs || typeof inputs !== 'object') return [];
  return Object.keys(inputs).filter((key) => {
    if (RESERVED_INPUT_FIELDS.has(key)) return false;
    if (alreadyShown.has(key)) return false;
    const schema = inputs[key];
    const kind = getSchemaWidgetKind(schema);
    return kind === 'enum' || kind === 'boolean' || kind === 'range';
  });
}
