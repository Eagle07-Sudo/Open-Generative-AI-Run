# ADR-002: Unified model picker (catalog display vs generation routing)

## Status

Accepted (fork)

## Context

With `runware-first` routing, studios called `getT2iModelsForProvider(resolvedProviderId)` and showed only the Runware catalog (two models) while the full Muapi catalog remained in `models.js`. Users perceived the list as "broken" or incomplete.

Video Studio showed the full Muapi `t2vModels` list while generation could route to Runware — a catalog/routing mismatch.

## Decision

1. **Display:** `getUnifiedModelSections(studioId, prefs)` returns grouped sections (`Runware`, `Muapi`) for the model picker UI only.
2. **User choice:** Selecting a model sets `providerOverride` for the next generation(s).
3. **Default:** When no explicit pick (or after routing prefs change), default to the provider from `resolveProviderForOp` without `providerOverride`.
4. **Priority in resolver:** agents/workflows lock → `providerOverride` → `perStudioRouting` → `routingMode`.
5. **i2i:** Muapi-only; Runware section hidden in image-to-image mode.
6. **Persistence:** `og_model_pick_{studio}` stores `{ v: 1, modelId, providerId }` locally.

## Consequences

- `getModelsForStudio(id, provider)` remains for adapters; not replaced.
- Explicit Muapi model pick does not trigger Runware→Muapi fallback toast on network errors (override is intentional).
- New media models in Runware catalogs require `models.runware.*` + capabilities; Muapi models stay in `models.js`.

## Related

- [ADR-001](ADR-001-hybrid-routing.md) — entry vs runtime routing
