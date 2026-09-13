/**
 * Presentation-only details for the real photographs in content.ts.
 * Kept here, not in content.ts, which holds Tarun's words and is never
 * edited.
 *
 * `focus` — CSS object-position that keeps the rider's face inside the
 * frame when a photograph is cropped to fill a viewport (portrait phone or
 * wide desktop).
 *
 * `alt` — strictly what is visible in each picture. No names, places,
 * dates or feelings that the picture itself does not show; the story's
 * own title and caption for each photo are rendered as visible text
 * beside it.
 */
export const photoFraming: Record<string, { focus: string; alt: string }> = {
  "memory-1": {
    focus: "47% 38%",
    alt: "A rider sitting on a blue Royal Enfield Himalayan on a quiet road lined with green trees.",
  },
  "memory-2": {
    focus: "46% 42%",
    alt: "A rider on a luggage-laden blue Himalayan in front of green hills under low cloud, with the words “Travel With Your Soul” across the sky.",
  },
  "memory-3": {
    focus: "56% 16%",
    alt: "A rider in a helmet, mirrored sunglasses and a yellow hoodie, seated on a loaded motorcycle beside a hillside road.",
  },
  "memory-4": {
    focus: "50% 45%",
    alt: "Snow-covered mountain peaks under a clear blue sky.",
  },
  "memory-5": {
    focus: "50% 55%",
    alt: "A ridge of red earth and a few dark green trees disappearing into fog.",
  },
};

export function focusFor(id: string): string {
  return photoFraming[id]?.focus ?? "50% 50%";
}
