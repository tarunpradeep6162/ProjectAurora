// Real content for Project Aurora, sourced faithfully from the master creative
// brief. Nothing here is placeholder copy — it is Tarun's real story, kept as-is.

export type Chapter = {
  id: string;
  number: string;
  title: string;
  hiddenMessage: string;
};

export const chapters: Chapter[] = [
  {
    id: "portal",
    number: "01",
    title: "Enter the universe",
    hiddenMessage:
      "A portal opens into a world made from love, light and memory.",
  },
  {
    id: "miracle",
    number: "02",
    title: "You are my favourite miracle",
    hiddenMessage:
      "A cinematic beginning for the person who made ordinary days feel extraordinary.",
  },
  {
    id: "story",
    number: "03",
    title: "Our story became a world",
    hiddenMessage:
      "Every conversation, every smile and every small moment left a light behind.",
  },
  {
    id: "journey",
    number: "04",
    title: "The journey between us",
    hiddenMessage:
      "Not a straight line, but a glowing path of memories, growth and choosing each other.",
  },
  {
    id: "memories",
    number: "05",
    title: "Memories suspended in time",
    hiddenMessage:
      "Moments drift around us like photographs that never learned how to fade.",
  },
  {
    id: "letter",
    number: "06",
    title: "A letter from my heart",
    hiddenMessage:
      "Some feelings deserve more than a message. They deserve a universe of their own.",
  },
  {
    id: "birthday",
    number: "07",
    title: "Happy Birthday, Dheepika",
    hiddenMessage:
      "May this new year of your life carry wonder, peace, laughter and all the love you deserve.",
  },
  {
    id: "finale",
    number: "08",
    title: "And this is only the beginning",
    hiddenMessage:
      "The universe grows quiet, but our story continues beyond the final star.",
  },
];

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
};

export const memories: Memory[] = [
  {
    id: "memory-1",
    src: "/images/memories/memory-1.jpg",
    width: 1600,
    height: 1067,
    title: "The Blue Himalayan.",
    caption: "The bike that carried most of the good stories.",
  },
  {
    id: "memory-2",
    src: "/images/memories/memory-2.jpg",
    width: 1240,
    height: 1245,
    title: "Travel With Your Soul.",
    caption: "Panniers on, rain in the hills, nowhere in particular to be.",
  },
  {
    id: "memory-3",
    src: "/images/memories/memory-3.jpg",
    width: 1240,
    height: 1554,
    title: "Cold Morning, Warm Coffee.",
    caption: "Helmet on, gloves on, the road still waking up.",
  },
  {
    id: "memory-4",
    src: "/images/memories/memory-4.jpg",
    width: 1400,
    height: 800,
    title: "Somewhere We Got Lost.",
    caption:
      "Neither of us knew where we were, and neither of us seemed to mind.",
  },
  {
    id: "memory-5",
    src: "/images/memories/memory-5.jpg",
    width: 800,
    height: 800,
    title: "The One I Would Keep.",
    caption:
      "If I were only allowed to keep one of these, it would be this one.",
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

export const site = {
  title: "Project Aurora",
  subtitle: "An Interactive Love Story",
  author: "Tarun",
  recipient: "Dheepika",
  birthday: "25 November",
  footer: "Created with love by Tarun — for Dheepika — 25 November",
};
