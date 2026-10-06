// Kaplan MCAT chapter titles, keyed by the codes used in meeting `covers:` lists.
export const BOOKS = {
  bio: { name: 'Biology', short: 'Bio', abbr: 'Bio', section: 'bb' },
  biochem: { name: 'Biochemistry', short: 'Biochem', abbr: 'Biochem', section: 'bb' },
  gc: { name: 'General Chemistry', short: 'Gen Chem', abbr: 'GC', section: 'cp' },
  orgo: { name: 'Organic Chemistry', short: 'Orgo', abbr: 'Orgo', section: 'cp' },
  phys: { name: 'Physics & Math', short: 'Physics', abbr: 'PM', section: 'cp' },
  bs: { name: 'Behavioral Sciences', short: 'Behavioral', abbr: 'BS', section: 'ps' },
} as const;
export type BookId = keyof typeof BOOKS;

const CHAPTERS: Record<string, string[]> = {
  bio: ['The Cell', 'Reproduction', 'Embryogenesis and Development', 'The Nervous System', 'The Endocrine System', 'The Respiratory System', 'The Cardiovascular System', 'The Immune System', 'The Digestive System', 'Homeostasis', 'The Musculoskeletal System', 'Genetics and Evolution'],
  biochem: ['Amino Acids, Peptides, and Proteins', 'Enzymes', 'Nonenzymatic Protein Function and Protein Analysis', 'Carbohydrate Structure and Function', 'Lipid Structure and Function', 'DNA and Biotechnology', 'RNA and the Genetic Code', 'Biological Membranes', 'Carbohydrate Metabolism I', 'Carbohydrate Metabolism II', 'Lipid and Amino Acid Metabolism', 'Bioenergetics and Regulation of Metabolism'],
  gc: ['Atomic Structure', 'The Periodic Table', 'Bonding and Chemical Interactions', 'Compounds and Stoichiometry', 'Chemical Kinetics', 'Equilibrium', 'Thermochemistry', 'The Gas Phase', 'Solutions', 'Acids and Bases', 'Oxidation–Reduction Reactions', 'Electrochemistry'],
  orgo: ['Nomenclature', 'Isomers', 'Bonding', 'Analyzing Organic Reactions', 'Alcohols', 'Aldehydes and Ketones I', 'Aldehydes and Ketones II', 'Carboxylic Acids', 'Carboxylic Acid Derivatives', 'Nitrogen- and Phosphorus-Containing Compounds', 'Spectroscopy', 'Separations and Purifications'],
};

export function chapter(code: string) {
  const [book, n] = code.split('-') as [keyof typeof BOOKS, string];
  const b = BOOKS[book];
  const num = Number(n);
  return {
    code,
    bookId: book,
    num,
    book: b?.name ?? book,
    short: `${b?.short ?? book} ${num}`,
    abbr: `${b?.abbr ?? book} ${num}`,
    title: CHAPTERS[book]?.[num - 1] ?? '',
    section: b?.section,
  };
}

export const chaptersOf = (book: string) => (CHAPTERS[book] ?? []).map((_, i) => chapter(`${book}-${i + 1}`));

/** "Gen Chem 4, 7 & 9" or "Orgo 2 · Gen Chem 5 & 6": a compact name for a set of chapters. */
export function chapterSetName(codes: string[]) {
  const groups = new Map<string, number[]>();
  for (const c of codes.map(chapter)) {
    groups.set(c.bookId, [...(groups.get(c.bookId) ?? []), c.num]);
  }
  return [...groups]
    .map(([book, nums]) => {
      const list = nums.length > 1 ? `${nums.slice(0, -1).join(', ')} & ${nums.at(-1)}` : `${nums[0]}`;
      return `${BOOKS[book as BookId]?.short ?? book} ${list}`;
    })
    .join(' · ');
}
