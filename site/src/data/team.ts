// ─────────────────────────────────────────────────────────────
//  The M-CATS team.
//  Photos live in src/assets/team/<id>/ and are picked up automatically
//  (see the README there). Every field except id, name and role is optional.
//
//  The Team page sorts people into place by these fields:
//    exec: true      President and Vice President, shown above the teams
//    team: 'media'   the team someone works on (ids are in `teams` below)
//    lead: true      the person who leads that team
//    also: [...]     other teams they help on without leading, shown as a note
//  Someone with no team and no exec shows under "Officers" at the bottom.
// ─────────────────────────────────────────────────────────────

export type TeamId = 'seminars' | 'peer-mentors' | 'operations' | 'funds' | 'media' | 'outreach';

export type Team = {
  id: TeamId;
  name: string;
  /** One line on what the team does. */
  line: string;
  /** Which roles on the /help questionnaire belong to this team. */
  hires?: 'Seminars' | 'Tutoring' | 'Media' | 'Outreach';
};

// The order here is the order on the page.
export const teams: Team[] = [
  { id: 'seminars', name: 'Seminars', line: 'Plans and teaches our weekly MCAT seminars.', hires: 'Seminars' },
  { id: 'peer-mentors', name: 'Peer Mentors', line: 'Helps students one-on-one with MCAT content and studying.', hires: 'Tutoring' },
  { id: 'operations', name: 'Operations', line: 'Keeps the club running, from the scholarship cycle to meeting notes and weekly updates.' },
  { id: 'funds', name: 'Funds', line: 'Handles our grants, budget and donations.' },
  { id: 'media', name: 'Media', line: 'Makes our videos and graphics.', hires: 'Media' },
  { id: 'outreach', name: 'Outreach', line: 'Runs our social media and gets the word out on campus.', hires: 'Outreach' },
];

export type Member = {
  id: string;
  name: string;
  role: string; // official title, also shown on the slideshow
  exec?: boolean;
  team?: TeamId;
  lead?: boolean;
  also?: TeamId[];
  year?: string;
  majors?: string;
  minors?: string;
  subjects?: string; // favorite MCAT subjects
  hobbies?: string;
  food?: string;
  quote?: string; // a line in their own words, shown in italics
};

export const leadership: Member[] = [
  {
    id: 'nikhil-kumar',
    name: 'Nikhil Kumar',
    role: 'President & Founder',
    exec: true,
    also: ['seminars'],
    year: 'Junior',
    majors: 'Biochemistry & Pure Mathematics',
    minors: 'Italian',
    subjects: 'All of them! (But CARS slightly less)',
    hobbies: 'Baking, reading, running, the gym',
    food: 'Not sure actually. Maybe Nashville hot chicken? No clue, honestly.',
  },
  {
    id: 'anmol-nayak',
    name: 'Anmol Nayak',
    role: 'Vice President',
    exec: true,
    also: ['seminars'],
    year: 'Senior',
    majors: 'Biochemistry, Biology, Neuroscience & Music',
    minors: 'Mathematics',
    subjects: 'Biology & Biochemistry',
    hobbies: 'Rock climbing',
    food: 'Dahi vada… or just cheesecake :P',
  },
  {
    id: 'lee-dix',
    name: 'Lee Dix',
    role: 'Officer',
    team: 'seminars',
    lead: true,
    year: 'Senior',
    majors: 'Biochemistry & Spanish',
    subjects: 'Chemistry, P/S & CARS',
    hobbies: 'Roller skating & hiking',
    food: 'Pineapple curry',
  },
  {
    id: 'nihal-jacobs',
    name: 'Nihal Jacobs',
    role: 'Officer',
    team: 'peer-mentors',
    lead: true,
    year: 'Sophomore',
    majors: 'Neuroscience & Mathematics',
    minors: 'Physics, Pharmacology & Microbiology',
    subjects: 'Chemistry',
    hobbies: 'Rock climbing',
    food: 'Marie Callender’s chicken pot pies',
  },
  {
    id: 'zander-houchens',
    name: 'Zander Houchens',
    role: 'Officer',
    year: 'Senior',
    majors: 'Agricultural & Medical Biotechnology',
    subjects: 'B/B & P/S',
    hobbies: 'Jiu jitsu, lifting, making beats & songwriting',
    food: 'Lemon pepper wings!!!',
  },
  {
    id: 'andrew-peng',
    name: 'Andrew Peng',
    role: 'Secretary',
    team: 'operations',
    lead: true,
    year: 'Senior',
    majors: 'Biosystems & Agricultural Engineering, Music Performance',
    subjects: 'Physics',
    hobbies: 'Playing music, tennis & golf',
    food: 'Fried rice',
  },
  {
    id: 'lara-westhafer',
    name: 'Lara Westhafer',
    role: 'Treasurer',
    team: 'funds',
    lead: true,
    year: 'Sophomore',
    majors: 'Finance & Accounting',
    minors: 'Economics',
    subjects: 'The 30 minute break 🙂',
    hobbies: 'Reading & karate',
    food: 'Not entirely sure, it changes from day to day. A nice home-cooked meal is always on the list, though.',
  },
];

// Officer application. Leave formUrl empty to point people to the GroupMe instead.
export const officerApp = {
  formUrl: '',
  perks: ['Help run a club that makes the MCAT free for everyone', 'Leadership experience for your applications', 'Earn service hours', 'Stay sharp on MCAT content yourself'],
  process: ['Fill out the application.', 'Meet with a few members of leadership.', 'Join the officer team and pick up a role.'],
};
