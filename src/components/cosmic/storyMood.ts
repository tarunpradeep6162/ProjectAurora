"use client";

/**
 * Small shared "how does this beat of the story feel right now" signals —
 * same plain-mutable-object convention as carouselVelocity.ts, written by
 * whichever object already computes the real number and read by whichever
 * other object needs to react to it, without either subscribing to the
 * other's re-renders or duplicating the computation.
 *
 * All three exist to let StoryPostFX.tsx's post-processing stack (bloom,
 * depth of field) react to what the *carousel and plant already know* about
 * the current beat, rather than re-deriving a second, possibly-drifting
 * guess from chapterProgress on its own — the same lesson StoryPlantWall.tsx
 * already learned once for its own Hard Days mood (see that file's
 * HARD_DAYS_CARD_INDEX comment).
 */
export const storyMood = {
  /** 0-1, smoothed: the "Hard Days" memory is currently the carousel's front
   * card. Written by StoryPlantWall.tsx (which already computes this against
   * the carousel's real active card for its own light/sparkle dip), read by
   * StoryCarousel.tsx (a touch more rotational damping — movement itself
   * slows, not just the light) and StoryPostFX.tsx (bloom eases back). */
  hardDays: 0,
  /**
   * 0-1: the chapter's own closing "gravity" window (chapterProgress
   * 0.82-0.96 — see StoryCarousel.tsx's own `closing`). This is also where
   * the real final "Ordinary Days" card (memory-5, the 11th and last of 11)
   * actually sits at the carousel's front: at ~1/10 spacing per card, card
   * #11 is only at front from roughly chapterProgress 0.95 onward, already
   * inside this same window and inside the presence fade-out that begins at
   * 0.96. A second, separate "Ordinary Days mood" would have been dimming
   * the same few seconds a second time — this one value already covers
   * both beats the brief asked to quiet.
   */
  closing: 0,
  /** 0-1, decaying: mirrors StoryCarousel.tsx's own `focusPulseRef` — a card
   * just reached the front. StoryPostFX.tsx reads it for a brief, subtle
   * reduction in background blur right as the pulse lands, so the shot
   * reads as "snapping into focus" rather than the pulse being the only
   * cue. */
  cardFocus: 0,
  /** 0-1, decaying: the signature occlusion cut (StoryCarousel.tsx's
   * OCCLUSION_CARD_INDEX) is in progress — one specific card is swelling
   * toward the camera. StoryPostFX.tsx reads it to spike DoF's bokeh
   * spread further than the passing card's own near-camera blur already
   * gives it, so the moment reads unmistakably as "thrown out of focus"
   * rather than just "big." */
  occlusion: 0,
};
