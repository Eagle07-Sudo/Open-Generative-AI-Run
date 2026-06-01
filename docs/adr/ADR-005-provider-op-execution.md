# ADR-005: Provider operation execution plane

## Status

Accepted (fork)

## Context

Studios mixed three layers: UI gates on `isRunware`, resolver output in `resolveProviderForOp`, and execution in `studioGenerate` that sometimes sent the wrong provider API key to Muapi upload (HTTP 403).

## Decision

1. **UI:** `getStudioOpAvailability(studioId, op, routing)` is the only source for enable/disable messages in media studios.
2. **Execution:** `studioGenerate.*ForStudio` uses `withResolvedProvider` and provider adapter methods; Muapi is only called from the Muapi adapter or explicit Muapi fallback with `routing.muapiKey`.
3. **Capabilities:** `PROVIDER_CAPABILITIES` must match adapter methods (e.g. `runware.upload: true` with `runware.uploadFile` in ADR-006).
4. **Registry:** `providerFactory.registerProvider(id, module)` for a third cloud provider without editing studio components.
5. **`missing_key` invariant:** When `resolveProviderForOp` returns `blockReason: 'missing_key'`, `providerId` must be the cloud provider whose API key is missing for that `StudioOp` — not inferred from `routingMode`.

## Consequences

- Removing `isRunware` from ImageStudio; upload works with Runware key only (Muapi optional fallback).
- Golden matrix rows for `upload` and `imageI2i` document Muapi fallback.
- New tests: `tests/studioGenerate.ops.test.js`, extended `check-studio-routing-context.mjs`.

## Related

- ADR-001 hybrid routing
- ADR-002 unified model picker
