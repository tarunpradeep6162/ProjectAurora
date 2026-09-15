// Real content for Project Aurora, sourced word for word from Tarun's deployed
// site (frontend-woad-pi-12.vercel.app) — including lines that only appear
// after an interaction there (hidden messages, photo notes, the birthday card),
// which were missed when this site was first rebuilt from the visible page.
// Nothing here is placeholder copy — it is Tarun's real story, kept as-is.

export type Chapter = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
};

export const chapters: Chapter[] = [
  {
    id: "portal",
    number: "01",
    title: "Enter the universe",
    subtitle:
      "A portal opens into a world made from love, light and memory.",
  },
  {
    id: "miracle",
    number: "02",
    title: "You are my favourite miracle",
    subtitle:
      "A cinematic beginning for the person who made ordinary days feel extraordinary.",
  },
  // Chapters 03 (Our story), 04 (The journey) and 05 (Memories) were merged
  // into this single chapter on request — a real 3D rolling/cylindrical
  // carousel (StoryCarousel.tsx) now carries all three: the five timeline
  // moments, the journey, and the five real photographs, as one continuous
  // scroll-driven ride rather than three separate chapters. Title/subtitle
  // kept verbatim from the original "story" chapter — genuine, unedited
  // content, not a new sentence written to summarise all three.
  {
    id: "story",
    number: "03",
    title: "Our story became a world",
    subtitle:
      "Every conversation, every smile and every small moment left a light behind.",
  },
  {
    id: "letter",
    number: "04",
    title: "A letter from my heart",
    subtitle:
      "Some feelings deserve more than a message. They deserve a universe of their own.",
  },
  {
    id: "birthday",
    number: "05",
    title: "Happy Birthday, Dheepika",
    subtitle:
      "May this new year of your life carry wonder, peace, laughter and all the love you deserve.",
  },
  {
    id: "finale",
    number: "06",
    title: "And this is only the beginning",
    subtitle:
      "The universe grows quiet, but our story continues beyond the final star.",
  },
];

/**
 * The former chapter 04's genuine title/subtitle — its own chapter entry is
 * gone (merged into "story", see `chapters` above), but the real words stay
 * available for the merged chapter's own accessible content and its
 * carousel's journey card, exactly as originally written.
 */
export const journey = {
  title: "The journey between us",
  subtitle:
    "Not a straight line, but a glowing path of memories, growth and choosing each other.",
};

/** The former chapter 05's genuine title/subtitle, kept the same way. */
export const memoriesIntro = {
  title: "Memories suspended in time",
  subtitle:
    "Moments drift around us like photographs that never learned how to fade.",
};

export type TimelineEntry = {
  number: string;
  title: string;
  line: string;
};

export const timeline: TimelineEntry[] = [
  {
    number: "01",
    title: "First Meeting",
    line: "The world went quiet, and there you were.",
  },
  {
    number: "02",
    title: "First Conversation",
    line: "A simple hello that never really ended.",
  },
  {
    number: "03",
    title: "First Adventure",
    line: "We went looking for the world and found each other.",
  },
  {
    number: "04",
    title: "The Hard Days",
    line: "Even the rain could not wash this away.",
  },
  {
    number: "05",
    title: "Celebration",
    line: "And every year, the light comes back for you.",
  },
];

export type Memory = {
  id: string;
  src: string;
  width: number;
  height: number;
  title: string;
  caption: string;
  /** The small line that stood in for a date on the original site. */
  place: string;
  /** Tarun's personal note on the photograph. */
  note: string;
};

export const memories: Memory[] = [
  {
    id: "memory-1",
    src: "/images/memories/memory-1.jpg",
    width: 1600,
    height: 1067,
    title: "The Blue Himalayan",
    caption: "The bike that carried most of the good stories.",
    place: "Somewhere green",
    note: "Every road on this list started here.",
  },
  {
    id: "memory-2",
    src: "/images/memories/memory-2.jpg",
    width: 1240,
    height: 1245,
    title: "Travel With Your Soul",
    caption: "Panniers on, rain in the hills, nowhere in particular to be.",
    place: "Loaded up and gone",
    note: "The best trips were never the planned ones.",
  },
  {
    id: "memory-3",
    src: "/images/memories/memory-3.jpg",
    width: 1240,
    height: 1554,
    title: "Cold Morning, Warm Coffee",
    caption: "Helmet on, gloves on, the road still waking up.",
    place: "Somewhere up in the ghats",
    note: "You always said I looked ridiculous in that hoodie.",
  },
  {
    id: "memory-4",
    src: "/images/memories/memory-4.jpg",
    width: 1400,
    height: 800,
    title: "Somewhere We Got Lost",
    caption:
      "Neither of us knew where we were, and neither of us seemed to mind.",
    place: "Somewhere far from home",
    note: "I would get lost with you again tomorrow.",
  },
  {
    id: "memory-5",
    src: "/images/memories/memory-5.jpg",
    width: 800,
    height: 800,
    title: "The One I Would Keep",
    caption:
      "If I were only allowed to keep one of these, it would be this one.",
    place: "A night worth keeping",
    note: "Out of all of it. This one.",
  },
];

export const loveLetter = {
  salutation: "Dheepika,",
  paragraphs: [
    "I have started this letter about nine times. Every version began somewhere different. Every one of them ended up here anyway.",
    "Thank you for the days that were not about anything. No occasion, nowhere to be, nothing worth reporting. Those are the ones I have kept.",
    "I am not going to promise you a year without hard parts. I will promise you never carry them by yourself. That part has never been in question.",
    "Happy birthday. I hope today feels like a beginning. Being near you always has.",
  ],
  signOff: "Always,",
  signature: "Tarun",
  closingDetail: "You turned the page over. Of course you did.",
};

/** The birthday card and wish copy from the candle chapter. */
export const birthdayCard = {
  /** The name on the cake's gold plaque. */
  name: "Dheepika",
  lines: [
    "Happy Birthday",
    "Dheepika",
    "May this year be as kind to you as you are to everyone else",
    "And may I be there for all of it",
  ],
  wishPrompt: "Make a wish",
  wishAction: "Blow out the candles",
  /** The label the trigger carries once the wish has been made. */
  wishDone: "Happy birthday, Dheepika",
};

export type HiddenMessage = {
  /**
   * Position along the whole story, 0-1, as authored on the original site
   * (eight messages, evenly spread — originally one per chapter, back when
   * there were eight chapters). Positions themselves are untouched by the
   * chapters 03-05 merge (HiddenMessages.tsx's `chapterIndexFor` derives a
   * message's chapter generically from `chapters.length`, whatever that is)
   * — the merged "story" chapter now simply owns however many of these
   * eight positions land inside its now-larger span, rather than exactly
   * one.
   */
  position: number;
  /** Which margin it sits in — the original alternated sides. */
  side: "left" | "right";
  message: string;
};

export const hiddenMessages: HiddenMessage[] = [
  { position: 0.09, side: "left", message: "You are the best thing that ever happened to me by accident." },
  { position: 0.21, side: "right", message: "I still get nervous before I see you. I hope that never stops." },
  { position: 0.34, side: "left", message: "You make me want to be someone worth staying with." },
  { position: 0.46, side: "right", message: "Thank you for being patient with me on the days I was not easy." },
  { position: 0.58, side: "left", message: "I would choose this again. All of it. Without thinking." },
  { position: 0.69, side: "right", message: "You are the person I want to tell things to first." },
  { position: 0.83, side: "left", message: "I am so proud of you. I hope you know that already." },
  { position: 0.95, side: "right", message: "Whatever comes next, I am not going anywhere." },
];

export const site = {
  title: "Project Aurora",
  subtitle: "An Interactive Love Story",
  author: "Tarun",
  recipient: "Dheepika",
  birthday: "25 November",
  footer: "Created with love by Tarun — for Dheepika — 25 November",
};
