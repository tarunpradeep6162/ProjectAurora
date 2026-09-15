# Aurora Shot List

A working reference for the existing experience's real camera/light/sound behavior, not a spec for a rebuild. Camera values are read directly from `CAMERA_KEYS` in [CosmicScene.tsx](src/components/cosmic/CosmicScene.tsx) — one authored pose per chapter, glided between on a monotone cubic spline (z only ever decreases; no reverses). This document is the implementation plan for this pass, not a separate design exercise — see the "This pass" line under each shot for what actually changed.

| | SHOT 01 | SHOT 02 | SHOT 03 | SHOT 04 | SHOT 05 | SHOT 06 |
|---|---|---|---|---|---|---|
| **Scene** | Portal | Miracle | Story (carousel + plant) | Letter | Birthday / Candle | Finale |
| **Shot type** | Wide, static hold | Slow dolly-in | Continuous drift, ring rotates independently | Lock | Push-in → blackout → reveal | Extreme pull-back |
| **Subject** | Starfield / distant nebula | Couple figure | StoryPlantWall (fixed origin) + StoryCarousel ring | The words | The flame, then the cake | The whole universe, receding |
| **Camera start** | x0 y0 z9, pitch 0.6°, fov50, drift 1 | x0.18 y0.12 z8 | x0.25 y0.4 z5.4, fov49, drift0.62 | x-0.02 y0.58 z3.8, drift0.12 | x-0.04 y0.6 z3.6, drift0.08 | x0 y1.2 z2.6 |
| **Camera end** | → Miracle key | → Story key | → Letter key | → Birthday key | → Finale key | (terminal) |
| **Camera target** | look-ahead, no fixed subject | couple figure | world origin (plant), always | the letter body | flame / cake | receding into black |
| **Focal distance** | n/a (no DoF here) | n/a | DoF locked to origin (plant), bokehScale 4, softened per-card via `storyMood.cardFocus` (**this pass**) | n/a (no DoF; CSS-only) | n/a | n/a |
| **Focus change** | — | — | Brief bokeh tighten on each card's "locks into focus" pulse (**this pass**) | — | — | — |
| **Key light** | ambient + directional (people-only) | directional 0.55 | plant key/rim pointlights, dimmed 45% during Hard Days | none (CSS warmth only) | candle flame / cake key | — |
| **Background light** | 2100 stars, nebula | + MiracleNebula | Bloom 0.7 base, eased to 0.35 floor during Hard Days + the closing/gravity window (**this pass**) | `letter-hush` near-black wash | `data-aurora-hush` full blackout | ghost photographs, deepest grade |
| **Foreground element** | dust shell near edge (z≈6) | — | ring cards passing near-axis; front card depth-scaled | — | smoke rising post-blow | 3 ghost memories cross-dissolving |
| **Motion** | idle float + pointer parallax (drift 1, strongest here) | drift 0.85 | ring rotation (chapterProgress-driven) + idle spin; damping heavies during Hard Days (**this pass**) and the 0.82-0.96 gravity window | drift 0.12 (near-still) | drift 0.08 (near-still) | drift 0.6, largest positional travel of the whole arc |
| **Audio** | base volume (0.35) | base | base, hushing 0.82→0.98 into Letter (bridge, built prior pass) | 0.12 (quiet) | 0.55×base while lit, 0.04 during blackout, restored after reveal (**this pass**) | base (unchanged this pass) |
| **Duration / scroll range** | chapterAnchor 0/5 | 1/5 | 2/5 (pinned, `CARD_COUNT*90%`) | 3/5 | 4/5 (CSS-timed: 650ms flame-out, 950ms hold, 1500ms stars, 1100ms universe) | 5/5 |
| **Transition in** | — | continuous glide | continuous glide | continuous glide + audio bridge | continuous glide | continuous glide |
| **Transition out** | continuous glide | continuous glide | continuous glide, ring converges (radius ×0.38) into Letter | continuous glide, `letter-light` seam | hard cut to black, then 3-stage return (stars → universe → reveal) | (site end / replay) |
| **Emotional purpose** | discovery, ambiguous scale | recognition | growth, told through 11 real moments — Hard Days weighted heavier, Ordinary Days effectively absorbed into the closing gravity beat (see note below) | vulnerability, stillness | anticipation → the cut → wonder | release, scale |
| **Desktop framing** | full drift + parallax | — | RADIUS 3.0 (camera z never <4.4 in this chapter, confirmed by simulation) | 42rem reading column | full 3D cake | full pull-back |
| **Mobile framing** | parallax off (touch) | — | RADIUS ×0.8, 170 leaves vs 420 | narrower gutter, same column logic | CSS candle fallback (no WebGL cake if `lowPower`/`cakeLost`) | unchanged |

## A genuine timing discovery (why there's no separate "Ordinary Days mood")

The brief asked for Ordinary Days (the last of 11 carousel cards — the final real photograph) to become the chapter's quietest shot. Checking the actual numbers: with `CARD_COUNT=11` cards spaced evenly across `chapterProgress`, card #11 only reaches the carousel's front once `chapterProgress` is already ≈0.95–1.0 — which is already inside the existing Gravity closing window (0.82–0.96) and the presence fade-out (0.96–1). Building a second, separate quieting system for Ordinary Days would have dimmed the same few seconds a second time. Instead, `storyMood.closing` (this pass) is the one value both beats now share — Bloom eases back for both simultaneously, which is what actually happens on scroll.

## This pass's real changes (Milestone A-equivalent — camera/light reactivity)

1. **`storyMood.ts`** (new) — shared mood signals (`hardDays`, `closing`, `cardFocus`) so the post-processing stack reacts to what the carousel/plant already track, instead of a constant intensity for the whole chapter.
2. **Hard Days weight** — the existing light/sparkle dip now also slows the ring's own rotation (StoryCarousel damping) and eases Bloom back (StoryPostFX), so "the moment feels different" is felt in movement and light together, not light alone. Sound stays untouched — no melodrama, per the brief.
3. **Gravity / Ordinary Days shared quieting** — Bloom eases toward a floor across the same 0.82–0.96 window the ring's radius/damping already contract through.
4. **Rack-focus reinforcement** — DoF's bokeh spread ticks down briefly exactly as a card's existing "locks into focus" pulse fires, so the beat reads as background-softens → snap-clear → pulse, not just a scale/colour pop.
5. **Candle sound headroom** — background music now drops to 55% while the candle is lit (was full volume) and to near-silent for the entire held-darkness → stars → universe sequence (reusing `data-aurora-hush`, already set/cleared by CandleInteraction.tsx), restoring once the wish is revealed.

## Deliberately not rebuilt this pass

The brief's Part 14 ("CANDLE → BLACK → FIRST STAR → UNIVERSE AWAKENING") already exists almost exactly as specified in [CandleInteraction.tsx](src/components/CandleInteraction.tsx) — a 950ms held-darkness phase (brief's own 700-1200ms window), then staged stars (1500ms), then universe return (1100ms), all via plain timers, `prefers-reduced-motion`-safe. Rebuilding it under a new name would be pure churn. The Letter→Birthday "one warm light carries across the seam" technique (`--seam-lastlight` / `letter-light`) also already exists. Not attempted this pass: a literal camera-behavior taxonomy layered onto `CAMERA_KEYS` (the existing chapter-anchored spline already satisfies "every movement is motivated — never moves just because scroll changed," so a bigger abstraction risked being ceremony over substance), the Dheepika star-text formation (explicitly marked remove-if-cheap in the brief; not attempted rather than risk a cheap-looking result), the signature occlusion cut, and the mobile "director's cut" pass — all real, sizeable, and better done as their own scoped passes than bolted on here.
