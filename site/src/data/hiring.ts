// The questionnaire at /help. Every word a person reads is in this file.
//
// Writing tip: this text sits inside 'single quotes', so use a curly apostrophe (’) in words like you’ll.

export type Question = {
  id: string;
  type: 'text' | 'tel' | 'email' | 'url' | 'long' | 'choice' | 'multi';
  q: string;
  help?: string;
  placeholder?: string;
  optional?: boolean;
  options?: string[];
  /** A small note shown just above one of the options. */
  note?: { from: string; text: string };
  /** Only ask this if an earlier answer matches or includes this, like { id: 'taken', is: 'Yes' }. */
  showIf?: { id: string; is: string };
};

export type Role = {
  id: string;
  name: string;
  team: 'Outreach' | 'Media' | 'Tutoring' | 'Seminars';
  /** One line for the list of roles. */
  line: string;
  group: 'open' | 'mcat';
  /** The big headline on the role's screen. */
  hook: string;
  about: string;
  /** Extra paragraph for roles that need a heads-up. */
  warning?: string;
  /** What the person gets out of doing this. */
  gets: string[];
  /** What this person could do with the role beyond the basics. */
  yours: string;
  expect: string[];
  /** Asked first, for roles made up of parts people can pick from. */
  parts?: Question;
  questions: Question[];
};

// bg is the strong color on buttons and accents, ink is the text on top of it,
// and tint is the pale full-screen background on that role's page.
type Swatch = { bg: string; ink: string; tint: string };
export type Palette = {
  id: string;
  name: string;
  paper: string;
  ink: string;
  dim: string;
  primary: string;
  primaryInk: string;
  /** The pale background on the "We're new, we're ambitious" screen. */
  primaryTint: string;
  /** One color per role, matched by the role's id. Every role needs a line here. */
  roles: Record<string, Swatch>;
};

const white = '#FFFFFF';

export const palettes: Palette[] = [
  {
    id: 'dusk',
    name: 'Dusk',
    paper: '#FBF6EE', ink: '#241B3A', dim: '#675C70',
    primary: '#3B2A78', primaryInk: white, primaryTint: '#E9E3F5',
    roles: {
      outreach: { bg: '#F2A33C', ink: '#241B3A', tint: '#FBE6C6' },
      video: { bg: '#D1432E', ink: white, tint: '#F8DDD3' },
      design: { bg: '#1F7A6D', ink: white, tint: '#D8ECE5' },
      tutor: { bg: '#7B2F6F', ink: white, tint: '#EFDDEB' },
      lecturer: { bg: '#2F3F8F', ink: white, tint: '#DFE2F3' },
    },
  },
];

export const intro = {
  question: 'Do you know what The M-CATS at the University of Kentucky is?',
  title: 'We’re building something new at UK, and anyone can be part of it.',
  lead: 'The M-CATS is a new student-run organization that’s growing fast, and we’re looking for people to help us create something amazing.',
  need: 'You don’t have to be pre-med. Any major, any year. We need designers, filmmakers, editors, social media people and people who are good at presenting. And if you know the MCAT or the pre-med process, we need you too.',
  doesTitle: 'What we’ve built so far',
  does: [
    { title: 'Seminars', body: 'Seven hours of free MCAT lectures every week, all run by students.' },
    { title: 'Tutoring', body: 'Free one-on-one help from students who’ve been there.' },
    { title: 'Scholarships', body: 'Five scholarships that cover the cost of registering for the exam.' },
  ],
  caption: 'Everything you see here is made by students, from the teaching to the slides.',
  // Who's teaching in each photo on this screen. who and topic show as a small tag on the photo
  // (leave who empty for no tag); alt describes the photo for people using screen readers.
  photos: {
    hero: { who: 'Nikhil Kumar', topic: 'Endocrine', alt: 'Nikhil Kumar teaching the endocrine chapter at a whiteboard in front of a room of students' },
    nihal: { who: 'Nihal Jacobs', topic: 'Endocrine', alt: 'Nihal Jacobs explaining how hormones act, with drawings across the whiteboard' },
    anmol: { who: 'Anmol Nayak', topic: 'DNA', alt: 'Anmol Nayak pointing to nucleotide structures on a whiteboard, next to a slide on DNA conformations' },
    lee: { who: 'Lee Dix', topic: 'Carbonyls', alt: 'Lee Dix pointing to a slide on how aldehydes and ketones form' },
    whiteboard: { who: 'Nikhil Kumar', topic: 'Metabolism', alt: 'Nikhil Kumar explaining a metabolic pathway drawn across the whiteboard' },
  },
  mcatNote: 'Never heard of the MCAT? No worries! It’s the exam people take to apply to medical school, and it’s expensive to prepare for, so we make the prep as free as possible. Most of our roles don’t need you to know all too much about it.',
  button: 'Got it',
};

export const pledge = {
  kicker: 'We’re just getting started',
  title: 'We’re new, we’re ambitious and we’re growing fast.',
  body: 'That means there’s a lot of room to build something amazing here. We’re looking for dedicated, passionate people to build it with us. Any major, any year. These are volunteer roles, so they’re unpaid, but you’ll walk away with service hours and real experience. So are you a hardworking communicative person?',
  button: 'That’s me',
};

export const makeItYours = {
  title: 'Make it your own',
  body: 'We’re new, so almost nothing about this role is set in stone. Bring your own ideas and take it as far as you want. We are looking for creativity and people who really will push the bounds of the medium!',
};

export const briefHeads = {
  gets: 'What’s in it for you',
  expect: 'What we need from you',
};

export const also = {
  q: 'Anything else you’d want to help with?',
  help: 'Your main pick stays the same. This just tells us what else you’d be up for.',
  mcatNote: 'You need to have taken the MCAT for these!',
  mcatNoteOne: 'You need to have taken the MCAT for this one!',
};

export const groups = {
  question: 'Where do you want to jump in?',
  open: 'Any major, any year',
  mcat: 'If you’ve studied for the MCAT',
};

const portfolio: Question = {
  id: 'portfolio',
  type: 'url',
  q: 'Link your portfolio or some examples.',
  help: 'Drive, YouTube, Behance, anything we can open.',
  placeholder: 'Paste a link',
};

// Asked for both MCAT roles. Someone who picks both only answers these once.
const mcat: Question[] = [
  { id: 'taken', type: 'choice', q: 'Have you taken the MCAT?', options: ['Yes', 'Not yet'] },
  { id: 'score', type: 'long', q: 'What was your score, and what were your strongest subjects?', help: 'Only if you’re comfortable sharing.', optional: true, showIf: { id: 'taken', is: 'Yes' } },
];

export const roles: Role[] = [
  {
    id: 'outreach',
    name: 'Social media and outreach',
    team: 'Outreach',
    line: 'Run our social media and get people talking about us.',
    group: 'open',
    hook: 'Be the voice of the whole club.',
    about: 'Our (currently non-existent) Instagram is wide open. You’d decide what we post, how we sound and how we show up for the thousands of students on campus who haven’t heard of us yet. You’d also be getting us in the room with other clubs, departments, advisors and more. A lot of what we do next could start with a conversation you had.',
    gets: ['An account you can say you helped grow from the early days', 'Lots of creative freedom and a portfolio to show for it', 'Connections with faculty, campus leaders and professionals', 'Practice pitching and building relationships, which pays off in any career', 'An officer title and service hours'],
    yours: 'Want to start a series? Put students on camera? Or try something nobody here has done? Go for it. We are open to new creative ideas!! Who we reach out to and what we build together is up to you.',
    expect: ['Keep our accounts active and our members in the loop', 'Advertise our club to new audiences', 'Work with the rest of Outreach on what’s coming up', 'About 2 to 3 hours a week'],
    parts: { id: 'outreach-parts', type: 'multi', q: 'Which parts do you want to do?', help: 'Pick one or both.', options: ['Social media', 'Speaking about the club and networking'] },
    questions: [{ id: 'social-link', type: 'url', q: 'Got a social media account we can look at?', help: 'Yours or one you’ve run. Think of it as a portfolio.', placeholder: 'Paste a link', optional: true, showIf: { id: 'outreach-parts', is: 'Social media' } }],
  },
  {
    id: 'video',
    name: 'Video creator',
    team: 'Media',
    line: 'Write, shoot and edit our videos.',
    group: 'open',
    hook: 'Make our videos, start to finish.',
    about: 'We record hours of teaching every week, and we’re purchasing equipment to start creating professionally shot, creatively written 5-15 minute MCAT style videos. You’d be part of the team that writes them, films them and edits them, and you’d be setting the style for everything we put out. Nobody has this job yet, so you get to figure out what it should be.',
    gets: ['Videos people use, with your name on them', 'A growing reel and proper experience to show off on your resume', 'Freedom to experiment with how we shoot', 'Practice working with a team', 'An officer title and service hours'],
    yours: 'Once you’ve got the lectures down, help us with making shorts, explainers, whatever you can dream up. If you think we should be making it, pitch it and shoot it.',
    expect: ['Help plan video ideas', 'Do the parts you sign up for well and on time', 'Turn each recording around within about 1-2 weeks', 'Keep up with the seminar schedule', 'About 3 to 5 hours a week'],
    parts: { id: 'video-parts', type: 'multi', q: 'Which parts do you want to do?', help: 'All three would be amazing, but one is fine too.', options: ['Writing', 'Shooting', 'Editing'] },
    questions: [portfolio],
  },
  {
    id: 'design',
    name: 'Graphics designer',
    team: 'Media',
    line: 'Design everything people see from us.',
    group: 'open',
    hook: 'Give us our look.',
    about: 'Every flyer on campus, every post and every slide template could be yours. We’re new enough that your taste can set how this club looks for years.',
    gets: ['Your work up all over campus', 'A portfolio full of finished projects with actual deadlines', 'An officer title and service hours'],
    yours: 'Build us a brand, invent new formats, pitch ideas nobody asked for.',
    expect: ['Turn requests around in a reasonable amount of time', 'Creativity!','Keep everything looking like it came from the same club','Training in Illustrator and/or Photoshop (or is willing to learn!!)', 'About 2 to 3 hours a week'],
    questions: [portfolio],
  },
  {
    id: 'tutor',
    name: 'Peer Mentor (MCAT coach)',
    team: 'Tutoring',
    line: 'Coach students one-on-one on how to prep for the MCAT.',
    group: 'mcat',
    hook: 'Be the coach you wish you’d had.',
    about: 'A lot of students prep for this alone and can’t pay for a coach. You’d meet with them one-on-one to help them build a study plan, pick the right resources, make sense of their practice tests and stay on track. You’re there to guide how they prep, not to teach them every subject.',
    gets: ['Service hours doing something that helps people directly','Make meaningful connections with undergrads preparing for the MCAT', 'Experience you can talk about in applications and interviews'],
    yours: 'You decide how you coach. If you find something that works, we’ll help you share it with the other mentors.',
    expect: ['Become trained in MCAT coaching', 'Keep time to mentor 1-2 people with true care and compassion', 'Be Communicative', 'WE DO NOT EXPECT YOU TO TUTOR ALL SUBJECT MATTER, just how to prepare for the MCAT in general'],
    questions: mcat,
  },
  {
    id: 'lecturer',
    name: 'Seminar lecturer',
    team: 'Seminars',
    line: 'Our hardest job and one of the most rewarding.',
    group: 'mcat',
    hook: 'Stand up and teach a room.',
    about: 'Twice a week, students come to learn from us. You’d take a chapter, build your own slides/lecture and teach it live.',
    warning: 'We’ll be upfront, this one is difficult. You have to know the material well enough to explain it live and answer questions you didn’t plan for. It’s possible, we’ll help you get there, and it’s really rewarding.',
    gets: ['Service hours and one of the most impressive leadership roles you can point to', 'You’ll know your chapters better than you ever could from reading them', 'Speaking and teaching experience most students never get'],
    yours: 'You decide how to teach your section, and we want you to try new things.',
    expect: ['Have your slides ready ahead of time', 'Practice before you present', 'A lot of commitment, hard work, and communication'],
    questions: mcat,
  },
];

export const everyone: Question[] = [
  { id: 'name', type: 'text', q: 'What’s your name?', placeholder: 'First and last' },
  { id: 'phone', type: 'tel', q: 'What’s your phone number?', placeholder: '859 555 0123' },
  { id: 'email', type: 'email', q: 'And your email?', placeholder: 'you@uky.edu' },
  { id: 'preferred', type: 'choice', q: 'Which should we use to reach you?', options: ['Text', 'Email'] },
  { id: 'year', type: 'choice', q: 'What year are you?', options: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Grad or other'] },
  { id: 'major', type: 'text', q: 'What’s your major?', help: 'Add your minor if you have one.', placeholder: 'Your major' },
  { id: 'experience', type: 'long', q: 'Any experience that relates to this role?', help: 'A sentence or two is fine.', placeholder: 'Classes, jobs, projects, anything' },
];

export const done = {
  title: 'Thanks',
  next: ['We read every application and get back to you within a week.', 'If it’s a good fit, we’ll set up a short chat.', 'Then you get started on your first project.'],
};

// What the Send button says while it sends, and the messages if it doesn't go through.
// {field} is replaced with the answer that didn't look right, like "phone number".
export const sending = {
  button: 'Sending',
  failed: 'That didn’t send. Check your connection and try again.',
  slow: 'Too many tries from here. Wait a little while and try again.',
  check: 'Your {field} doesn’t look right. Go back and check it.',
};
