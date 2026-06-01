# Fork smoke checklist (maintainers)

Internal QA after theme or studio UI changes. Not linked from the public README.

1. Shell header/tabs — Light, Dark, System
2. Image empty state
3. Prompt card shell (`studio-surface`)
4. Prompt chips + dropdowns (`studio-popover`)
5. Model dropdown open (Runware + Muapi sections; Runware ≥15 image models when key set)
6. Muapi section locked + Open API Settings CTA (Runware-only session)
7. Generate states
8. Gallery cards
9. Preferences modal
10. API Settings (same card as Get Started)
11. Video prompt shell sample
12. Custom light tokens
13. Custom dark tokens
14. Reduced motion
15. Scrollbars
16. `npm test`, `npm run check:providers`, and `npm run check:full-parity`
17. **Catalog freshness (ADR-004):** model dropdown shows release date badge (e.g. `Apr 2026 · Runware`); no SD 1.5 / FLUX.1 schnell; GPT Image 2 quality chip works; Muapi locked CTA says `(2025+)`
18. Video tab — **drag** image onto shell overlay; upload completes or shows key/provider error (not ReferenceError)
19. Image tab — I2I generate after upload (Runware or Muapi path per model pick)
20. Video tab — I2V generate after image upload (Runware section when key + catalog)
21. runware-first + **Muapi and Runware keys** — Image picker upload succeeds (no 403, no Runware block alert)
22. runware-only without Muapi key — pick image: **circle preview visible** (blob thumb); Network: no Runware/Muapi upload until Generate
23. After pick — Generate I2I: progress shows upload phase then generating; result URL loads
24. No string `not available with Runware` in Image studio flows
25. runware-first + **Runware key only** — pick shows preview without Muapi-mandatory alert; Generate runs imageUpload then I2I
26. Marketing — Product slot + `@image1` in script; `images_list` order matches slots
27. **Mention popup (card-scoped):** Image — upload on prompt card, type `@` → list shows `@image1` (and `@image2` if multi); without upload → “upload first” hint (not silent). Marketing — product only uploaded → `@` lists `@image1` only; keyboard ↑↓ Enter inserts tag; Esc closes. After insert, **`@image1` in prompt body** shows **primary chip highlight** (distinct from plain text); typing `@im` while menu open shows muted pending style
28. Same session — Image T2i generate still works via Runware when Runware key set
29. Video tab — pick start frame: blob preview; Generate runs upload then I2V
30. **Video v2v** — picker lists v2v models (not t2v leak); Kling motion-control selectable under Muapi and Runware when mapped
31. **Cinema** — with Runware key, reference image routes to Runware nano-banana i2i catalog id
32. **Audio** — Runware section populated; audio file pick uses local staging (blob preview)
33. **LipSync / Clipping / Marketing** — local pick preview; generation finalizes assets then calls Muapi APIs
34. **Agents / Workflows** — still Muapi-locked; Runware key does not unlock
35. Stale `og_model_pick_*` — invalid saved model falls back to first visible row without 500
36. `npm run check:runware-smoke --dry-run` passes (101 catalog entries)
37. Parity matrix: `npm run check:parity-matrix` — 227 Muapi ids covered
38. **Model controls (ADR-008):** Runware-only — Image Nano Banana Pro shows 1k/2k/4k resolution chip
39. Image I2I Nano Banana 2 Edit — aspect ratio includes `auto` and 16:9 (not 1:1 only)
40. Video Seedance 2.0 Fast — duration **slider 4–15** (default 5); aspect **Auto** + 7 ratios; resolution **480p/720p** only (default 720p); **Audio On/Off** chip; no 1080p
41. Generate Seedance 15s + 720p — network/task payload includes both (or `npm test` builder case)
42. Design Agent blocked (Runware-only) — top tabs visible; Back to Image Studio works; Image Studio loads without textarea console errors
43. **Generate cost (ADR-009):** Runware-only — Video Seedance shows `Generate` + `~$` on button; change duration/resolution → estimate updates; Generate still works if cost API unavailable
44. With Muapi key — Image/Video may show `$` quoted cost (or `~$` fallback); Image batch 2 ≈ double displayed price
45. After Runware video generate — "Last charged: $X.XX" when response includes cost
46. **Video reference circles (ADR-007/010):** Seedance 2.0 Fast T2V — image/video/audio circles in prompt row (no «Ref images/videos» text buttons); upload stops at **9/3/3** badges; T2V image upload does **not** switch to I2V; `@image1` / `@video1` / `@audio1` mentions; Generate cost `~$` updates with refs
47. **Image GPT Image 2 (ADR-010):** Runware — **Quality** chip (Low/Medium/High, no Auto) + **Resolution** chip (1K/2K/4K with px subtitles); Generate sends both tiers; `~$` updates with resolution tier
48. **Image batch stepper (ADR-010):** T2I — `− 1/4 +` stepper (not four buttons); batch 2 ≈ **2×** displayed Generate price
49. **Image I2I Runware payload (ADR-011):** any Runware i2i (Nano Banana / Seedream / FLUX Edit) — upload + `@image1` → Generate; preset models show `inputs.referenceImages` + `resolution` (no `@` in prompt); FLUX keeps `width`/`height`; 400 shows short actionable error
50. **Nano Banana 2 T2I @ Runware (ADR-012):** aspect popover — Auto + many ratios; resolution — **1K / 2K / 4K** with px subtitles (not catalog-only `1k` chip)
51. **Optimistic gallery (ADR-012):** Image — click Generate → pending skeleton card appears before network completes; success replaces with image; failed shows error on card
52. **Recreate (ADR-012):** Image card **Recreate** → Image tab, prompt + 2K tier + `@image1` restored (or amber re-upload warning if blob gone); Video Seedance Recreate restores duration + Audio + AR
53. **Seed (ADR-012):** Video Seedance 2.0 Fast @ Runware — **Seed** chip visible; set `42` → Generate → field shows **43** before second click; empty = random still generates
54. **Seed Recreate:** Video card with seed **42** → **Recreate** restores **42**; Generate uses 42 then UI shows **43**
55. **Seed batch:** Image T2I batch **2** @ Muapi or Runware — network payloads use distinct seeds (`N`, `N+1`) when base seed fixed or random chain
56. **Gallery detail (ADR-012):** Image gallery — cards show **media only** (no prompt footer under thumbnails)
57. **Detail panel:** Open a ready image — **right panel** shows prompt, model, Recreate, Download
58. **Recreate refs (session):** I2I — Recreate from detail panel restores `@image1` in Reference Images (no expired warning)
59. **Recreate refs (refresh):** F5 → open card → Recreate — refs from snapshot manifest (https/UUID); IDB on by default (`og_idb_assets='0'` to disable)
60. **Failed Retry (ADR-012):** Image — force a failed generation (invalid key or offline) → failed card shows **Retry** → succeeds or fails again with same snapshot settings
61. **Batch seed per card:** Image batch **4** with fixed seed → open each ready card → Recreate → Seed chip shows that card’s seed (not only the first slot)
