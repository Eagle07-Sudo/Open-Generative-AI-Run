# ADR-006: Runware media asset plane

## Status

Accepted (fork)

## Context

Media studios need file upload for I2I, I2V, and reference inputs. Muapi provided `uploadFile` via CDN; Runware users were blocked when `capabilities.runware.upload` was false, with UX copy implying Muapi was mandatory.

## Decision

1. **Asset plane** (`runwareUpload.js`): images use Runware `imageUpload`; video/audio use local data-URI staging until Runware ships video upload.
2. **Registry** maps preview URLs to `imageUUID` for inference (`resolveRunwareAsset` in task builder).
3. **`capabilities.runware.upload: true`** only with `runware.uploadFile` exported.
4. **Resolver** prefers Runware for `upload` when a Runware key exists; Muapi is optional fallback on failure, not a hard gate.
5. **UI** uses `getStudioOpAvailability` — no Muapi-mandatory upload strings.

## Consequences

- Runware-only users can upload images without a Muapi key.
- LipSync/Clipping/Marketing generation remains Muapi-locked; upload may work for preview inputs.
- Large video files are read into memory as data URIs — same size limits as studio UI.

## Related

- ADR-005 provider op execution
- ADR-005 Runware ↔ Muapi parity (catalog classes)
