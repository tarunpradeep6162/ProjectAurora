"use client";

/**
 * How fast StoryCarousel.tsx's ring is currently turning, in radians per
 * second — a plain mutable module value, not React state, read every
 * frame by StoryPostFX.tsx's velocity-driven chromatic aberration and
 * written every frame by StoryCarousel.tsx. Same "mutate a shared object,
 * read it in useFrame" convention sceneProgress.ts already established
 * for this project (see that file's own header comment): this needs to
 * change far more often than any React re-render should, and the two
 * components are siblings in the tree, not parent/child, so a prop can't
 * carry it either.
 */
export const carouselVelocity = { value: 0 };
