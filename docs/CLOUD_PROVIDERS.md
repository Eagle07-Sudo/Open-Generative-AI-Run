# Cloud providers (fork)

## Providers

| ID | Role |
|----|------|
| `muapi` | Full platform: media, Agents, Workflows |
| `runware` | Media task API (image, video, audio) |

## Routing modes (`cloudRoutingStore`)

| Mode | Behavior |
|------|----------|
| `runware-first` | Runware when supported + key; else Muapi if fallback enabled |
| `muapi-only` | All media via Muapi |
| `runware-only` | Media via Runware only; Agents/Workflows still Muapi |

## Locked studios (always Muapi)

- `agents`, `workflows`, `design-agent`

## Studio operation execution (ADR-005)

- Studios gate UI with `getStudioOpAvailability(studioId, op, routing)` in `packages/studio/src/studioOpAvailability.js` — not `isRunware` or provider name checks.
- Generation and upload go through `packages/studio/src/studioGenerate.js` (`*ForStudio` helpers).
- Do not branch on provider brand in `*Studio.jsx`; use `resolveProviderForOp` + capabilities.

## Media asset upload (ADR-007)

- **On pick:** [`stageLocalAsset`](../packages/studio/src/media/stageLocalAsset.js) — blob preview + thumbnail; `getStudioOpAvailability(..., 'upload')` always allows local staging.
- **On Generate:** [`finalizeStudioAssets`](../packages/studio/src/media/finalizeStudioAssets.js) — Runware `imageUpload` (returns `imageUUID`) or Muapi `uploadFile` (https).
- **Mentions:** `@image1`, `@video1`, `@audio1` in prompts; slots (e.g. Marketing Product = `image1`).
- **Registry:** per studio tab in [`studioAssetRegistry.js`](../packages/studio/src/media/studioAssetRegistry.js); no data URIs in UI or localStorage.
- **Optional prefetch:** `localStorage.studioAssetPrefetch = '1'` uploads in background after stage when a generate op key exists.

## Resolver

`resolveProviderForOp(studioId, op, prefs)` in `packages/studio/src/studioCloud.js`.

Priority: agents/workflows lock → `providerOverride` (model pick) → `perStudioRouting` → `routingMode`.

## Unified model picker (ADR-002)

- UI: `getUnifiedModelSections(studioId, prefs)` — grouped **Runware** / **Muapi** catalogs.
- User model choice sets `providerOverride` for the next generation (see `buildRoutingContext`).
- API Settings `routingMode` remains the default when the user has not picked a model from a section.
- Persistence: `og_model_pick_{studio}` in localStorage (`modelPickerPersist.js`).
- i2i / i2v / v2v: **Runware + Muapi** unified sections when Runware catalog exists (ADR-005); hide empty Runware headers.
- Without Muapi key: **Muapi** section still appears with `disabledReason` + **Open API Settings** (runware-first).

## Runware catalog (ADR-003)

| Layer | Location |
|-------|----------|
| Static SOTA | `models.runware.js`, `models.runware.i2i.js`, `models.runware.video.js`, `models.runware.i2v.js`, `models.runware.v2v.js`, `models.runware.audio.js` |
| Task payloads | `providers/runwareTaskBuilder.js` → `runware.js` |
| Dynamic search (optional) | `providers/runwareCatalog.js` — `modelSearch` API; flag `RUNWARE_MODEL_SEARCH=1` |
| Validation | `npm run check:runware-catalog` |

New Runware models: add entry + provenance + `npm run check:catalog-freshness` + smoke one generation.

## Catalog freshness (ADR-004)

- **Cutoff:** models with `releaseDate` before `2025-01-01` are hidden when `CATALOG_RELEASE_FILTER=1` (default).
- **Runware:** `releaseDate` + `provenance` on each `models.runware.*` entry; manifest at `data/runware-release-manifest.json`.
- **Muapi:** dates in `models.muapi.releaseDates.js` overlay only — do not edit `models.js` for filtering.
- **Validation:** `npm run check:catalog-freshness` (Runware manifest parity + Muapi W1 coverage).

## Runware ↔ Muapi parity (ADR-005)

| Class | Meaning |
|-------|---------|
| **A** | Runware Docs equivalent → catalog + adapter + matrix row |
| **B** | Muapi-exclusive (Midjourney, Suno, tools, agents) |
| **C** | Runware supports op but fork not fully wired |

- **SSOT:** `tests/fixtures/runware-muapi-parity-matrix.json`
- **G3 gate:** `tests/runwareParity.test.js` — zero drift between `capabilities.js`, catalog, and `runware.js` adapters
- **Full check:** `npm run check:full-parity` (matrix + freshness + providers + static smoke)
- **Live smoke (maintainer):** `RUNWARE_API_KEY=… npm run check:runware-live`

## Capability matrix

See `packages/studio/src/providers/capabilities.js`.

## Tests

- `tests/fixtures/routing-matrix.json`
- `tests/providerRouting.test.js`
- `tests/studioGenerate.ops.test.js`
