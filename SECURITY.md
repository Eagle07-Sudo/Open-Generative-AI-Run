# Security — Open Generative AI Run (fork)

This document describes how API keys and preferences are handled for **personal localhost** use of the Next.js studio (`/studio`). It follows common practices (OWASP Secrets Management, secure headers) without claiming enterprise-grade protection.

This fork is maintained for personal use; security practices here assume a single operator on their own machine, not multi-tenant hosting.

## Summary

- API keys are entered in the app UI and stored **only in your browser** (`localStorage` and, for Muapi, a cookie).
- Keys and studio preferences are **not uploaded to GitHub** unless you manually commit them.
- This fork does **not** encrypt keys in the browser. Anyone with access to your unlocked browser or DevTools can see them.

## What is stored locally

### Authentication (browser `localStorage`)

| Key | Purpose |
|-----|---------|
| `muapi_key` | Muapi API key |
| `runware_api_key` | Runware API key |
| `cloud_provider` | Active cloud provider (`muapi` or `runware`) |

Defined in `packages/studio/src/providers/storageKeys.js`.

### Muapi cookie

- Name: `muapi_key`
- Set from JavaScript when you save a Muapi key (`SameSite=Lax`, **not** `HttpOnly`)
- Used by some server routes and agents under `/app/agents/*`

### Studio preferences (`localStorage`)

| Key | Studio |
|-----|--------|
| `hg_image_studio_persistent` | Image Studio |
| `hg_video_studio_persistent` | Video Studio |
| `hg_audio_studio_persistent` | Audio Studio |
| `hg_clipping_studio_persistent` | AI Clipping |
| `hg_vibe_motion_studio_persistent` | Vibe Motion |
| `hg_lipsync_studio_persistent` | Lip Sync |
| `hg_cinema_studio_persistent` | Cinema Studio |
| `hg_marketing_studio_persistent` | Marketing Studio |
| `og_preferences` | Theme mode (system/light/dark), per-variant tokens, locale, UI scale, reduced motion — **not API keys** |

These may contain prompts, model choices, and local history — still **local only**.

`og_preferences` (v2) stores appearance and accessibility only: `themeMode`, `themes.dark` / `themes.light` token overrides, and `general` (locale, uiScale, reducedMotion). Do not put API keys in this JSON object.

## Threats (localhost)

| Threat | Mitigation |
|--------|------------|
| Browser DevTools / Network tab | Expected; Bearer token visible during Runware requests |
| Malicious browser extensions | Use trusted extensions only |
| Malware on your PC | OS security; rotate API keys if compromised |
| Shared or public computer | Use **Sign out** in Settings; clear site data |
| Accidental Git commit | Never commit `.env`; run secret scan (below) |
| Runware key sent to Muapi proxy | `resolveProviderForOp` + tests; axios injects `muapiKey` only on Muapi routes |
| Tampered model pick JSON | `modelPickerPersist` validates `providerId`; no keys in pick blob |
| Runware Model Search queries | Passed via proxy with Bearer key; results cached in `og_runware_search_cache_v1` (localStorage, 24h TTL; no server-side storage) |

## What we do not protect against

- Someone using your unlocked browser session
- API keys visible in DevTools → Network during image generation (client-side auth model)
- `git add -f .env` bypassing `.gitignore`

## Git hygiene

1. **Never commit** a real `.env` file. Only `.env.example` (comments, no secrets) belongs in the repo.
2. Install the [gitleaks](https://github.com/gitleaks/gitleaks#installing) CLI once (not an npm package):
   - Windows: `winget install gitleaks` or `choco install gitleaks`
   - macOS: `brew install gitleaks`

3. Before pushing to GitHub, run:

   ```bash
   npm run security:secrets
   npm run security:secrets:git
   ```

   On Windows PowerShell: `cd path\to\repo; npm run security:secrets`

   Scripts invoke `scripts/gitleaks-detect.mjs`, which calls the `gitleaks` binary on your PATH.

4. Optionally enable **GitHub → Settings → Code security → Secret scanning** on your repository.

   CI also runs [`.github/workflows/secret-scan.yml`](.github/workflows/secret-scan.yml) on push/PR (uses gitleaks-action).

## Agent-driven Git (Cursor)

- The user asks the Cursor agent to perform `git commit` and `git push`, not manual CLI.
- Before commit: if the change is user-visible, sync [`FORK.md`](FORK.md) **Differences from upstream** and the README **This fork** comparison table (snapshot vs upstream — no per-commit changelog); use **Conventional Commits** for the subject; then run `npm run security:secrets` (exit 0).
- Before push: the agent must run `npm run security:secrets:git` (exit 0).
- Protocol: [`.cursor/rules/git-secrets-and-push.mdc`](.cursor/rules/git-secrets-and-push.mdc).

## Electron / Vite path

`npm run electron:dev` uses legacy auth under `src/components/AuthModal.js`. This hardening plan targets the **Next.js** path (`/studio` via `components/StandaloneShell.js`). Treat Electron as a separate surface until aligned.

## Future (public self-host)

If you deploy for multiple users or the public internet, consider:

- Server-side API keys (`RUNWARE_API_KEY` / `MUAPI_KEY` in server env only)
- HttpOnly, Secure session cookies instead of `localStorage`
- Content-Security-Policy and rate limiting on API proxies
- No client-visible Bearer tokens

## Verification checklist

| # | Check | Expected |
|---|--------|----------|
| 1 | `npm run security:secrets` | Exit code 0 |
| 2 | `npm run security:secrets:git` | Exit code 0 (or triage false positives) |
| 3 | Real `.env` in project root | Not listed in `git status` |
| 4 | This file | Lists localStorage keys and Git rules |
| 5 | `npm run dev` | Studio loads at `/studio/image` |
| 6 | Runware generate | Server terminal shows no full API key |
| 7 | Settings open | Password fields empty; masked “Saved:” hints only |
| 8 | Runware-only entry | Login with Runware key only still works |

## Reporting issues

If you find a secret logged in server output or committed to the repo, rotate the affected API key at the provider and open an issue on the fork repository.
