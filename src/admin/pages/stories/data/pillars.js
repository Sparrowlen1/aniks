
export const PILLARS = [
  {
    slug: 'arts-culture',
    label: 'Arts & Culture',
    color: 'gold',
    hex: '#E8A850',
    chipClass: 'bg-gold/15 text-gold',
    ringClass: 'ring-gold border-gold',
    description: 'African heritage, cultural exchange and collaborative artistic production.',
  },
  {
    slug: 'youth-migration',
    label: 'Youth & Migration',
    color: 'anika-green',
    hex: '#389A51',
    chipClass: 'bg-anika-green/15 text-anika-green',
    ringClass: 'ring-anika-green border-anika-green',
    description: 'Migration, belonging, refugee experience and relationships with host communities.',
  },
  {
    slug: 'expressions',
    label: 'Expressions',
    color: 'ink',
    hex: '#1A1208',
    chipClass: 'bg-ink/10 text-ink dark:bg-white/10 dark:text-cream',
    ringClass: 'ring-ink border-ink dark:ring-cream dark:border-cream',
    description: 'Creative entrepreneurship, collaborative production and art therapy.',
  },
  {
    slug: 'gender-equality',
    label: 'Gender Equality',
    color: 'coral',
    hex: '#EB4C47',
    chipClass: 'bg-coral/15 text-coral',
    ringClass: 'ring-coral border-coral',
    description: 'Gender equality, sexual and reproductive health, SGBV, rights, agency and healing.',
  },
  {
    slug: 'governance',
    label: 'Governance',
    color: 'anika-blue',
    hex: '#3A7599',
    chipClass: 'bg-anika-blue/15 text-anika-blue',
    ringClass: 'ring-anika-blue border-anika-blue',
    description: 'Human rights, civic responsibility, governance and democratic participation.',
  },
];

export function getPillar(slug) {
  // Map public slugs to admin slugs
  const mapping = {
    'arts-and-culture': 'arts-culture',
    'youth-and-migration': 'youth-migration',
  };
  const adminSlug = mapping[slug] || slug;
  return PILLARS.find((p) => p.slug === adminSlug) || null;
}

export const STATUS_STYLES = {
  published: 'bg-anika-green/15 text-anika-green',
  draft: 'bg-gold/15 text-gold',
  review: 'bg-anika-blue/15 text-anika-blue',
};

export const STATUS_LABELS = {
  published: 'Published',
  draft: 'Draft',
  review: 'For review',
};