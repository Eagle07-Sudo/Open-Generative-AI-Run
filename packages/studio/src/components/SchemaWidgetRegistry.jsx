/**
 * Schema widget registry (ADR-012) — maps resolver field types to studio controls.
 * Implementation lives in schemaWidgetUtils.js; studios import helpers directly or via this barrel.
 */
export {
  RESERVED_INPUT_FIELDS,
  isTierResolutionOptions,
  getSchemaWidgetKind,
  listOverflowCatalogFields,
} from '../schemaWidgetUtils.js';
