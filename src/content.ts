/**
 * All site copy and links, extracted from the reference site (merki-lime.vercel.app).
 * Scene order here is the order of the page; `pages.config.ts` pairs each scene with its artwork.
 */

export const BRAND = {
  name: 'The Merki',
  title: 'The Merki — Building brands people can’t ignore',
  description: 'Creative strategy, content and digital experiences designed to make brands impossible to scroll past.',
  email: 'hello@themerki.com',
  instagram: 'https://www.instagram.com/the_merki?stkn=MXA1aXlpZXptdmpyZw%3D%3D',
  instagramHandle: '@the_merki',
  whatsappNumber: '918122512223',
} as const

export const whatsappLink = (message?: string) =>
  `https://wa.me/${BRAND.whatsappNumber}${message ? `?text=${encodeURIComponent(message)}` : ''}`

export type SceneId = 'intro' | 'about' | 'services' | 'work' | 'philosophy' | 'process' | 'clients' | 'contact'

export interface SceneMeta {
  id: SceneId
  /** Shown in the HUD. */
  name: string
  /** Light scenes take dark ink; dark scenes take light ink. */
  theme: 'light' | 'dark'
  /** Pre-filled WhatsApp message while this scene is current. */
  whatsapp: string
}

export const SCENES: SceneMeta[] = [
  { id: 'intro', name: 'Intro', theme: 'light', whatsapp: 'Hi The Merki, I came across your website and I\'d like to enquire about your services.' },
  { id: 'about', name: 'About', theme: 'dark', whatsapp: 'Hi The Merki, I\'d like to know more about your agency and how you work with brands.' },
  { id: 'services', name: 'Services', theme: 'light', whatsapp: 'Hi The Merki, I\'m interested in your services (brand identity, websites, content, social media). Could we talk?' },
  { id: 'work', name: 'Work', theme: 'light', whatsapp: 'Hi The Merki, I saw your work and I\'d like to discuss a project with you.' },
  { id: 'philosophy', name: 'Philosophy', theme: 'dark', whatsapp: 'Hi The Merki, I want to build a brand people remember. Can we talk?' },
  { id: 'process', name: 'Process', theme: 'light', whatsapp: 'Hi The Merki, could you walk me through your process, from strategy to launch?' },
  { id: 'clients', name: 'Clients', theme: 'dark', whatsapp: 'Hi The Merki, I\'d like to see more of your client work and results.' },
  { id: 'contact', name: 'Contact', theme: 'light', whatsapp: 'Hi The Merki, I\'d like to start a project. Here\'s what I have in mind: ' },
]

/** A run of heading text; `em` runs are set in the italic serif. */
export interface Run {
  t: string
  em?: boolean
}

/** Index of a scene in the page, for "go to" links. */
export const sceneIndex = (id: SceneId) => SCENES.findIndex((s) => s.id === id)

export const NAV = [
  { label: 'Work', to: 'work' },
  { label: 'Services', to: 'services' },
  { label: 'Process', to: 'process' },
] as const satisfies readonly { label: string; to: SceneId }[]

export const COPY = {
  cta: { project: 'Start a project', seeWork: 'See our work' },
  intro: {
    left: [{ t: 'Building brands' }] as Run[],
    right: [{ t: 'people can’t ignore', em: true }] as Run[],
    lead: ['Creative strategy, content and digital experiences', 'designed to make brands impossible to scroll past.'],
    button: 'View projects',
    scroll: 'Scroll',
  },
  about: {
    heading: [{ t: 'Built for brands that ' }, { t: 'refuse to blend in.', em: true }] as Run[],
    body: 'The Merki is a young creative agency building brands that feel fresh, thoughtful, and remembered.',
  },
  services: {
    title: [{ t: 'How we ' }, { t: 'work', em: true }] as Run[],
    items: [
      { title: 'Brand Identity', text: 'Brand strategy, visual identity and positioning systems designed to build recognisable brands' },
      { title: 'Social Media', text: 'Creative direction and platform strategies focused on consistency, engagement and brand growth.' },
      { title: 'Content Production', text: 'High quality visuals, campaigns and short-form content created for modern attention spans.' },
      { title: 'Website Experiences', text: 'Modern websites designed to feel premium, interactive and conversion focused.' },
    ],
    button: 'View more',
  },
  work: {
    left: [{ t: 'A collection of brands, campaigns and' }] as Run[],
    right: [{ t: 'creative work shaped by strategy and aesthetics', em: true }] as Run[],
  },
  philosophy: {
    heading: [{ t: 'Good brands get noticed. ' }, { t: 'Great brands get remembered.', em: true }] as Run[],
    body: 'We build brands people connect with and remember.',
  },
  process: {
    title: [{ t: 'How we ' }, { t: 'work', em: true }] as Run[],
    steps: ['Strategy', 'Create', 'Launch', 'Scale'],
    button: 'Explore more',
  },
  clients: {
    left: [{ t: 'Brands we’ve' }] as Run[],
    right: [{ t: 'worked with', em: true }] as Run[],
    quote: 'Branding, production, marketing, photography, video and web — all under one roof.',
    attribution: '@the_merki · Instagram',
    marquee: ['Branding', 'Production House', 'Digital Marketing', 'Photography', 'Video Production', 'Web Design'],
  },
  contact: {
    left: [{ t: 'Let’s build something' }] as Run[],
    right: [{ t: 'people remember', em: true }] as Run[],
    lead: ['Creative thinking, strong visuals and strategy', 'driven execution built for modern brands.'],
  },
  contactForm: {
    eyebrow: 'Start a project',
    heading: [{ t: 'Let’s make something' }, { t: 'they can’t scroll past.', em: true }] as Run[],
    name: 'Name',
    email: 'Email',
    message: 'Tell us about the project',
    send: 'Send it',
    close: 'Close ✕',
  },
  workPanel: {
    eyebrow: 'Proof of work',
    heading: [{ t: 'Work we’re ' }, { t: 'proud of.', em: true }] as Run[],
    lead: 'The Merki is a creative marketing agency — branding, production house, digital marketing, photography, video production and web design. A look at what we make, and what we stand behind.',
    vouch: [
      { title: 'Branding', text: 'Brand strategy, visual identity and positioning built to be recognised.' },
      { title: 'Production House', text: 'Concept to final cut: shoots, edits and finished content for campaigns.' },
      { title: 'Digital Marketing', text: 'Platform strategy focused on consistency, engagement and brand growth.' },
      { title: 'Photography', text: 'Brand, product and campaign photography with a clear point of view.' },
      { title: 'Video Production', text: 'Short-form and campaign video made for modern attention spans.' },
      { title: 'Web Design', text: 'Premium, interactive websites designed to convert.' },
    ],
    follow: 'Follow the work',
    tags: ['#work', '#team', '#events', '#insights'],
    instagramCta: 'See more on Instagram',
    whatsappCta: 'Enquire on WhatsApp',
    whatsappMessage: 'Hi The Merki, I saw your work and I\'d like to start a project.',
  },
  enquiry: 'Enquiry',
  nav: { project: 'Start a project', instagramLabel: 'The Merki on Instagram' },
  legal: (year: number) => `© ${year} The Merki`,
} as const
