/**
 * The birthday chime — recovered from the live site's ExperienceCanvas
 * bundle, not invented. It is a sustained chord pad, not a struck jingle:
 * nine oscillators voicing a C major chord across three octaves (the
 * original's exact frequencies and waveforms), which fade in and out in
 * three tiers rather than all playing at once:
 *
 *   bass    C3, G3            sine       — rises as the candles come into frame
 *   mid     C4, E4, G4        sine       — rises once every candle is fully lit
 *   sparkle C5, E5, G5, C6    triangle   — the wish itself: rises only after
 *                                          the candles are blown out
 *
 * All three duck under the scene's own held darkness (the same `dim` curve
 * the visuals already use) and are capped well below `birthday.mp3`'s own
 * volume — this is a texture under the song, not a second track.
 *
 * One AudioContext for the whole page, created lazily on the first real
 * user gesture (browsers block it otherwise) and never recreated; the nine
 * oscillators start once and run silently (gain 0) until they're needed,
 * the same way the original kept its voices always running and only ever
 * moved their gain.
 */

type Voice = { gain: GainNode };

type Engine = {
  ctx: AudioContext;
  master: GainNode;
  bass: Voice[];
  mid: Voice[];
  sparkle: Voice[];
};

/** [frequency Hz, waveform, cents of detune] — the original's exact voicing. */
const BASS_VOICES: [number, OscillatorType, number][] = [
  [130.8, "sine", 4], // C3
  [196, "sine", -5], // G3
];
const MID_VOICES: [number, OscillatorType, number][] = [
  [261.6, "sine", 6], // C4
  [329.6, "sine", 6], // E4
  [392, "sine", 6], // G4
];
const SPARKLE_VOICES: [number, OscillatorType, number][] = [
  [523.3, "triangle", -5], // C5
  [659.3, "triangle", -5], // E5
  [784, "triangle", -5], // G5
  [1046.5, "triangle", -5], // C6
];

/** Ceilings — deliberately tiny; this must never compete with the song. */
const BASS_PEAK = 0.028;
const MID_PEAK = 0.024;
const SPARKLE_PEAK = 0.02;

let engine: Engine | null = null;
let starting = false;

function buildVoice(
  ctx: AudioContext,
  destination: AudioNode,
  [freq, type, detune]: [number, OscillatorType, number]
): Voice {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  osc.connect(gain).connect(destination);
  osc.start();
  return { gain };
}

/**
 * Creates the AudioContext and starts every oscillator. Must be called from
 * inside a genuine user-gesture handler (a click, a tap, a keypress) — see
 * `installUnlockListener` below. Safe to call repeatedly: every call after
 * the first is a no-op (or, if the context exists but was suspended by the
 * browser, just resumes it).
 */
export function ensureChimeStarted() {
  if (engine) {
    if (engine.ctx.state === "suspended") void engine.ctx.resume();
    return;
  }
  if (starting || typeof window === "undefined") return;
  const AudioContextCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioContextCtor) return;
  starting = true;
  try {
    const ctx = new AudioContextCtor();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    engine = {
      ctx,
      master,
      bass: BASS_VOICES.map((v) => buildVoice(ctx, master, v)),
      mid: MID_VOICES.map((v) => buildVoice(ctx, master, v)),
      sparkle: SPARKLE_VOICES.map((v) => buildVoice(ctx, master, v)),
    };
  } catch {
    // Web Audio unavailable or blocked — the chime is an enhancement, not
    // content; failing silently leaves everything else untouched.
    engine = null;
  } finally {
    starting = false;
  }
}

/**
 * Attaches a one-time listener that starts the chime engine on the
 * visitor's first pointer/keyboard interaction anywhere on the page, then
 * removes itself. Idempotent — safe to call from every mount of the cake
 * chapter; only the first call's listener ever does anything.
 */
let unlockInstalled = false;
export function installChimeUnlock() {
  if (unlockInstalled || typeof window === "undefined") return;
  unlockInstalled = true;
  const onGesture = () => {
    ensureChimeStarted();
    window.removeEventListener("pointerdown", onGesture);
    window.removeEventListener("keydown", onGesture);
  };
  window.addEventListener("pointerdown", onGesture, { once: true });
  window.addEventListener("keydown", onGesture, { once: true });
}

/** Internal smoothed levels, so `update()` can lerp rather than snap. */
const level = { master: 0, bass: 0, mid: 0, sparkle: 0 };

/**
 * Called once a frame while the cake chapter is live. Every input is 0-1:
 *  - `approach`  how present the cake/candles are (drives the bass pad)
 *  - `deep`      how far past "fully lit" the entrance is (drives the mid pad)
 *  - `celebrate` how far into the post-wish moment we are (drives the sparkle)
 *  - `brightness` the scene's own `dim` value — the whole chime ducks with it
 *  - `audible`   the visitor has turned the site's own music on
 */
export function updateChime(
  { approach, deep, celebrate, brightness, audible }: {
    approach: number;
    deep: number;
    celebrate: number;
    brightness: number;
    audible: boolean;
  },
  dt: number
) {
  if (!engine) return;
  const k = 1 - Math.exp(-dt * 2.2);

  level.master += ((audible ? 1 : 0) - level.master) * k;
  level.bass += (approach - level.bass) * k;
  level.mid += (deep - level.mid) * k;
  level.sparkle += (celebrate - level.sparkle) * k;

  engine.master.gain.value = level.master;

  // The bass/mid pad tracks the candles' own presence, so it recedes with
  // them through the held darkness — but the sparkle tier is the wish
  // chime itself, and that is exactly the small sound meant to carry
  // through that darkness before the stars return, so it is deliberately
  // left un-ducked here.
  const bassGain = level.bass * brightness * BASS_PEAK;
  engine.bass.forEach((voice) => (voice.gain.gain.value = bassGain));

  const midGain = level.mid * brightness * MID_PEAK;
  engine.mid.forEach((voice) => (voice.gain.gain.value = midGain));

  const sparkleGain = level.sparkle * SPARKLE_PEAK;
  engine.sparkle.forEach((voice) => (voice.gain.gain.value = sparkleGain));
}
