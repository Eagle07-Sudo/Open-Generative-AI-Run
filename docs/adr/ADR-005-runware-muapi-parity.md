# ADR-005: Runware ↔ Muapi parity

## Status

Accepted (fork)

## Context

ADR-004 curates **fresh** models (2025+). Users still expect Runware to cover the **same studio modes** as Muapi where Runware Docs list equivalents. Today: i2i (56) and i2v (61) Muapi models have **no** Runware catalog; `capabilities.js` claimed `videoI2v: true` without adapter.

## Decision

### Parity classes

| Class | Meaning |
|-------|---------|
| **A** | Runware Docs lists equivalent → catalog + adapter + matrix row |
| **B** | Muapi-exclusive (Midjourney, Suno, clipping, agents) → documented exemption |
| **C** | Runware supports op but fork not wired yet → track in matrix |

### Capability truth rule

`PROVIDER_CAPABILITIES.runware[op] === true` only when:

1. Non-empty Runware catalog for that op/mode
2. Adapter function exported from [`runware.js`](../packages/studio/src/providers/runware.js)
3. Entry passes static validation (`check:runware-catalog`)

Live API smoke (`runware-catalog-smoke --live`) is maintainer-gate for eligibility.

### Picker rule

Hide Runware section when catalog length is 0 for the active `catalogMode` (no empty headers).

### SSOT

[`tests/fixtures/runware-muapi-parity-matrix.json`](../../tests/fixtures/runware-muapi-parity-matrix.json) — one row per Muapi catalog id.

### Muapi-locked (unchanged)

`agents`, `workflows`, `design-agent` per [`studioOps.js`](../packages/studio/src/providers/studioOps.js).

## Consequences

- `check:parity-matrix` + `tests/runwareParity.test.js` (G3 zero drift)
- New catalogs: `models.runware.i2i.js`, `models.runware.i2v.js`, `models.runware.v2v.js`
- Feature flags: `RUNWARE_PARITY_I2I`, `RUNWARE_PARITY_I2V` in localStorage (default on)

## Related

- [ADR-004](ADR-004-catalog-freshness.md)
- [ADR-002](ADR-002-unified-model-picker.md)
