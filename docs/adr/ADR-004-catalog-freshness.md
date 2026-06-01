# ADR-004: Catalog freshness & release provenance

## Status

Accepted (fork)

## Context

Users expect a curated **2025+** unless** model storefront, not a full historical dump. Runware Docs publish **Release Date** per model; Muapi `models.js` has no dates. ADR-003 established static Runware SOTA catalogs without temporal metadata.

## Decision

1. **Cutoff:** `RELEASE_CUTOFF = 2025-01-01` — picker shows only models with verified `releaseDate >= cutoff` when `CATALOG_RELEASE_FILTER=1` (default after ship).
2. **Provenance:** Every visible Runware live entry requires `releaseDate` + `provenance.docUrl` + `provenance.verifiedAt`.
3. **Dual-layer Runware truth:** [`runware-release-manifest.json`](../packages/studio/src/data/runware-release-manifest.json) (audit SSOT) must match runtime [`models.runware.*`](../packages/studio/src/models.runware.js).
4. **Muapi:** dates in fork overlay [`models.muapi.releaseDates.js`](../packages/studio/src/models.muapi.releaseDates.js) only — never filter by editing `models.js`.
5. **Deprecation:** pre-2025 Runware entries removed from live catalog; matrix may retain rows for contract tests until next cleanup.
6. **Amendment:** changing cutoff requires ADR revision + FORK.md row.

## Consequences

- `check:runware-catalog --provenance` enforces manifest parity and cutoff.
- `check:muapi-dates --coverage` tracks overlay completeness (W1 image ≥ 80%).
- Locked Muapi CTA counts visible models only (2025+ with overlay entry).

## Related

- [ADR-003](ADR-003-runware-catalog.md) — static Runware catalog
- [ADR-005](ADR-005-runware-muapi-parity.md) — cross-provider parity (eligibility + wiring)
- [ADR-002](ADR-002-unified-model-picker.md) — unified picker
