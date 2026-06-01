# ADR-007: Studio media assets, preview, and mentions

## Status

Accepted (fork)

## Context

Upload-on-pick returned data URIs as preview URLs, breaking `<img>` for large files and filling `localStorage`. Marketing advertised `@image1` without a parser. Studios duplicated upload/preview logic.

## Decision

1. **Staged-local:** `stageLocalAsset` creates blob `previewUrl` + canvas `thumbUrl`; no cloud I/O on pick.
2. **Commit-on-generate:** `finalizeStudioAssets` runs Muapi `uploadFile` or Runware `imageUpload` inside `finalizeParamsAssets` before `generate*ForStudio`.
3. **Registry per `studioId`:** labels `image1`, `video1`, `audio1`; mentions `@image1`.
4. **UI:** `MediaPreviewThumb`, `MentionPromptField`, `StudioAssetUploader` under `components/media/`.
5. **`upload` op:** `getStudioOpAvailability('upload')` always `canRun` for local staging; keys required on generate ops only.
6. **Persistence:** `assetManifest` (labels + optional https `inferenceRef`); never data URIs or blobs.
7. **Prefetch (optional):** `localStorage.studioAssetPrefetch=1` enables background finalize after stage.
8. **Design Agent:** same `@imageN` mention syntax documented; separate session registry (future alignment).
9. **Card-scoped mentions:** `MentionPromptField` autocomplete and `finalizeParamsAssets` `cardLabels` only expose and resolve assets attached to the **current prompt card** (`cardMentionAssets`, `extractCardLabels`, `mentionsInCardScope`). Out-of-card `@imageN` tags in the prompt are ignored at generate time.
10. **Video multimodal refs:** `getReferenceInputLimits` from the Runware/Muapi catalog drives reference image/video/audio slots (e.g. Seedance 9/3/3). Video Studio uses `stageFileForStudio('video')` + labels (`audio1`, …), a prompt-row audio circle, and `applyAssetRefsToParams` for `referenceImages` / `referenceVideos` / `referenceAudios`. `RUNWARE_MULTIMODAL_VIDEO` is a dev-only override in `runwareMultimodalFlags.js`, not a user-facing gate.

## Consequences

- Broken circle previews fixed for Runware-only users.
- Generate shows two-phase progress when uploads pending.
- Runware video/audio still use data URI at inference until CDN upload exists; thumbs remain blob-only.

## Related

- ADR-006 (superseded for preview path; imageUpload timing moved to finalize)
- [`packages/studio/src/media/`](../packages/studio/src/media/)
