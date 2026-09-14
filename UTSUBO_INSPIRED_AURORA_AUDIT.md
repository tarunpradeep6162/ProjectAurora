# Utsubo-Inspired Cinematic Audit — Project Aurora

Grounded in direct code inspection this pass (not memory from earlier
sessions) plus the real utsubo.com walkthrough documented in
`UTSUBO_AURORA_TRANSLATION.md`. Temporary working document — safe to delete
once implementation is reviewed.

Classification: **KEEP** / **IMPROVE** / **REDESIGN** / **ADD** / **REMOVE**.

| Chapter | Rating | Reasoning |
|---|---|---|
| Hero (`ChapterPortal.tsx`) | **KEEP** | Re-read in full this pass. Already implements the exact Utsubo-derived beat structure the brief asks for independently: near-darkness → one star → another → haze → aurora forming → FOR DHEEPIKA → PROJECT AURORA, all driven through CSS custom properties (never inline `opacity:0`) with a hard failsafe timeout so a stalled frame loop can't strand it. "Begin the Journey" already plays a ~1.7s entry-warp (stars pull outward, portal opens, warm bloom, first photo emerges) — inside the brief's own 1.3–1.8s target. Nothing here needs redesigning. |
| Galaxy / persistent backdrop (`CosmicScene.tsx`, `CosmicAtmosphere.tsx`) | **KEEP** | Already layered (base sky, glow, stars, warm wash) with a scroll-driven grading system and named seams at each chapter boundary. Desktop-only `pointermove` camera parallax already exists (`CameraRig`), gated to `pointerType === "mouse"`, damped, and scaled to near-zero for the Letter and candle chapters — this is precisely the brief's "gentle pointer response, never chaos, fades for calm chapters" ask, already built. |
| Timeline / Constellation (`ChapterTimeline.tsx`) | **KEEP** | Curved bezier orbit (not a ruled line), staggered twinkle, points double as caption progress — the exact "celestial timeline, not corporate vertical list" the brief asks for, already in place from an earlier pass. |
| Journey (`ChapterJourney.tsx`) + Road-becomes-stars | **KEEP** | `CosmicPath` is already wired to `CosmicAtmosphere`'s `--seam-constellation` variable, which drives the road's convergence into the constellation exactly at the Journey→Story boundary — this is the brief's point 23 ("road becomes stars") already implemented as a named, documented seam, not something to build fresh. |
| Memory Gallery | **KEEP** | Rebuilt in an earlier pass into 5 bespoke shot compositions (Establishing/Intimate/Transition/Hero/Final), each with real per-photo alt text and crop. Matches the brief's "directed photography, no grid/carousel" ask already. |
| Letter | **KEEP** | Static paragraphs, no word-by-word or typewriter reveal (matches brief 24: "remove spectacle" explicitly). Narrow centered column, warm ivory type, quiet background. This is this session's most heavily protected chapter across many passes — content and treatment both correct as-is. |
| Birthday / Cake / Wish | **KEEP** | Cinematic cake reveal, candle-blow interaction with tactile flame-out → smoke → held darkness → two-star return → full-scene reveal, all phase-driven and reduced-motion safe. Verified end-to-end this session's prior pass, including a real regression fix to its chapter-boundary tracking. Re-touching this chapter's visuals without a concrete reproduced issue would violate this project's own repeated "do not guess-fix, do not redesign working chapters" instruction. |
| Finale / Dedication | **KEEP** | Dedication legibility and the nav-recede/tap-target overlap were both real bugs found and fixed in the immediately preceding two passes, re-verified via `getBoundingClientRect()`/`elementFromPoint()` hit-testing, not just screenshots. No further changes indicated. |
| Navigation (`ChapterNav.tsx`) | **KEEP**, one **P2 considered and declined** | Already a minimal "0X / 08" corner control with no traditional nav bar, already recedes during the candle's darkness and the finale. Utsubo's always-visible dot rail was considered as an addition (brief point 39) — declined: Aurora's chapter number already gives the same orientation function in the site's own voice, and adding a second, parallel progress indicator (a rail *and* a pill) is exactly the kind of change-for-change's-sake this session's standing instructions warn against. Not implemented. |
| Music UI | **KEEP** | Already a tiny corner control (play/pause + label), no full player card — matches brief 40 as-is. |
| Signature interaction / cursor agency | **ADD (implemented this pass)** | The one genuine, checkable gap: no cursor-state system exists anywhere in the codebase (confirmed via search). Utsubo's core distinguishing trait — occasional, contextual visitor agency — is repeated across the brief (points 13, 14, 20, 29) as the thing that most separates it from a normal site. Implemented as a small, desktop-fine-pointer-only, two-context label ("ENTER" over the hero's CTA/portal, "WISH" over the candle button) — not a giant follower circle, not applied everywhere, off entirely on touch and under reduced motion. See report for exact scope. |

## Priority

- **P0 (bugs):** none found this pass.
- **P1 (major cinematic/emotional improvement):** none of the "expected P1 areas" (Hero, Journey, Timeline/Constellation transitions, Letter→Birthday, Galaxy return, Finale, Navigation) needed one on inspection — each already independently converged on the brief's own stated goals across this project's earlier passes.
- **P2 (polish):** the contextual cursor (implemented, scoped small — arguably P1 by the brief's own framing of "signature interaction," implemented as such).
- **P3 (experiments):** Utsubo's always-visible dot rail — considered, explicitly declined (see Navigation row above).

## Conclusion

This audit's honest outcome is that Project Aurora, after this project's
many prior cinematic-refinement passes, already embodies almost all of the
principles this brief asks for — independently, in its own vocabulary, not
because Utsubo was studied before now. The one real, implementable gap was
the total absence of any cursor-agency system. That is what this pass
builds. Nothing else is touched.
