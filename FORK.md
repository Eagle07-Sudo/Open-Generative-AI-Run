# Fork — differences from upstream

**Upstream:** [Anil-matcha/Open-Generative-AI](https://github.com/Anil-matcha/Open-Generative-AI)  
**This fork:** [Eagle07-Sudo/Open-Generative-AI-Run](https://github.com/Eagle07-Sudo/Open-Generative-AI-Run)

## Scope and support

This fork is **personal maintenance**, not a product or supported distribution. The maintainer does not act as a service provider: no obligation to triage other users' hardware, environments, or improvement requests. Use upstream and its community channels for general Open Generative AI support. Forks and adaptations under the license are welcome.

Snapshot of how this repository differs from upstream **today**. Development history lives in `git log`. For routing decisions, see [docs/adr/ADR-001-hybrid-routing.md](docs/adr/ADR-001-hybrid-routing.md) and [docs/CLOUD_PROVIDERS.md](docs/CLOUD_PROVIDERS.md).

## Differences from upstream

- Adds an optional **Runware** cloud provider. Image Studio **text-to-image** uses a local proxy at [`app/api/runware/v1`](app/api/runware/v1).
- **Dual-provider entry:** the first screen accepts a Muapi **or** Runware API key (Muapi is not required for Runware-only Image Studio).
- **Hybrid routing** after login (API Settings): Runware-first, Muapi-only, or Runware-only. Media generation uses Runware when capable, with Muapi fallback. See [`components/cloudRoutingStore.js`](components/cloudRoutingStore.js) and [`packages/studio/src/studioCloud.js`](packages/studio/src/studioCloud.js).
- **Unified model picker** in Image, Video, and Audio: Runware and Muapi models appear in one list; the selected model determines which provider runs that generation.
- **Runware SOTA catalog** (101+ models: t2i/t2v/audio + i2i/i2v/v2v) in `models.runware.*` per [ADR-003](docs/adr/ADR-003-runware-catalog.md) and [ADR-005](docs/adr/ADR-005-runware-muapi-parity.md); optional **Model Search** browse tab when Runware key is set.
- **API Settings** uses the same card as Get Started. Keys persist across browser refresh. **Remove key** clears a provider’s key without requiring a replacement.
- **Studio API banner** shows a warning only when the **required** provider key for that studio or operation is missing.
- **Preferences:** System / Light / Dark and per-variant design tokens. Light-theme tokens are improved in Image and Video prompt areas (partial; other studios may still use upstream styling).
- **Contributor security:** [SECURITY.md](SECURITY.md) and gitleaks before commit/push (fork maintenance; not an end-user feature).
- **Unified media assets (ADR-007):** blob/thumbnail previews on pick; cloud upload on Generate; `@image1` / `@video1` mentions with **card-scoped autocomplete** and **inline primary highlight** for active tags in Image, Video, and Marketing prompts; Muapi optional.
- **Runware Image I2I payload (ADR-011):** all `imageInference` / i2i tasks — `inputs.referenceImages`, strip `@mentions`, pre-flight validation; tier `resolution` (1K/2K/4K) without conflicting `width`/`height` for preset-capable models (Nano Banana, Seedream, catalog-driven); Flux/OpenAI keep pixel sizing.
- **Model control parity (ADR-008, ADR-010):** catalog-driven AR, duration, resolution/quality; Seedance **Auto** + seven aspect ratios, duration **4–15s slider**, **480p/720p** only (I2V parity); GPT Image 2 **Quality + Resolution** chips (1k/2k/4k with px labels); Image batch **− 1/4 +** stepper; multimodal ref limits on Video prompt circles (9/3/3), no separate Ref text buttons; **Audio On/Off** switch on Video.
- **Video prompt audio + @audio1 (ADR-007):** circular reference-audio slot in the Video prompt row (catalog-driven); card-scoped `@audio1` mentions; staged labels finalized on Generate (no `RUNWARE_MULTIMODAL_VIDEO` UX gate).
- **Generate button cost (ADR-009):** USD estimate on Image/Video Generate (`$` Muapi quote or `~$` Runware catalog); batch multiplier; last charged after Runware `includeCost`.
- **Studio generation UX (ADR-012):** optimistic pending gallery cards on Generate (Image, Video, Marketing); **Recreate** restores prompt, controls, and staged refs via `studio:recreate` + shell tab routing; schema-driven tier resolution (1K/2K/4K) when resolver exposes tiers; `npm run check:studio-controls` P0 gate.
- **Seed control (ADR-012):** catalog-driven **Seed** chip when the model supports it (Seedance 2 P0); empty = random; fixed seed in snapshot + Recreate; **+1** after success; image batch uses `N…N+k−1`; Runware/Muapi wire + API echo.
- **Gallery detail + Recreate refs (ADR-012):** thumbnail-only history grid; **detail viewer** (right panel) for prompt, settings, Recreate; reference restore via IndexedDB (default on, `og_idb_assets=0` to disable) + `assetManifest` on snapshot; **Retry** on failed cards re-runs the same snapshot; batch history stores **per-card seed** for accurate Recreate.
- **Routing resilience:** transient Runware failures trip a short **circuit breaker** (Muapi fallback when allowed); cross-tab **storage** sync clears API keys when removed in another tab.

## Unchanged from upstream

- Product name and core scope: studios, local models, and the Muapi model catalog from upstream.
- **Muapi** remains the default cloud path. **Agents** and **Workflows** remain **Muapi-only** (no Runware equivalent API).
- The hosted app at [muapi.ai/open-generative-ai](https://muapi.ai/open-generative-ai) is upstream’s service; this repo is for self-hosting this fork.

## Upstream baseline

- **Tracked upstream:** `Anil-matcha/Open-Generative-AI` @ `main`
- **Last compared / merged:** 2026-06-01 — `924f6d0` (upstream `main`, PR #200 local-ai startup + lipsync/hunyuan/wan/audio fixes)

## Recent changes

| Date | Summary | Commit |
|------|---------|--------|
| 2026-05-24 | feat(runware): ADR-005 Runware↔Muapi parity — i2i/i2v/v2v catalogs, G3 gate, parity matrix | — |
| 2026-05-24 | feat(studio): ADR-004 catalog freshness — release dates in picker, 2025+ filter, Runware/Muapi provenance | — |

---

## Maintainer notes

### Upstream sync

Runbook: [docs/UPSTREAM-SYNC.md](docs/UPSTREAM-SYNC.md). **Policy:** upstream wins when better on overlapping changes; Tier 1 fork-only paths (Runware, routing, personal docs) stay protected.

### Remotes

```bash
git remote add upstream https://github.com/Anil-matcha/Open-Generative-AI.git
```

### Policy

- Default **entry** provider: **Muapi**
- Default **routing** (after login): **runware-first** with Muapi fallback
- **Agents / Workflows:** Muapi-only always
- Generation routing: `resolveProviderForOp` in `studioCloud.js` — not `cloudProvider` alone
- Cursor rules: `.cursor/rules/*.mdc`

### Studio × routing

| Studio | Default route (runware-first) | Notes |
|--------|------------------------------|--------|
| image, video, audio, cinema | auto → Runware if capable | Muapi fallback |
| agents, workflows, design-agent | **muapi** locked | cookie + `/api/agents` |
| marketing, clipping, vibe-motion | auto (often Muapi until Runware ops) | capabilities |
| apps | muapi | low priority |

### Fork-owned paths

| Path | Purpose |
|------|---------|
| `packages/studio/src/providers/` | Muapi wrapper, Runware client, storage |
| `packages/studio/src/providerFactory.js`, `modelRegistry.js` | Provider wiring |
| `packages/studio/src/models.runware*.js` | Runware model catalogs (t2i, i2i, t2v, i2v, v2v, audio) |
| `tests/fixtures/runware-muapi-parity-matrix.json` | Muapi↔Runware parity SSOT (ADR-005) |
| `scripts/build-parity-matrix-draft.mjs`, `validate-parity-matrix.mjs`, `runware-catalog-smoke.mjs` | Parity gates |
| `packages/studio/src/models.muapi.releaseDates.js`, `modelReleaseMeta.js` | Release dates & 2025+ filter |
| `packages/studio/src/data/runware-release-manifest.json` | Runware provenance audit SSOT |
| `packages/studio/src/studioCloud.js`, `studioGenerate.js`, `useStudioCloud.js` | Routing and generation |
| `components/cloudRoutingStore.js` | Runware-first / Muapi-only / Runware-only |
| `app/api/runware/v1/route.js` | Runware proxy |
| `components/StudioProviderBanner.jsx`, `studioProviderRequirements.js` | Provider-aware banners |
| `components/cloudSession.js`, `cloudKeyStore.js` | Session and key persistence |
| `components/CloudApiKeyPanel.jsx`, `cloudApiKeyCopy.js` | Shared API key UI |
| `components/StandaloneShell.js`, `ApiKeyModal.js`, `SettingsModal.jsx` | Entry gate and settings |
| `src/styles/studio-theme.css`, `preferences-controls.css` | Theme and modals |
| `src/lib/preferences.js`, `public/preferences-boot.js` | Preferences boot |
| `.cursor/rules/`, `.env.example` | Agent rules; Runware key comment |

### Troubleshooting (dev)

If `/studio/*` returns **500** with `Cannot find module './NNN.js'` or `ENOENT` for `.next/*-manifest.json`, stop dev, delete `.next` (and optionally `node_modules\.cache`), then `npm run dev`.

### Security (contributors)

See [SECURITY.md](SECURITY.md). Run `npm run security:secrets` before commit and `npm run security:secrets:git` before push.

### Releases

No per-commit changelog in this repo. Use `git log` for history. If you tag a release (`v*`), add release notes from `git log` since the previous tag (optional `CHANGELOG.md` at tag time only).

### Out of v1 scope

- Electron / Vite `src/components/ImageStudio.js`
- Runware workflows / agents (Muapi-only)

### Last upstream merge

- **Date:** 2026-06-01
- **Upstream ref:** `924f6d0` @ `Anil-matcha/Open-Generative-AI` `main`
- **Notes:** Clean merge from `0bc9744`. Upstream: local-ai startup progress heartbeat, LipSync model reset on mode toggle, Hunyuan/Wan aspect-ratio catalog fixes, Suno audio endpoint fix. Fork Runware/routing/studio layers unchanged. Verified 2026-06-01: `git log HEAD..upstream/main` empty — no further merge required until upstream advances.

### Merge decisions (conflicts)

| File | Choice | Reason |
|------|--------|--------|
| `packages/studio/src/models.js` | auto-merge | upstream catalog fixes; fork overlay in `models.runware.*` |
| `packages/studio/src/muapi.js` | auto-merge | upstream Suno endpoint fix |
| `packages/studio/src/providers/**` | ours | Runware fork (Tier 1) |
