# Project Aurora — Final Visual QA

Full top-to-bottom emotional-arc review of the live local build
(`http://localhost:3000`), fresh browser tab, desktop (1440×900) plus
mobile at 375×812, 390×844 and 430×932. Ratings: **AAA** (ship as-is),
**AA** (strong, minor optional polish), **A** (solid, no action needed
this pass), **Needs Work** (a real defect, addressed below).

| Scene | Current Quality | Issue | Priority | Recommendation |
|---|---|---|---|---|
| Hero (Ch. 01) | AAA | None found. "FOR DHEEPIKA" reads small/intimate above the dominant "PROJECT AURORA" title — correct hierarchy, confirmed at all three required mobile widths. | — | Keep. |
| Miracle (Ch. 02) | AAA | None. Title appeared to overflow in an early screenshot; `getBoundingClientRect()` showed it fully inside the 1440px viewport — a known screenshot-scaling artifact of this preview tool, not a real bug. | — | Keep. |
| Story / Constellation (Ch. 03) | AA | Light confirmatory look only (recently built, no redesign warranted). Curved-orbit path and twinkle read as restrained and intentional. | — | Keep. |
| Journey (Ch. 04) | AA | Light confirmatory look only (recently built to spec, per instruction not to re-audit clean work). No regression found. | — | Keep. |
| Memories (Ch. 05) | AA | Light confirmatory look only (fully rebuilt last pass into 5 bespoke shot compositions). No regression found. | — | Keep. |
| Letter (Ch. 06) | AAA | None. Reads calm and legible at both desktop and mobile widths; column stayed within `max-w-[42rem]`, centered — an earlier apparent overflow was the same screenshot artifact as above, disproven via DOM. | — | Keep — body content untouched, as required. |
| Birthday / Cake (Ch. 07) | AA | Cake mounted cleanly this pass, candles lit, plaque legible, no "brown box" WebGL artifact reproduced at 1440×900 (the size it appeared at once previously). | — | Not reproduced this pass — see Remaining Issues. No guess-fix applied, per standing instruction. |
| Finale (Ch. 08) | **Was Needs Work → now AAA** | Two real defects found and fixed (below). | P0 | Fixed this pass. |
| Navigation (chapter menu) | **Was Needs Work → now AAA** | Fixed nav pill collided with the finale's own revisit links on short/narrow viewports (below). | P0 | Fixed this pass. |
| Music / Audio toggle | A | Bottom-right corner control, tiny, no full player — unaffected by the finale fix (its fixed position doesn't intersect the collision zone). | — | Keep. |
| Mobile (375×812, 390×844, 430×932) | AAA | Hero, Letter, Memories, and the fixed Finale all rendered cleanly at all three required widths. | — | Keep. |

## Changes made this pass

**1. Finale dedication was effectively invisible (P0).**
`.finale-dedication .type-meta` — the closing line "Created with love by
Tarun — for Dheepika — 25 November" — was rendering at its inherited
`.type-meta` base size (12px) and 58% alpha gold on a near-black
background. Technically "revealed" (`opacity: 1`, not
`data-reveal-pending`) but practically illegible, directly contradicting
the requirement that the dedication "remain the visual focus" of the
site's closing moment. Fixed in
[globals.css](src/app/globals.css) by giving `.finale-dedication
.type-meta` its own `font-size: clamp(0.95rem, 0.85rem + 0.3vw, 1.15rem)`
and raising its color to `rgba(215, 185, 122, 0.85)`, while keeping the
same tracked/uppercase/unhurried treatment — still a closing card, not a
headline. Verified via `getComputedStyle()` (12px→~18px at desktop width)
and confirmed visually at both 1440×900 and 390×844.

**2. Fixed chapter-nav pill overlapped the finale's own revisit links (P0).**
On short/narrow viewports, scrolling toward the dedication brings the
finale's in-page action row ("Replay the Journey" / "Revisit the
Memories" / "Read the Letter Again" / "Back to the Celebration") directly
under the fixed "08 / 08" chapter-nav control in the top-left corner.
Because the nav is `position: fixed` with `z-50`, it also *intercepts
taps* in the overlapping region — a real user could not reliably tap
"Back to the Celebration" there; the tap would hit the chapter-nav toggle
instead. Confirmed via `getBoundingClientRect()` on both elements, not
just screenshot appearance.

Fixed by reusing the site's own existing receding-chrome mechanism
(`.chrome-recede` / `data-aurora-hush`, already used to hide this same
nav during the candle's dark hold) rather than inventing new spacing:
[ChapterNav.tsx](src/components/ChapterNav.tsx) now sets
`data-finale-hush` on `<html>` while the finale (chapter 08, the site's
last chapter) is active, driven by the same `activeIndex` signal already
powering the "08 / 08" indicator — no new observer. `globals.css` extends
the existing `.chrome-recede` rule to also respond to
`data-finale-hush`. This both resolves the visual collision and restores
the tap target, and is explicitly in the spirit of "navigation may
recede during... final dedication." Verified the fade is fully
reversible (opacity returns to 1, `pointer-events` returns to `auto`)
when scrolling back out of the finale.

No other files were changed this pass.

## Mobile — exact resolutions tested

- 375×812 — clean, no layout breaks.
- 390×844 (primary) — clean; used for the finale nav-overlap investigation and fix verification.
- 430×932 — clean, no layout breaks.

Desktop 1440×900 was the primary desktop size used throughout the walkthrough.

## Accessibility — direct audit (no dedicated skill; performed manually)

- **Alt text**: all 5 real memory photographs (`memory-1`…`memory-5`, in
  [photoFraming.ts](src/components/chapters/photoFraming.ts)) have
  genuine, descriptive alt text scoped to what's visually in frame (no
  invented names/dates/feelings, per that file's own documented rule).
  Decorative/background images (Ch. 02's album background, the finale's
  ghost-photo duplicates) are correctly `alt=""` and/or wrapped in
  `aria-hidden="true"` containers, since their content is already
  conveyed as real text elsewhere.
- **Keyboard**: the chapter-nav panel supports Escape-to-close with focus
  return to its trigger button, `aria-expanded`/`aria-controls` on the
  toggle, `role="dialog"` on the panel, and 44px-minimum-height rows
  throughout (chapter list and hidden-message rows both use `min-h-11`).
- **Focus-visible**: a global `:focus-visible` outline (2px, warm gold,
  4px offset) is applied to all interactive elements in globals.css —
  not suppressed anywhere. A "Skip to content" link is present and
  correctly hidden until focused (`sr-only-focusable`).
- **Semantic markup**: chapters are `<section>`s with `aria-labelledby`
  pointing at their own heading; the finale's dedication is a real
  `<footer>`; the nav is a real `<nav aria-label="Chapters">`; an
  `aria-live="polite"` status region announces the active chapter.
- **Reduced motion**: respected in code throughout via the shared
  `useReducedMotion` hook (pinning, parallax and the seam-transition
  system in CosmicAtmosphere all explicitly branch on it, resetting
  scroll-driven CSS variables to 0). This preview tool does not expose a
  way to emulate `prefers-reduced-motion` live, so this was verified by
  code review, not by watching the reduced-motion experience render —
  stated explicitly rather than claimed as visually verified.
- **Contrast**: warm gold/cream text on near-black backgrounds throughout
  gives comfortably high contrast by design; no low-contrast text was
  found during the walkthrough (the one exception — the finale dedication
  — is the P0 fix above, which also improved its contrast ratio, not just
  its size).

## Basic metadata validation

`src/app/layout.tsx` — confirmed present and complete: `<title>`,
meta description, absolute `metadataBase`, canonical `alternates.url`,
Open Graph (title/description/siteName/url/locale/type, image supplied by
`opengraph-image.tsx`), Twitter card (`summary_large_image` with its own
title/description, image via `twitter-image.tsx`), and `favicon.ico`.
All required files exist on disk. This was a validation pass only, not a
full SEO project, per scope.

## Performance

No new profiling this pass (none of this pass's checks — CSS-only text
sizing/color, and a scroll-driven attribute already following an
established pattern — introduce new animation, layout thrashing, or
render cost). No obvious/measurable performance regressions observed
during the walkthrough at either desktop or mobile sizes.

## Console / Lint / TypeScript / Build

- Console: only expected dev-server noise this pass (HMR websocket
  reconnects) plus the known, pre-existing `/models/couple.glb` 404
  (explicitly deferred/out of scope for this project). No new errors.
- `npm run lint` — clean, no errors or warnings.
- `npx tsc --noEmit` — clean, no output.
- `npm run build` — production build succeeds (Turbopack, all routes
  static: `/`, `/_not-found`, `/opengraph-image`, `/twitter-image`).

## Remaining P0/P1 issues

None outstanding. The two P0s found this pass (finale dedication
legibility, nav/finale-actions overlap) were both fixed and verified.

The cake's WebGL "brown box" artifact, reported once by the user's own
browser and reproduced once previously in this sandbox at 1440×900, did
**not** reproduce this pass at the same size — the cake rendered cleanly
against pure black. Per standing instruction, this is reported honestly
as **not reproduced this pass**, not claimed as fixed, and no code was
changed chasing it without a real repro.

## Optional P2/P3 (not implemented — kept separate, speculative)

None identified as worth flagging. Everything found during this pass
that was a genuine defect (broken visual/UX) was P0 and has been fixed;
nothing speculative was pursued, per the "leave P3 alone" instruction.

## Local URL

`http://localhost:3000` — dev server left running for review.

## Deployment

**NOT DEPLOYED.** This remains a local-only review build, as instructed.
