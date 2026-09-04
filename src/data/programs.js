import { PILLARS } from "./pillars"

export const programContent = {
    'arts-and-culture' : {
        description: 'Promotes African heritage, cultural exchange and collaborative artistic production across disciplines and borders. We believe African art traditions are living, evolving expressions of identity, community and imagination.',
        howWeWork: [
            'Poetry and spoken word',
            'Visual art exhibitions',
            'Cross-border collaborations',
            'Artist residencies',
            'Cultural exchange programmes'
        ],
        quote: 'Create what the world still needs.',
        image: '/RAYA1.jpg'
    },
    'youth-and-migration': {
        description: 'Uses art and storytelling to explore migration, belonging, refugee experiences and relationships with host communities. Beyond every label is a story society has not fully heard.',
        howWeWork: [
            'Storytelling workshops',
            'Community Theatre',
            'Documentary Production',
            'Dialogue Forums',
            'Peer creative mentorship'
        ],
        quote: 'Tell beyond the label.',
        image: '/image1.jpg'
    },
    'expressions': {
        description: 'Creates room for artists to explore, create and evolve through collaborative production, creative entrepreneurship and art therapy. A thriving, creative ecosystem needs artists who can create, earn, collaborate and contribute. ',
        howWeWork: [
            'Art therapy sessions',
            'Creative entrepreneurship training',
            'Collaborative production labs',
            'Open mic platforms',
            'Artist development workshops'
        ],
        quote: 'Create. Air it. Move something.',
        image: '/image11.jpg'
    },
    'gender-equality': {
        description: 'Creates safe spaces for conversations on gender eqality, sexual and reproductive health, SGBV, rights, agency and healing. What has been pushed to silence deserves space without surrendering dignity.',
        howWeWork: [
            'Safe dialogue circles',
            'Theatre for advocacy',
            'Healing-centred arts',
            'Policy engagement forums',
            'Community storytelling'
        ],
        quote: 'Own the story. Open the conversation',
        image: '/image3.jpg'
    },
    'governance' : {
        description: 'Uses artistic and dialogue platforms to deepen youth engagement with human rights, civic responsibility, governance and democratic participation. Sometimes, change begins when we finally create room to talk about what has remained unsaid.',
        howWeWork: [
            'Youth civic engagement',
            'Human rights theatre',
            'Community dialogue forums',
            'Peacebuilding arts',
            'Democratic participation campaigns'
        ],
        quote: 'Join the conversation',
        image: '/image2.jpg'
    },
};

// merging pillars with programContent
export const programs = PILLARS.map((pillar) => ({
  id: pillar.slug,
  order: PILLARS.indexOf(pillar) + 1,
  letter: pillar.letter,
  accentClass: pillar.accentClass,
  title: pillar.name,
  subtitle: pillar.tagline,
  ...programContent[pillar.slug],
}));