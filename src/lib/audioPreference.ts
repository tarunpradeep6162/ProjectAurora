/**
 * Whether the visitor has turned the site's own music on (`SiteAudioPlayer`).
 * A plain module-level flag rather than React state — every reader here
 * (the birthday chime) already polls per animation frame the same way
 * `sceneProgress.ts`'s consumers do, so a subscription would be unused
 * machinery. Written once, from one place.
 *
 * The chime respects this rather than having its own on/off: if the
 * visitor chose quiet, nothing here should unexpectedly make sound either.
 */
let siteAudioOn = false;

export function setSiteAudioOn(on: boolean) {
  siteAudioOn = on;
}

export function isSiteAudioOn(): boolean {
  return siteAudioOn;
}
