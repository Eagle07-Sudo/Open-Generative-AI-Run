# ADR-009: Generate button cost display

## Status

Accepted (fork)

## Context

Studios showed a plain **Generate** label with no price transparency. Muapi exposes `calculate_dynamic_cost`; Workflow nodes already display `$` estimates. Runware has no pre-generation quote API; actual `cost` is returned when `includeCost: true` on tasks.

## Decision

1. **`packages/studio/src/cost/`** — `resolveGenerationCost`, `estimateRunwareCost`, `useStudioGenerationCost`, `formatGenerateLabel`.
2. **Muapi path:** debounced `calculateDynamicCost` when `muapiKey` and `muapiId` exist — display `$X.XX` (quoted).
3. **Runware path:** `pricingHints` on catalog entries — display `~$X.XX` (estimate). Works without Muapi key.
4. **`GenerateCostButton`** — dual-line CTA; generation never blocked when pricing fails.
5. **Batch:** Image `batchSize` multiplies displayed total.
6. **Post-hoc:** Runware `includeCost: true` on tasks; show "Last charged" after success.

## Consequences

- Runware-only users see approximate Seedance/video pricing on the button.
- Catalog `pricingHints` need periodic sync with Runware public pricing.
- Muapi quote failures degrade gracefully to catalog estimate or label-only Generate.

## Related

- ADR-007 (media assets)
- ADR-008 (model control parity)
- [`packages/studio/src/cost/`](../packages/studio/src/cost/)
