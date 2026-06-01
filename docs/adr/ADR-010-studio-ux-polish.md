# ADR-010: Studio UX polish (control parity)

## Status

Accepted (fork)

## Context

After ADR-007 (mentions), ADR-008 (catalog-driven controls), and ADR-009 (Generate cost), Image and Video studios still diverged from Runware catalog capabilities and competitor UX patterns: Seedance duration/resolution, multimodal ref limits on prompt circles, GPT Image 2 dual quality+resolution tiers, and a compact batch stepper.

## Decision

1. **Video Seedance:** duration enum **4–15**; resolution **480p/720p** only (no 1080p in catalog or pricing hints).
2. **Video T2V+refs:** `isMultimodalRefMode` routes image/video circles to `referenceImages` / `referenceVideos` (9/3/3); uploads do **not** auto-switch to I2V.
3. **Video UI:** remove «Ref images/videos» text buttons; `StudioToggle` for generate audio beside duration.
4. **Image GPT Image 2:** separate **Quality** and **Resolution** chips; tier dropdown shows **1024/2048/4096 px** subtitles; quality enum excludes `auto`.
5. **Image batch:** `BatchSizeStepper` (`− n/4 +`) replaces four toggle buttons; cost estimate multiplies by batch size (ADR-009).
6. **Builder:** `buildImageTask` uses `imageTierToRunwareSize` when `params.resolution` is a tier (`1k`/`2k`/`4k`).
7. **Resolver:** `getModelInputOptionsForField` / `modelHasCatalogInput` for dual-field models.

## Consequences

- `getModelInputFieldName` still returns `resolution` when both fields exist; callers must use field-specific helpers for GPT Image 2.
- Muapi-only models keep single-chip resolution/quality via legacy path.
- Fork smoke #40, #47, #48 document manual checks.

## Related

- ADR-008 (model control parity)
- ADR-009 (Generate button cost)
- ADR-007 (media assets / mentions)
