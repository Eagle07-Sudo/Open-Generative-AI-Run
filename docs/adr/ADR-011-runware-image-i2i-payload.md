# ADR-011: Runware image I2I payload contract

## Status

Accepted (fork)

## Context

Runware returned **HTTP 400** on **image I2I** (first seen on Nano Banana 2 Edit) when the fork sent invalid `imageInference` tasks: `@imageN` in `positivePrompt`, top-level `referenceImages`, and both `resolution` presets and `width`/`height`. Runware docs require `inputs.referenceImages` and **either** `resolution` (1K/2K/4K) **or** pixel dimensions — not both.

## Decision

1. **References:** `inputs.referenceImages` for `imageInference` (image/i2i); video i2v/v2v keep top-level `referenceImages`.
2. **Mentions:** strip `@imageN` from `positivePrompt` before API; refs only in `inputs`.
3. **Preset-capable models** (Nano Banana, Seedream, `google:*`, or catalog `resolution` enum 1k/2k/4k): when reference images exist and `params.resolution` is a tier, send `resolution: '1K'|'2K'|'4K'` and omit `width`/`height`. **Flux / Recraft / OpenAI** keep `width`/`height` (OpenAI also uses `providerSettings`).
4. **Pre-flight:** `assertRunwareImagePayload` before `postTasks` in `generateImage` / `generateI2I`.
5. **Errors:** `parseRunwareErrorDetails` exposes `code`; Image Studio uses `formatRunwareErrorForStudio` (no raw JSON dump).
6. **Module:** [`runwareImagePayload.js`](../../packages/studio/src/providers/runwareImagePayload.js) owns family detection and google-class dimension rules.

## Model AIR (Nano Banana 2)

Runware docs require **`google:4@3`** for Nano Banana 2 / Edit. The alias `runware:nano-banana@2` caused server-side `architectureId` type errors (string vs int). Catalog uses `google:4@3` for `rw-nano-banana-2` and `rw-nano-banana-2-i2i`.

## Consequences

- Flux/OpenAI i2i with refs still use pixel sizing unless google-class + tier + refs.
- Fork smoke **#49** documents manual Nano Banana 2 Edit + `@image1` check.

## Related

- ADR-007 (mentions / assets)
- ADR-010 (studio UX / tiers)
- [Runware Nano Banana 2 docs](https://runware.ai/docs/models/google-nano-banana-2)
