// ─────────────────────────────────────────────────────────────
//  The M-CATS team.
//  Photos live in src/assets/team/<id>/ and are picked up automatically
//  (see the README there). Every field except id, name and role is optional.
// ─────────────────────────────────────────────────────────────

export type Member = {
  id: string;
  name: string;
  role: string;
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
    year: 'Senior',
    majors: 'Biosystems & Agricultural Engineering, Music Performance',
    subjects: 'Physics',
    hobbies: 'Playing music, tennis & golf',
    food: 'Fried rice',
  },
];

// Officer application. Leave formUrl empty to point people to the GroupMe instead.
export const officerApp = {
  formUrl: '',
  // Roles we're looking to fill. `open: false` keeps a role listed but marks it filled.
  roles: [
    { name: 'Social media', body: 'Run our Instagram and GroupMe announcements: seminar reminders, recaps, and scholarship news.' },
    { name: 'General officer', body: 'More hands for everything else: setting up seminars, helping members, planning events, and new projects.' },
  ],
  perks: ['Help run a club that makes the MCAT free for everyone', 'Leadership experience for your applications', 'Earn service hours', 'Stay sharp on MCAT content yourself'],
  process: ['Fill out the application.', 'Meet with a few members of leadership.', 'Join the officer team and pick up a role.'],
};
