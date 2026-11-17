// The little "we're hiring" note on the site (components/HiringNote.astro).
//
// Someone's first visit: after a moment, a small card pops up near the middle of the screen.
// The page stays usable underneath. When they pick "Maybe later", press Esc, click somewhere
// else or scroll on, the card flies down into a small chip in the bottom corner. From then on
// that chip is all they see, on every page. The chip's × hides it for good. Opening /help
// counts as having seen it too.
//
// It stays off /help, the presentation pages and /mcatalyst.
//
//   on: false   turns it off everywhere
//   round       change this (to 'sp27', say) to show the card to everyone again for a new
//               hiring round. Each round remembers who closed it separately.
//
// Writing tip: this text sits inside 'single quotes', so use a curly apostrophe (’) in words like we’re.
export const hiringNote = {
  on: true,
  round: 'f26',

  kicker: 'We’re hiring',
  title: 'Help us run free MCAT prep at UK.',
  body: 'We need people for teaching, content review, video, design and social media. Any major, any year.',
  go: 'See the roles',
  later: 'Maybe later',

  // The chip in the corner, after the card is put away.
  chip: 'We’re hiring',
  chipClose: 'Hide this for good',

  // The ?from= labels show up in GoatCounter as "help opened: site-popup" and so on.
  cardLink: '/help/?from=site-popup',
  chipLink: '/help/?from=site-corner',
};
