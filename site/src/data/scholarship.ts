// ─────────────────────────────────────────────────────────────
//  The M-CATS Registration Scholarship: everything the page shows.
//
//  Timestamps carry the Lexington UTC offset:
//  -04:00 while daylight saving is on (until Nov 1, 2026), -05:00 after.
// ─────────────────────────────────────────────────────────────

export const scholarship = {
  // While true, localhost shows a "draft" notice. Flip once everything is confirmed.
  placeholder: false,

  name: 'The M-CATS Registration Scholarship',
  term: 'Fall 2026',
  cycle: 'Awarded annually',
  amount: 355, // the MCAT registration fee, in dollars
  awards: { need: 3, merit: 2 },

  // UK Qualtrics application link. Leave empty to show "link coming soon".
  applyUrl: 'https://uky.az1.qualtrics.com/jfe/form/SV_1HV1zTPSTwXPWES',

  opens: '2026-10-05T00:00:00-04:00',
  closes: '2026-10-23T23:59:00-04:00',

  timeline: [
    { date: '2026-10-05', label: 'Applications open', note: 'Reviewed on a rolling basis, so apply early' },
    { date: '2026-10-23', label: 'Applications close', key: true },
    { date: '2026-10-30', prefix: 'By', label: 'Decisions sent', note: 'Semifinalists get a link to book an interview' },
    { date: '2026-11-01', end: '2026-11-13', label: 'Interviews' },
    { date: '2026-11-20', label: 'Recipients announced', note: 'Conditional acceptance' },
  ],

  summary:
    'The MCAT costs hundreds of dollars to register for before you’ve answered a single question. Each year we cover that fee for five members: three on financial need, two on merit.',

  tracks: [
    {
      id: 'need',
      name: 'Need-based',
      count: 3,
      outOf: 100,
      body: 'For applicants who can show that financial hardship is a barrier to their MCAT preparation.',
      requires: [
        'Both shared essays',
        'Unofficial transcript from myUK',
        'Statement of Financial Hardship',
        'Impact Statement',
        'Supporting documents (optional)',
      ],
    },
    {
      id: 'merit',
      name: 'Merit-based',
      count: 2,
      outOf: 65,
      body: 'For applicants who may not qualify on need, but show strong academic dedication and commitment to medicine.',
      requires: ['Both shared essays', 'Unofficial transcript from myUK'],
    },
  ],

  // What applicants write. `tracks` limits a prompt to one track.
  essays: [
    {
      title: 'Overcoming the unexpected',
      words: '250–500 words',
      prompt:
        'The journey to becoming a med student is full of obstacles and unplanned circumstances, and studying for the MCAT will bring its own. Drawing on your previous experience, how do you plan to approach and overcome unexpected problems during your MCAT studies?',
    },
    {
      title: 'Dedication to medicine',
      words: '250–500 words',
      prompt:
        'How have you demonstrated academic dedication and commitment to medicine? For example: engagement in M-CATS seminars, peer tutoring, or coursework.',
    },
    {
      title: 'Statement of Financial Hardship',
      words: '250–500 words',
      tracks: ['need'],
      prompt: 'Describe the uncompensated financial burdens or changes in circumstances you are facing.',
      extra:
        'Optionally attach evidence (Pell Grant eligibility, a pay stub, your FAFSA Student Aid Report, or a tax return) and reference it in your statement. Documents only corroborate what you write; they are never a standalone bar to entry.',
    },
    {
      title: 'Impact Statement',
      words: '250–500 words',
      tracks: ['need'],
      prompt: 'Describe how receiving this award would relieve these barriers.',
    },
    {
      title: 'Unofficial transcript',
      words: 'Screenshot or PDF',
      prompt: 'An unofficial transcript from myUK showing your cumulative GPA and pre-med science coursework. No official transcript fees.',
    },
  ],

  rubric: [
    { criterion: 'Financial need', detail: 'Statement of hardship and any supporting documentation', need: 35, merit: 0 },
    { criterion: 'MCAT readiness', detail: 'M-CATS participation and commitment to MCAT studying', need: 20, merit: 20 },
    { criterion: 'Commitment to medicine', detail: 'Clinical exposure, shadowing, research, leadership, and service', need: 15, merit: 15 },
    { criterion: 'Interview', detail: 'Communication, motivation, fit, and resilience', need: 15, merit: 15 },
    { criterion: 'Academic merit', detail: 'GPA, coursework rigor, and science GPA', need: 10, merit: 10 },
    { criterion: 'Essays', detail: 'Quality of writing, reflection, and goals', need: 5, merit: 5 },
  ],

  steps: [
    { title: 'Apply', body: 'Submit your essays through UK Qualtrics. Applications are reviewed as they arrive.' },
    { title: 'Review', body: 'The selection committee scores each application against the published rubric.' },
    { title: 'Interview', body: 'Semifinalists book a 30–60 minute in-person interview with members of the board.' },
    { title: 'Award', body: 'Recipients are announced November 20 with conditional acceptance.' },
    { title: 'Prepare', body: 'Regular one-on-ones with an officer. Your registration is funded once you’re ready for your planned test date.' },
  ],

  committee:
    'Applications are reviewed by unbiased members of The M-CATS executive board, external BCPM faculty, and the donor. Equal scores are settled by a formal discussion between the board and the donor.',

  faq: [
    {
      q: 'When do I actually receive the money?',
      a: 'Awards are conditional. Your MCAT registration is reimbursed or paid once the board agrees you’re showing the competence and commitment to succeed on your planned timeline and target score. That’s what the regular one-on-ones are for.',
    },
    {
      q: 'Do I have to submit financial documents?',
      a: 'No. Only the written Statement of Financial Hardship is required. Pell Grant, pay stub, FAFSA, or tax documents are optional and only support what you write.',
    },
    {
      q: 'Do I need an official transcript?',
      a: 'No. A screenshot or PDF of your unofficial transcript from myUK is enough, so there are no transcript fees.',
    },
    {
      q: 'What is the interview like?',
      a: 'A 30 to 60 minute in-person conversation with members of the executive board about your path to medicine and your MCAT plan. It is recorded so the donor can review it.',
    },
    {
      q: 'Is the timeline final?',
      a: 'It may shift depending on the size of the applicant pool. Any change will be posted here and in the GroupMe.',
    },
  ],
};
