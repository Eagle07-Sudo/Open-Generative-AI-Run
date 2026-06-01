# ADR-012: Studio generation UX (pending gallery + Recreate)

## Status

Accepted (fork)

## Context

ADR-008/010 delivered catalog-driven chips for Seedance and GPT Image 2, but Image Runware T2I rows could omit `resolution` on the catalog while Muapi fallback exposed 1k/2k/4k — UI gated tier popovers on `modelHasCatalogInput` (Runware-only). Galleries appended results only after API success. No Recreate/Remix on Image, Video, or Marketing cards.

Peers (Higgsfield, Runway, Firefly) show in-grid jobs immediately on submit and one-click iteration from outputs.

## Decision

1. **Control visibility:** expose a chip when `getModelInputOptions(modelId, field, provider, catalogMode)` is non-empty; tier UI when options are `1k/2k/4k` (`isTierResolutionOptions`).
2. **Catalog P0:** Runware T2I rows that Muapi maps (e.g. `rw-nano-banana-2`) declare `resolution: RUNWARE_TIER_RESOLUTION_INPUT` and full aspect enums where applicable.
3. **Optimistic history:** `useOptimisticGenerationHistory` prepends `status: 'pending'` entries on Generate; resolve/fail per slot (batch-aware).
4. **Recreate:** `GenerationSnapshot` v1 stored on history entries; `studio:recreate` event + shell tab routing; ref restore via `assetManifest` + IndexedDB blobs + `restoreStudioAssetsFromManifest`.
5. **Gallery detail viewer:** thumbnail-only grid cards; open entry → `GenerationDetailViewer` with right panel (prompt, settings, Recreate, Download). Recreate is not shown on grid cards.
6. **CI:** `npm run check:studio-controls` fails on P0 catalog/UI mismatches for pinned golden models.
7. **Advanced inputs:** `CatalogInputChips` renders remaining resolved catalog fields (e.g. `google_search`, `mode`) with “More” collapse when >3.

### Gallery detail + durable refs (extension)

- **`assetManifest`:** optional on `GenerationSnapshot` — `label`, `kind`, `inferenceRef` (https), `imageUUID` (Runware); no blobs in snapshot.
- **IndexedDB (default on):** enabled unless `localStorage.og_idb_assets === '0'`. Staged `File` bytes persist per label; LRU via lightweight index + global cap in [`studioAssetBlobStore.js`](../packages/studio/src/media/studioAssetBlobStore.js). Restore from IDB runs on **Recreate**, not on page load (deferred hydrate avoids tab freeze).
- **Post-generate snapshot:** history entries patch `snapshot.assetManifest` after successful finalize.
- **Restore order:** IDB File → https CDN asset → Runware UUID + `registerInferenceByLabel`.

### Seed control (extension)

- **`controls.seed`:** present only when the user chose a **fixed** seed (number ≥ 0). Omit the key for random runs (do not store `-1`).
- **Increment policy:** client UX only — after a successful Generate, the prompt bar seed field becomes `usedSeed + 1` (API echo seed preferred over the value sent).
- **Recreate:** restores `controls.seed` exactly; auto-increment applies only on the next Generate click.
- **Providers:** Muapi sends `payload.seed` when fixed; Runware sets `task.seed` on `videoInference` / `imageInference` when fixed; random = omit field.
- **Visibility:** `modelSupportsSeed()` via `getModelInputSchema(…, 'seed')` (ADR-008); Muapi Image T2I/I2I also show seed because `generateImage` accepts it.

## Consequences

- `modelHasT2iResolutionInput` remains for dual quality+resolution models; tier popover also uses resolver options.
- Pending entries have no `url` until ready; cost hooks should ignore non-ready rows.
- Recreate after refresh uses IDB + manifest when available; partial restore shows re-upload banner.

## Related

- ADR-007 (media assets / mentions)
- ADR-008 (model input resolver)
- ADR-009 (Generate cost)
- ADR-010 (studio UX polish)
- ADR-011 (Runware I2I payload)
