# ADR-008: Model Input Resolver

## Status

Accepted — 2026-05-25

## Context

Runware models use `rw-*` catalog ids while Image/Video Studio previously read control lists (aspect ratio, duration, resolution, quality) from Muapi-only helpers in `models.js`. When lookup failed, hardcoded fallbacks produced empty or single-option chips and split-brain defaults between init and dropdowns.

## Decision

1. All studio control lists and defaults **must** come from `modelRegistry` resolver functions backed by `modelInputResolver.js`.
2. **Fallback order:** Runware catalog `inputs.*` → `muapiId` Muapi catalog → `[]` (hide control).
3. **Quality chip field priority:** `resolution` > `quality` (Muapi convention).
4. **Task builder** reads the same resolution/tier params the UI exposes (`runwareImageTier.js` for 1k/2k/4k).
5. Studios **must not** import `getAspectRatiosForI2IModel`, `getDurationsForModel`, etc. from `models.js` for control surfaces.

## Contract

- Schema: [`packages/studio/src/schemas/catalogInputSchema.json`](../../packages/studio/src/schemas/catalogInputSchema.json)
- Resolver API: `getModelInputOptions`, `getModelInputDefault`, `getModelInputFieldName`, `getReferenceInputLimits`
- Golden tests: [`tests/modelInputResolver.test.js`](../../tests/modelInputResolver.test.js)

## Consequences

- New Runware parity models add `inputs` and optional `muapiId` once; parity matrix + resolver tests gate drift.
- Multimodal reference caps (`referenceInputs`) live in catalog; UI gated by `RUNWARE_MULTIMODAL_VIDEO` flag.

## Related

- [ADR-002](ADR-002-unified-model-picker.md) — unified picker
- [ADR-003](ADR-003-runware-catalog.md) — Runware catalog ownership
- [ADR-005](ADR-005-runware-muapi-parity.md) — parity matrix
