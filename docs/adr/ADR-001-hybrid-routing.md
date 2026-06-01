# ADR-001: Hybrid cloud routing (Entry vs runtime)

## Status

Accepted (fork)

## Context

The app supports two cloud providers: **Muapi** (full platform including Agents/Workflows) and **Runware** (media task API). Users want Runware-first for cost on image/video/audio while keeping Muapi for features Runware does not offer.

Previously, `cloudProvider` from the entry screen doubled as the runtime provider, causing confusion and false Muapi banners.

## Decision

1. **Entry gate** ([`components/ApiKeyModal.js`](../../components/ApiKeyModal.js)): requires at least one valid API key to enter. Default entry provider remains **Muapi** per fork policy.
2. **Runtime routing** ([`components/cloudRoutingStore.js`](../../components/cloudRoutingStore.js) + [`packages/studio/src/studioCloud.js`](../../packages/studio/src/studioCloud.js)): `resolveProviderForOp()` is the **only** source of truth for which provider executes a generation.
3. **Agents / Workflows**: always **Muapi** — no Runware proxy (Runware has no equivalent product API).
4. **Defaults**: `routingMode = runware-first`, `allowMuapiFallback = true` after routing v2 rollout.

## Consequences

- Studios receive `routingPrefs`, `muapiKey`, `runwareApiKey` — not a single `apiKey` for generation decisions.
- P3 removes `cloudProvider` from generate paths; entry `cloudProvider` may remain for legacy balance display until removed.
- New operations require updates to `studioOps.js`, `capabilities.js`, and `tests/fixtures/routing-matrix.json`.
