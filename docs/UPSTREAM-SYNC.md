# Upstream sync runbook

Merge [Anil-matcha/Open-Generative-AI](https://github.com/Anil-matcha/Open-Generative-AI) `main` into this fork without losing fork-only capabilities (Runware, hybrid routing, dual-provider entry, personal docs).

**Policy:** **Upstream wins when better** — if upstream and the fork both changed the same area and upstream’s feature or fix is superior, take upstream and re-wire fork hooks. Do not keep inferior fork UX out of habit.

Full conflict tiers: [`.cursor/rules/fork-upstream-sync.mdc`](../.cursor/rules/fork-upstream-sync.mdc).

---

## When to sync

- Upstream ships model catalog fixes, studio bugs, or features you want
- Before large fork edits to `*Studio.jsx` or `models.js`
- After upstream release tags you track

**Skip** when `git log HEAD..upstream/main` is empty (already up to date).

---

## Pre-merge check

Clean working tree:

```bash
git fetch upstream
git log --oneline HEAD..upstream/main    # incoming (empty = nothing to do)
git log --oneline upstream/main..HEAD    # fork-only commits kept
```

Read [`FORK.md`](../FORK.md) → **Upstream baseline** for last merged SHA.

---

## Merge steps

1. Optional safety branch: `git checkout -b sync/upstream-YYYY-MM-DD`
2. `git merge upstream/main -m "chore(upstream): merge upstream main"`
3. Resolve conflicts per tiers below
4. `git submodule update --init --recursive`
5. If lockfile changed: `npm ci` and `npm run setup` (or `npm run build:packages`)

---

## Conflict resolution (3 tiers)

Document every non-obvious choice in [`FORK.md`](../FORK.md) → **Merge decisions**.

### Tier 1 — Protected (fork-only)

Keep **ours** unless upstream ships the same capability and theirs is better (then migrate; do not duplicate).

| Area | Paths |
|------|--------|
| Runware | `packages/studio/src/providers/**`, `models.runware*.js`, `app/api/runware/**` |
| Routing | `studioCloud.js`, `studioGenerate.js`, `cloudRoutingStore.js`, `cloudKeyStore.js` |
| Entry UI | `StandaloneShell.js`, `ApiKeyModal.js`, `CloudApiKeyPanel.jsx` |
| Personal fork | `.cursor/rules/**`, `SECURITY.md`, `SUPPORT.md`, README **This fork** block |
| QA | parity fixtures, fork-only tests/scripts |

### Tier 2 — Prefer upstream

Take **theirs** first; keep fork diff only if smoke test proves fork is better.

| Area | Paths |
|------|--------|
| Muapi catalog | `packages/studio/src/models.js` |
| Muapi client / proxies | `muapi.js`, `app/api/api/v1/**`, `app/api/agents/**` |
| Platform | submodule pointers, `electron/lib/localInference*` |

After taking theirs: `providers/muapi.js` wrapper must still work.

### Tier 3 — Overlap (upstream wins if better)

| Area | Rule |
|------|------|
| `*Studio.jsx` | Start from **upstream**; port back Runware hooks, mentions, Recreate, cost only as needed |
| Theme / i18n | Prefer upstream polish; re-apply fork tokens where upstream has no equivalent |
| `README.md` | Upstream body + re-apply fork block before `### Related projects` |
| `packages/studio/src/index.js` | Upstream exports + fork-only exports |

**Never:** remove Muapi default; embed Runware in `muapi.js`; add Runware models to main `models.js`.

---

## Post-merge verification

```bash
npm run check:full-parity
```

If Electron/local-ai changed: `npm run build:studio`

Manual smoke ([`fork-smoke.md`](fork-smoke.md) subset):

- Muapi or Runware entry
- Image T2I + I2I (Runware)
- Runware-first + Muapi fallback
- Agents/Workflows Muapi-locked
- Model picker Runware sections populated

---

## Documentation after merge

Update [`FORK.md`](../FORK.md):

1. **Upstream baseline** — date, upstream SHA, one-line summary
2. **Last upstream merge** — ref, notes, conflict count
3. **Merge decisions** — file, choice, reason (especially fork code dropped for upstream)
4. **Differences from upstream** — only if user-visible behavior changed

Commit: `chore(upstream): merge upstream main` (+ body). Run gitleaks per [git-secrets-and-push.mdc](../.cursor/rules/git-secrets-and-push.mdc).

---

## Decision order (quick)

1. Upstream better for this file? → **theirs** + re-wire Runware/routing
2. Fork-only path? → **ours**
3. Unclear? → smoke test both → document in FORK
