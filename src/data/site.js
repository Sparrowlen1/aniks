/* ============================================================
   ANIKA — Centralized content / data layer
   Sources: ANIKA Brand Guide + ECI Problem Statement (Moringa.document).
   ============================================================ */

/* Images are served from the public/ folder via "/..." URL paths (see Vite public asset handling).
   NOTE: the following map to temporary/candidate files where the original source image is not yet
   present in public/ — flagged with "TODO: replace" so they can be swapped for the real files.
   - try-my-shoe   (was ../images/smiles.jpg)          -> /singer.jpg  [TODO: replace]
   - griphon       (was ../images/griphon.jpg)         -> /image5.jpg  [TODO: replace]
   - gaining-grip  (was ../images/Camera Gaining Grip.jpg) -> /image6.jpg [TODO: replace]
   - civic-forum   (was ../images/ANIKA -32 (1).jpg)   -> /image9.jpg  [TODO: replace]
*/
export const imagery = {
  hero: '/listener.jpg',
  team: '/anika team.jpg',
};

/* --------------------------- BRAND FOUNDATIONS --------------------------- */
export const brand = {
  name: 'ANIKA',
  brandName: 'ANIKA Initiative',
  descriptor: 'A Pan-African Art-Based Initiative',
  legalEntity: 'Anika Creatives Association',
  essence: 'Art Airs.',
  mantra: 'Silence Kills.',
  mission: 'Changing the world, Art at a time.',
  vision:
    'A society made better through the immense potential of art in all its forms to effect positive change.',
  ethicalRule: 'Open, Never Expose.',
  invitation: 'Air It Out.',
  founded: 2015,
  formalised: '2 January 2022',
  tagline:
    'We use artistic expression, dialogue and people-centred creative approaches to bring lived realities into the open, strengthen artists and communities, and create possibilities for positive social change.',
  about:
    'ANIKA Initiative is a Pan-African art-based initiative whose journey began in 2015 with a gathering of seven poets and rappers seeking to find and amplify their voices. From that initial sitting emerged a formal founding team of one founder and three co-founders. ANIKA uses artistic expression, dialogue and people-centred creative approaches to bring lived realities into the open, strengthen artists and communities, and create possibilities for positive social change.',
  whatsappNumber: '254702839983',
  objectives: [
    'Empower artists for sustainable success and self-sufficiency in their careers.',
    'Be a thought leader in the use of art for positive social change and social transformation across Africa.',
  ],
  social: {
    linktree: 'https://linktr.ee/anikasocials',
    linktreeLabel: 'linktree.com/anikasocials',
    instagram: '@Anikainitiative_',
    facebook: '@Anikainitiative',
    twitter: '@Anikainitiative',
    email: 'info@anikainitiative.com',
    altEmail: 'anika.silencekills@gmail.com',
    whatsapp: '+254 702 839 983',
  },
};
/* --------------------------- BRAND STORY (Petals -> ANIKA) --------------------------- */
export const brandStory = [
  {
    heading: 'From Petals to ANIKA',
    text: 'Our journey began in 2015 with a sitting of seven creatives — poets and rappers — who came together while still finding their individual and collective voices. From that original gathering, ANIKA took shape under a founding team of one founder and three co-founders, united by a shared desire to use art to create room for difficult but necessary conversations.',
  },
  {
    heading: 'Airing the dirty linen',
    text: 'In Kiswahili, anika speaks to the act of opening something up — airing it. For us it became a metaphor for airing the dirty linen: bringing into the open the experiences we had been taught to hide, acknowledging our wounds, and moving towards healing rather than silence.',
  },
  {
    heading: 'Growing with the conversations',
    text: 'We began with two years of monthly forums on sexual and gender-based violence. As people opened up, those conversations revealed questions of mental health, identity, power, justice, leadership and belonging. ANIKA grew with them — from SGBV to mental health, to governance, to peacebuilding.',
  },
  {
    heading: 'An invitation to speak',
    text: 'On 2 January 2022, the journey entered a new chapter with the formalisation of Anika Creatives Association. Yet the principle that gave birth to ANIKA has remained constant: Silence Kills. We believe art can interrupt harmful silence by giving language and form to lived experience — creating room for dialogue, connection, learning and possibility.',
  },
];

/* --------------------------- A.N.I.K.A. VALUES --------------------------- */
export const anikaValues = [
  {
    letter: 'A',
    name: 'Authenticity',
    meaning: 'We honour truth and lived experience, communicating honestly and centring dignity without manufacturing narratives for attention.',
    reminder: 'Speak the truth. Honour the story.',
  },
  {
    letter: 'N',
    name: 'Nobility',
    meaning: 'We act with integrity, moral courage, fairness and respect for human dignity.',
    reminder: 'Do what is right. Do it with dignity.',
  },
  {
    letter: 'I',
    name: 'Inclusive Impact',
    meaning: 'We seek meaningful change while asking who participates, whose voice is heard and who benefits.',
    reminder: 'No one should disappear from the story of change.',
  },
  {
    letter: 'K',
    name: 'Kuumba (Creativity)',
    meaning: 'We create, shape and imagine possibilities through artistic and people-centred approaches.',
    reminder: 'Create what the world still needs.',
  },
  {
    letter: 'A',
    name: 'Adaptability',
    meaning: 'We evolve with context, evidence and community feedback without losing our purpose.',
    reminder: 'Stay rooted. Keep moving.',
  },
];

/* --------------------------- METHODOLOGIES --------------------------- */
export const methodologies = [
  {
    title: 'Artistic Expression',
    text: 'Poetry, spoken word, music, theatre, visual art, storytelling and multidisciplinary practice make experiences and ideas visible, felt and discussable.',
    accent: 'coral',
  },
  {
    title: 'Cultural Exchange',
    text: 'We bring artists and communities across cultures and borders together to co-create, exchange knowledge and build mutual understanding.',
    accent: 'gold',
  },
  {
    title: 'Design Thinking',
    text: 'Consultative, people-centred processes to understand needs, pains, gains and aspirations — then co-create responses with communities.',
    accent: 'blue',
  },
  {
    title: 'Dialogue',
    text: 'Art becomes an opening into deeper conversations among artists, communities, practitioners, partners and decision-makers.',
    accent: 'green',
  },
  {
    title: 'Art Therapy',
    text: 'Structured creative processes that support reflection, emotional expression and well-being within safeguarded programme contexts.',
    accent: 'coral',
  },
];

/* --------------------------- FLAGSHIP PROGRAMS --------------------------- */
export const flagshipPrograms = [
  { title: 'Sema-Anika Forum', text: 'Flagship spoken-word dialogue forums on violence, mental health and healing, engaging 2,500+ people to date.' },
  { title: 'Gaining Grip Experience', text: 'A creative experience built around expression, resilience and moving from surviving to thriving.' },
  { title: 'Refupoet', text: 'Amplifying the voices and stories of refugee and displaced poets and artists.' },
  { title: 'Y-Talks', text: 'Youth dialogue platforms tackling belonging, civic engagement and the questions young people carry.' },
];

/* --------------------------- NAVIGATION --------------------------- */
export const navLinks = [
  { label: 'Programs', to: '/programs' },
  { label: 'Events', to: '/events' },
  { label: 'Impact Hub', to: '/impact' },
  { label: 'Get Involved', to: '/get-involved' },
  { label: 'Donate', to: '/donate' },
  { label: 'Alliance', to: '/alliance' },
  { label: 'About', to: '/about' },
];
/* --------------------------- THEMATIC PILLARS --------------------------- */
export const pillars = [
  {
    slug: 'arts-culture',
    title: 'Arts & Culture',
    accent: 'gold',
    description:
      'Promotes African heritage, cultural exchange and collaborative artistic production across disciplines and borders.',
    longDescription:
      'The Arts & Culture pillar champions African heritage and contemporary creative practice. Through residencies, cultural exchange and live showcases, we bring artists together across the continent and connect creativity to positive social change.',
    objectives: [
      'Promote African heritage and cultural exchange',
      'Foster collaborative production across disciplines and borders',
      'Open professional stages for emerging and mid-career artists',
    ],
    initiatives: ['Cross-Border Artist Residencies', 'Sema-Anika Forums', 'Open Mic & Poetry Nights'],
  },
  {
    slug: 'youth-migration',
    title: 'Youth & Migration',
    accent: 'green',
    description:
      'Uses art and storytelling to explore migration, belonging, refugee experiences and relationships with host communities.',
    longDescription:
      'This pillar holds space for young people and displaced communities to air their lived realities. Storytelling labs, media training and mentorship turn migration experience into creative power and advocacy.',
    objectives: [
      'Amplify young voices on migration and belonging',
      'Build creative and media skills for displaced youth',
      'Foster understanding between host and refugee communities',
    ],
    initiatives: ['Try My Shoe Storytelling Lab', 'Refupoet', 'Youth Media Clinics'],
  },
  {
    slug: 'expressions',
    title: 'Expressions',
    accent: 'coral',
    description:
      'Creates room for artists to explore, create and evolve through collaborative production, creative entrepreneurship and art therapy.',
    longDescription:
      'Expressions is ANIKA’s heart: a dedicated space for artists to create freely, grow sustainably and heal through practice. We invest in creative entrepreneurship, collaborative production and safeguarded art therapy so artists can turn their craft into sustainable careers.',
    objectives: [
      'Support creative entrepreneurship and self-sufficiency',
      'Foster collaborative, experimental artistic production',
      'Offer safeguarded, healing-centred creative processes',
    ],
    initiatives: ['Gaining Grip Experience', 'Creative Entrepreneurship Labs', 'Art Therapy Circles'],
  },
  {
    slug: 'gender-equality',
    title: 'Gender Equality',
    accent: 'blue',
    description:
      'Creates safe spaces for conversations on gender equality, sexual and reproductive health, SGBV, rights, agency and healing.',
    longDescription:
      'This pillar creates the conditions for honest, safe and healing conversations on gender equality, sexual and reproductive health, and sexual and gender-based violence. Through art and dialogue, we centre agency, rights and dignified recovery.',
    objectives: [
      'Create safe spaces for gender conversations and healing',
      'Use art to shift harmful norms around SGBV and SRHR',
      'Centre agency, rights and survivor dignity',
    ],
    initiatives: ['SGBV Dialogue Forums', 'Her Story Open Mic', 'Healing & Arts Circles'],
  },
  {
    slug: 'governance',
    title: 'Governance',
    accent: 'ink',
    description:
      'Uses artistic and dialogue platforms to deepen youth engagement with human rights, civic responsibility, governance and democratic participation.',
    longDescription:
      'Governance is about whose voices shape decisions. We create civic arts forums, citizen storytelling and accountability projects that deepen young people’s engagement with human rights, civic responsibility and democratic participation.',
    objectives: [
      'Deepen youth engagement with civic responsibility',
      'Build civic literacy with creative tools',
      'Open dialogue between communities and decision-makers',
    ],
    initiatives: ['Civic Arts Forums', 'Y-Talks', 'Citizen Storytelling Units'],
  },
];

/* --------------------------- LIVE METRICS --------------------------- */
export const metrics = [
  { value: '2,500+', label: 'Direct Beneficiaries', accent: 'green' },
  { value: '160+', label: 'Scripts Submitted', accent: 'blue' },
  { value: '150+', label: 'Artists Engaged', accent: 'gold' },
  { value: '11.4M+', label: 'Digital Impressions', accent: 'coral' },
];
/* --------------------------- EVENTS --------------------------- */
export const events = [
  {
    id: 'sema-anika-forum',
    title: 'Sema-Anika Community Dialogue Forum',
    theme: 'Mental Health, Peace & Healing',
    dateISO: '2026-09-12T14:00:00+03:00',
    time: '14:00 EAT',
    location: 'Nairobi Cultural Centre',
    pillarSlug: 'arts-culture',
    image: '/SEMA ANIKA POSTER.jpg',
    imageAlt:
      'Sema-Anika Community Dialogue Forum artwork, inviting community conversations on healing and mental health.',
    context:
      'ANIKA’s flagship dialogue forum — an interactive session using spoken word to explore community safety, mental health and healing.',
    artists: 'Regional poets & multidisciplinary performers',
    quote:
      'Art brings into the open what is hidden, unheard, difficult to express, or too easily ignored.',
    capacity: 120,
  },
  {
    id: 'try-my-shoe',
    title: 'Try My Shoe — Youth Storytelling Lab',
    theme: 'Migration, Identity & Belonging',
    dateISO: '2026-09-24T10:00:00+03:00',
    time: '10:00 EAT',
    location: 'Kilimani Creative Space, Nairobi',
    pillarSlug: 'youth-migration',
    image: '/singer.jpg',
    imageAlt: 'Young people smiling together at a youth storytelling and community session.',
    context:
      'A hands-on residency where young storytellers craft and share lived experiences of migration, belonging and host-community relationships.',
    artists: 'Emerging filmmakers & spoken-word artists',
    quote: 'Every story aired is a step toward a world where no voice is left unheard.',
    capacity: 40,
  },
  {
    id: 'griphon-poetry-night',
    title: 'Griphon x ANIKA — Poetry & Beat Night',
    theme: 'Expression, Creativity & Healing',
    dateISO: '2026-10-03T19:00:00+03:00',
    time: '19:00 EAT',
    location: 'The GoDown Arts Centre, Nairobi',
    pillarSlug: 'expressions',
    image: '/image5.jpg',
    imageAlt: 'Griphon performing spoken word live at an ANIKA poetry night.',
    context:
      'A curated night of spoken word, live beats and open-mic slots celebrating the power of the spoken word to heal and connect.',
    artists: 'Griphon, regional poets, live band',
    quote: 'The stage is a mirror. Poetry is what we do when we refuse to look away.',
    capacity: 200,
  },
  {
    id: 'gaining-grip-lab',
    title: 'Gaining Grip — Creative Expression & Healing Lab',
    theme: 'Resilience, Creativity & Art Therapy',
    dateISO: '2026-10-17T09:00:00+03:00',
    time: '09:00 EAT',
    location: 'Karura Creative Space, Nairobi',
    pillarSlug: 'expressions',
    image: '/image6.jpg',
    imageAlt: 'Participants documenting and creating together at a Gaining Grip expressive arts lab.',
    context:
      'A flagship expressive-arts experience where artists move from surviving to thriving through collaborative production and safeguarded creative process.',
    artists: 'Multidisciplinary artists & art therapy facilitators',
    quote: 'Some things cannot heal in darkness. Art carries them into the open.',
    capacity: 60,
  },
  {
    id: 'civic-art-forum',
    title: 'Y-Talks — Citizens\' Civic Art Forum',
    theme: 'Civic Responsibility & Democratic Participation',
    dateISO: '2026-11-07T14:00:00+03:00',
    time: '14:00 EAT',
    location: 'Nairobi City Hall Amphitheatre',
    pillarSlug: 'governance',
    image: '/image9.jpg',
    imageAlt: 'Crowd gathered at an ANIKA civic forum discussing community governance.',
    context:
      'A public forum using theatre and testimony to deepen young people’s engagement with human rights, civic responsibility and democratic participation.',
    artists: 'Forum theatre troupe & citizen storytellers',
    quote: 'Accountability is a performance too — the people are always watching.',
    capacity: 300,
  },
  {
    id: 'her-story-open-mic',
    title: 'Her Story — Open Mic & Healing Forum',
    theme: 'Gender Equality, Rights & Healing',
    dateISO: '2026-11-21T16:00:00+03:00',
    time: '16:00 EAT',
    location: 'Kenya National Theatre, Nairobi',
    pillarSlug: 'gender-equality',
    image: '/jaaziya.jpg',
    imageAlt: 'A woman performing her story on stage at the Her Story open mic.',
    context:
      'Women and marginalised voices take the mic to share stories, assert agency and shape conversations on gender equality, SRHR and SGBV.',
    artists: 'Women poets, musicians & spoken-word artists',
    quote: 'When she speaks, the whole room leans in. That is healing.',
    capacity: 150,
  },
];

export function pillarBySlug(slug) {
  return pillars.find((p) => p.slug === slug);
}

export function eventsForPillar(slug) {
  return events.filter((e) => e.pillarSlug === slug);
}

/* --------------------------- IMPACT --------------------------- */
export const impactHighlights = [
  {
    value: '2,500+',
    label: 'Forum Participants',
    accent: 'green',
    note: 'Physically engaged across Sema-Anika community dialogue forums.',
  },
  {
    value: '160+',
    label: 'Scripts Submitted',
    accent: 'blue',
    note: 'Creative works and stories shared with us.',
  },
  {
    value: '150+',
    label: 'Artists Engaged',
    accent: 'gold',
    note: 'Poets, performers, filmmakers and multidisciplinary makers.',
  },
  {
    value: '11.4M+',
    label: 'Digital Impressions',
    accent: 'coral',
    note: 'Online reach generated by our campaigns and storytelling.',
  },
];

export const countriesReached = ['Kenya', 'Uganda', 'Rwanda', 'Ghana', 'South Africa'];

export const testimonials = [
  {
    quote:
      'ANIKA gave me a stage to say what I had carried in silence for years. My art finally found air.',
    attribution: 'Voices · Spoken-Word Artist',
  },
  {
    quote:
      'We don’t just talk about change here — we perform it, we paint it, we write it into being.',
    attribution: 'Amplifiers · Youth Participant',
  },
];

/* --------------------------- DONATIONS --------------------------- */
export const donationTiers = [
  {
    name: 'Supporter',
    amount: '5',
    cadence: 'per month',
    blurb: 'Help an emerging artist access their first creative forum.',
    accent: 'green',
  },
  {
    name: 'Creator',
    amount: '20',
    cadence: 'per month',
    blurb: 'Power storytelling labs for young people in migration.',
    accent: 'gold',
  },
  {
    name: 'Change-Maker',
    amount: '50',
    cadence: 'per month',
    blurb: 'Sustain dialogue forums on mental health and healing.',
    accent: 'coral',
  },
];

export const donationCurrencies = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'KES', symbol: 'KSh ', label: 'Kenyan Shilling' },
];

/* --------------------------- CHANGE PATHWAY --------------------------- */
export const changePath = [
  { step: '01', letter: 'A', title: 'Air', text: 'Express — give voice to lived realities.' },
  { step: '02', letter: 'N', title: 'Nurture', text: 'Hold — create safe, caring spaces.' },
  { step: '03', letter: 'I', title: 'Interrogate', text: 'Question — challenge what is accepted.' },
  { step: '04', letter: 'K', title: 'Know', text: 'Document — ground change in truth.' },
  { step: '05', letter: 'A', title: 'Act', text: 'Mobilize — turn insight into impact.' },
];

/* --------------------------- FAQ --------------------------- */
export const faqs = [
  {
    q: 'How do I register for an event?',
    a: 'Open any event page and use the registration form, or tap “Air It Out” in the header. With your WhatsApp consent, you receive an instant confirmation, a 24-hour reminder, and a post-event follow-up.',
  },
  {
    q: 'How can I submit my art or story?',
    a: 'Tap “Air It Out” and choose “Submit Art / Story”, or message our WhatsApp assistant. Your work is handled under our ethical rule — Open, Never Expose.',
  },
  {
    q: 'How does ANIKA use my data and WhatsApp number?',
    a: 'We only message you if you opt in, and we never expose your story without clear consent. You can opt out at any time by replying STOP, and any message containing HELP is routed to a human on our team.',
  },
  {
    q: 'How do donations work?',
    a: 'Choose a one-time or recurring amount on the Donate page. We support card payments and mobile money (M-Pesa). Every donation triggers an instant receipt via WhatsApp and email.',
  },
  {
    q: 'What is the Pan-African Arts Alliance?',
    a: 'It is our continental network of artists, organisations, and enablers formalising in 2025–26. Members access residencies, co-production opportunities, and funding intelligence.',
  },
];

/* --------------------------- WHATSAPP INBOX (seed) --------------------------- */
export const whatsAppInbox = [
  {
    id: 'wa-1',
    from: 'Alex Kwame',
    phone: '+254 711 000 111',
    message: 'HELP — I registered for the Sema-Anika forum but haven’t received a confirmation yet.',
    intent: 'escalation',
    time: '2026-08-19T08:12:00+03:00',
    status: 'unresolved',
  },
  {
    id: 'wa-2',
    from: 'Sarah Ochieng',
    phone: '+254 722 222 333',
    message: 'What events are coming up for artists this month?',
    intent: 'faq',
    time: '2026-08-19T07:45:00+03:00',
    status: 'resolved',
  },
  {
    id: 'wa-3',
    from: 'David Mensah',
    phone: '+233 24 555 666',
    message: 'How do I apply for Alliance membership from Ghana?',
    intent: 'alliance',
    time: '2026-08-18T21:30:00+03:00',
    status: 'unresolved',
  },
  {
    id: 'wa-4',
    from: 'Amina Yusuf',
    phone: '+255 744 333 444',
    message: 'Can I make a one-time donation via M-Pesa?',
    intent: 'donation',
    time: '2026-08-18T19:05:00+03:00',
    status: 'resolved',
  },
];
