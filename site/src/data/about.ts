// ─────────────────────────────────────────────────────────────
//  About page content.
//  The letter is Nikhil's, word for word. Paragraphs marked `pull` are
//  set as large pull quotes; everything else is body text.
// ─────────────────────────────────────────────────────────────

export const letter = {
  author: 'Nikhil Kumar',
  title: 'President & Founder',
  paragraphs: [
    { text: 'Hello, my name is Nikhil Kumar, and I began studying for the MCAT as a freshman/sophomore. Like many of you, I quickly realized that this exam is more than just a test—it’s a long, demanding process that every pre-med eventually has to face.' },
    { text: 'The reality is, even though so many of us go through it, we often end up doing it alone. Some people find a way through without guidance, piecing things together as they go. But for many, it becomes overwhelming, confusing, and isolating.' },
    { text: 'The MCAT doesn’t have to be like this.', pull: true },
    { text: 'It shouldn’t feel like an experience where you struggle in silence or question whether you’re good enough. It shouldn’t feel like something you have to survive on your own.' },
    { text: 'Because the truth is, during your MCAT journey, things will go wrong. Life doesn’t pause just because you’re preparing for an exam. There will be setbacks: academic, personal, and sometimes things far beyond your control.' },
    { text: 'For me, that meant facing serious family challenges and being diagnosed with late-stage chronic kidney disease in the middle of my preparation. There were moments where continuing felt nearly impossible.' },
    { text: 'But those experiences taught me something important: no one should have to go through this process alone.', pull: true },
    { text: 'That’s why we built this community.' },
    { text: 'Our goal isn’t just to help you study or improve your score. It’s to be there for you: during your highest moments, when everything is clicking, and during your lowest, when nothing seems to go right. We want to create a space where support, guidance, and understanding are always within reach.' },
    { text: 'Because the MCAT is not just about proving what you know. It’s about perseverance, resilience, and growth.' },
    { text: 'And those are things no one should have to build alone.', pull: true },
  ],
  // Shown under the signature. A draft in Nikhil's voice; edit freely.
  postscript:
    'P.S. Please don’t expect a team of polished professionals. We try not to take ourselves too seriously. We’re students doing our best, we’re far from the best of the best, and we definitely have our flaws. But we are always trying to get better, and to help in any way we can, even the smallest ones.',
};

export const beliefs = [
  {
    title: 'Free, always',
    body: 'No dues and no paywalls. Every seminar, deck, handout, and recording is free, and the scholarship covers the one cost we can’t remove.',
  },
  {
    title: 'Nobody does it alone',
    body: 'Two seminars a week, a GroupMe for the questions in between, and one-on-one help from peers who are further along.',
  },
  {
    title: 'Honest about resources',
    body: 'We’ll tell you what is worth your money and what isn’t, and which free materials are as good as the paid ones.',
  },
  {
    title: 'Built by students',
    body: 'Run entirely by pre-meds at UK, for pre-meds at UK. If something is missing, one of us builds it.',
  },
];

// Milestones that aren't meetings. Meetings and the scholarship are added from their own data.
export const futureMilestones = [
  { label: 'A free question bank', note: 'A desktop app that keeps the questions on your own computer, so it stays free.' },
];
