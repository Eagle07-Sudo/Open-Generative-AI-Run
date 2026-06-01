# ADR-003: Runware catalog (static SOTA + dynamic search)

## Status

Accepted (fork)

## Context

The fork shipped Runware integration with stub catalogs (`models.runware.*`) containing 2–3 placeholder entries while Runware exposes 100+ models ([Models Overview](https://runware.ai/docs/models)). Users perceived the picker as broken or incomplete.

## Decision

1. **Static curated SOTA** — `models.runware.{js,video,audio}.js` hold verified AIR identifiers and studio `inputs` metadata. Source of truth for the unified picker and `runware.js` generation.
2. **Dynamic community models (P2)** — Runware `modelSearch` API for checkpoint/LoRA discovery; cached in browser localStorage; feature-flagged (`RUNWARE_MODEL_SEARCH`).
3. **Task building** — `runwareTaskBuilder.js` maps catalog entries to `imageInference` / `videoInference` / `audioInference` payloads (duration, resolution, width/height profiles).
4. **Display vs keys** — `getCatalogSectionIds()` controls which section headers appear (including locked Muapi CTA); model lists still require keys for generation.
5. **Deprecation** — entries may set `status: 'deprecated'`; hidden from picker, kept for matrix migration.

## Consequences

- New Runware models: manifest entry + `runware-catalog-matrix.json` row + taskBuilder test if new shape.
- No duplication of Muapi `models.js` IDs into Runware catalogs.
- `check:runware-catalog` validates AIR format and bans placeholder IDs (`runware:500@1`, `runware:600@1`).
- **Freshness & provenance:** see [ADR-004](ADR-004-catalog-freshness.md).

## Related

- [ADR-002](ADR-002-unified-model-picker.md) — unified picker
- [ADR-001](ADR-001-hybrid-routing.md) — hybrid routing
