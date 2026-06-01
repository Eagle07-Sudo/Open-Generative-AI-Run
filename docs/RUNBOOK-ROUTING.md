# Runbook: hybrid cloud routing

## User reports “always Muapi” despite Runware-first

1. Open **API Settings** → confirm **Runware first** is selected.
2. Confirm **Runware API key** is saved.
3. Check studio: Video/Image must be supported on Runware (`capabilities.js`).
4. If **Allow Muapi fallback** is on and Runware fails, a toast shows fallback — check browser console for Runware errors.
5. Verify `localStorage.routing_v2` is `1` (routing v2 enabled).

## Agents / Workflows do not work

1. **Muapi key** required (Runware cannot serve these tabs).
2. Confirm `muapi_key` cookie for `/api/agents` and `/api/workflow` proxies.

## High fallback rate

1. Runware outage or invalid model IDs in `models.runware.*.js`.
2. User may have **runware-only** without Muapi for unsupported ops.

## Model picker (“only 2 models” / missing Muapi list)

1. **Runware-only key:** Runware section should list **15+ image**, **10+ video**, **5+ audio** models (not 2–3). If still tiny: hard refresh; confirm deploy includes `models.runware.*` update.
2. **Muapi section locked:** expected without Muapi key — use **Open API Settings** in the dropdown to add Muapi.
3. With **both keys** and **Runware first**, picker shows two populated sections.
4. Picking a Muapi model sets `providerOverride`; preview line must say **Will run via Muapi**.
5. **i2i / i2v / v2v:** Runware section appears when catalog non-empty; if empty, Muapi-only (no blank Runware header).
6. Video label mismatch (e.g. Seedance in bar, Runware in list): clear `og_model_pick_video` or pick again from unified list.
7. **Browse library** tab (Video): requires Runware key + `RUNWARE_MODEL_SEARCH=1` (enabled on Runware entry).

## Runware generate fails (invalid model)

1. Note `modelId` and `runwareModel` from error toast / console.
2. Verify AIR on [runware.ai/docs/models](https://runware.ai/docs/models); update `models.runware.*`.
3. Run `npm run check:runware-catalog` or `npm run check:catalog-freshness`.

## Runware Image I2I returns 400 (Nano Banana Edit)

1. DevTools → request body: must include `inputs.referenceImages` (UUIDs), not top-level `referenceImages`.
2. `positivePrompt` must **not** contain `@image1` (stripped in builder; if present, pre-flight or old bundle).
3. With **1K/2K/4K** chip and a reference image: body should have `resolution: "1K"` (etc.) and **no** `width`/`height` together (ADR-011).
4. Re-upload reference if error says upload not ready; restart dev server after code deploy.
5. Nano Banana 2 / Edit must use AIR **`google:4@3`** (not `runware:nano-banana@2`); see [Nano Banana 2 docs](https://runware.ai/docs/models/google-nano-banana-2).

## Parity incidents (ADR-005)

| Symptom | Action |
|---------|--------|
| Empty Runware section in i2v picker | Confirm `models.runware.i2v.js` has live entries; run `npm run check:full-parity` |
| i2v gen fails with reference image | Compare payload `referenceImages` vs [Runware Docs](https://runware.ai/docs); check `buildI2VTask` |
| Invalid AIR shipped | Quarantine entry (`status: deprecated`); update matrix; re-run `runware-catalog-smoke --live` |
| User expects Midjourney on Runware | Class B — point to Muapi section in picker |
| Capabilities vs catalog drift | Fix `capabilities.js` or add catalog + adapter; G3 test must pass |

## Catalog freshness (ADR-004)

1. Picker shows **release date** next to model name; only **2025+** models when `CATALOG_RELEASE_FILTER=1` (default).
2. Rollback filter: set `localStorage.CATALOG_RELEASE_FILTER=0` (dev only).
3. Add model: update `models.runware.*` + `data/runware-release-manifest.json` (or `npm run check:runware-catalog` with `--write-manifest`) + provenance from [Runware docs](https://runware.ai/docs/models).
4. Muapi dates: fork overlay `models.muapi.releaseDates.js` — never edit `models.js` for filtering.
5. Monthly: `node scripts/audit-runware-dates.mjs` and compare with Runware overview.
