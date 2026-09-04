// src/data/pillars.js
export const PILLARS = [
  {
    slug: 'arts-and-culture',
    name: 'Arts & Culture',
    letter: 'A',
    tagline: 'Authenticity + Nobility',
    accentClass: 'coral',
  },
  {
    slug: 'youth-and-migration',
    name: 'Youth & Migration',
    letter: 'N',
    tagline: 'Nobility + Inclusive Impact',
    accentClass: 'anika-green',
  },
  {
    slug: 'expressions',
    name: 'Expressions',
    letter: 'E',
    tagline: 'Kuumba',
    accentClass: 'gold',
  },
  {
    slug: 'gender-equality',
    name: 'Gender Equality',
    letter: 'G',
    tagline: 'Inclusive Impact',
    accentClass: 'anika-blue',
  },
  {
    slug: 'governance',
    name: 'Governance',
    letter: 'V',
    tagline: 'Adaptability',
    accentClass: 'ink',
  },
];

export const pillarColors = Object.fromEntries(
  PILLARS.map((p) => [p.slug, p.accentClass])
);

export function getPillarBySlug(slug) {
  return PILLARS.find((p) => p.slug === slug);
}

export function getPillarByName(name) {
  return PILLARS.find((p) => p.name === name);
}