import { PILLARS, pillarColors } from "../../../data/pillars";

// For Filter Bar
export const pillars = [...PILLARS.map((p) => p.name)];

//Color lookup
export { pillarColors };

export const stories = [
  {
    id: "sema-anika-forum",
    slug: "sema-anika-forum",
    pillar: "arts-and-culture",
    date: "2026-02-25",
    title: "When a room becomes a stage for honest conversation",
    excerpt:
      "Inside the Sema-Anika Forum, spoken word turns silence into shared testimony, and a packed room learns to listen differently.",
    image: "/image5.jpg",
    body: [
      "The Sema-Anika Forum started as a single open-mic night and has since become one of ANIKA's most requested gatherings, a room where spoken word is treated as testimony, not performance.",
      "Poets take the floor one at a time, no set list, no rehearsal notes. What comes out is unfiltered: grief, joy, anger, hope, sometimes all in the same three minutes. The audience doesn't clap politely and move on, they respond, they sit with it, they carry it out the door with them.",
      "That's the point. ANIKA built the Forum on the idea that art doesn't need to be polished to matter, it needs to be honest. And honesty, said out loud in a room full of people willing to listen, is its own kind of change.",
    ],
  },
  {
    id: "refupoet-belonging",
    slug: "refupoet-belonging",
    pillar: "youth-and-migration",
    date: "2026-01-18",
    title: "A generation building belonging across borders",
    excerpt:
      "Through Refupoet, young refugees and host-community artists trade verses instead of assumptions and start writing a shared future.",
    image: "/image7.jpg",
    body: [
      "Refupoet pairs young refugees with host-community artists for joint writing sessions, not as a one-off workshop, but as an ongoing exchange where both sides show up to write, perform, and listen to each other.",
      "The verses that come out of it aren't about explaining refugee experience to an outside audience. They're conversations between two people figuring out what they have in common, line by line, session by session.",
      "Participants have gone on to perform together at community events across the region, but the real work happens earlier, in the sessions where assumptions get traded for actual stories, and strangers become collaborators.",
    ],
  },
  {
    id: "air-it-out",
    slug: "air-it-out",
    pillar: "gender-equality",
    date: "2025-11-03",
    title: "Naming what silence protects",
    excerpt:
      "The Air It Out campaign gives survivors and allies a stage to say what community whispers usually bury, because #SilenceKills.",
    image: "/image8.jpg",
    body: [
      "Air It Out started from a simple observation: in most communities, the loudest response to gender-based violence is silence. Not because people don't know, because saying it out loud is treated as more dangerous than the harm itself.",
      "The campaign flips that. Survivors and allies are given a real stage, through public readings, recorded testimony, and community screenings, to say plainly what's usually only whispered. No euphemisms, no soft framing.",
      "It's uncomfortable by design. ANIKA's position is that comfort has protected silence for long enough, and #SilenceKills isn't a slogan, it's the whole argument for why this work has to be loud.",
    ],
  },
];