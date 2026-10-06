# Updating the M-CATS website

Almost everything on the site comes from a handful of small text files. You never need to touch the page code to post slides, add a meeting, or add a resource.

## Preview your changes

```bash
cd site
npm install      # first time only
npm run dev
```

Open http://localhost:4321. The page refreshes when you save a file. If a file has a mistake, the browser shows an error naming the file and the field.

---

## Weekly: post slides (or a recording) to a meeting

1. Put the PDF in `site/public/powerpoints/`. The file name can be anything.
2. Open that meeting's file in `site/src/content/meetings/`, e.g. `2026-10-12-chemistry.yaml`.
3. Add a `materials:` list (or add to the existing one):

```yaml
materials:
  - { kind: slides, chapters: [gc-8], href: "/powerpoints/Gas Phase.pdf" }
  - { kind: slides, chapters: [gc-12], href: "/powerpoints/Electrochem.pdf" }
  - { kind: recording, chapters: [gc-8, gc-12], href: "https://youtu.be/..." }
```

That's it. The material now shows up in:
- the meeting's page and the calendar (▣ slides, ▶ recording),
- the "By chapter" view on the Meetings page,
- the Resource library (searchable by chapter: "gc8", "gen chem 8", "gas phase"),
- the calendar feed.

**Naming is automatic.** A file tagged `[gc-8]` is shown as "Gen Chem 8 — The Gas Phase". A deck covering several chapters, e.g. `[orgo-2, gc-5, gc-6]`, is shown as "Orgo 2 · Gen Chem 5 & 6". To override the name, add `title: "Your title"`.

**`kind`** is one of: `slides`, `recording`, `questions` (question sets), `handout`, `link`.

**One chapter per file is best.** If you split a combined deck, each piece gets its own row in the library.

## Add a meeting

Create a file in `site/src/content/meetings/` named `YYYY-MM-DD-something.yaml`:

```yaml
title: Chemistry Seminar
type: chemistry            # chemistry | biology | general
date: 2027-01-18
time: "6:00 PM"
end: "9:00 PM"
location: White Hall 231
covers: [gc-1, gc-2]       # Kaplan chapters (codes below)
topics:                    # optional: anything that isn't a chapter
  - "Review session"
```

Optional fields: `summary` (a sentence for general meetings), `recap` (bullet list shown after the meeting), `materials` (see above), `resources` (ids from the library to link, e.g. `[amino-acids-deck]`).

The site works out "upcoming" vs "past", the "Next up" banner, the countdown and the session numbers by itself.

## Add a resource to the library

Open `site/src/content/resources.yaml` and add an entry where you want it to appear (the order in the file is the order on the page):

```yaml
- id: biochem-pathways-sheet        # unique, lowercase-with-dashes
  title: Biochem Pathways Sheet
  kind: handout                     # anki | handout | tool | course | book | community
  sections: [bb]                    # any of cp, cars, bb, ps; leave out for "all sections"
  subject: Biochemistry             # optional
  cost: free                        # free | paid
  summary: One line shown in the list.
  stats: PDF                        # optional short tag, e.g. "4,747 cards"
  href: /handouts/Pathways.pdf      # a file in site/public/, or a full https:// link
  download: Pathways_TheMCATS.pdf   # optional: name to save the file as
  note: Talk to us before using this one.   # optional warning line
  details: >-
    The longer description shown when the row is expanded.
    It can span several lines like this.
```

Files you host yourself go in `site/public/handouts/` or `site/public/decks/` (Anki `.apkg`).

**YAML tips:** keep the indentation exactly two spaces; wrap a value in quotes if it contains a colon (`"Gen Chem: Review"`).

## Kaplan chapter codes

| Book | Code | Example |
|---|---|---|
| Biology | `bio-1` … `bio-12` | `bio-5` = The Endocrine System |
| Biochemistry | `biochem-1` … `biochem-12` | `biochem-2` = Enzymes |
| General Chemistry | `gc-1` … `gc-12` | `gc-7` = Thermochemistry |
| Organic Chemistry | `orgo-1` … `orgo-12` | `orgo-11` = Spectroscopy |

Chapter titles live in `site/src/lib/kaplan.ts`.

---

## Everything else

| To change… | Edit |
|---|---|
| Scholarship dates, link, criteria, FAQ | `site/src/data/scholarship.ts` |
| Team members and the officer application | `site/src/data/team.ts` |
| Team photos | drop files in `site/src/assets/team/<person-id>/` (see the README there) |
| About page beliefs, letter, P.S. | `site/src/data/about.ts` |
| About page photo collage | photo in `site/src/assets/gallery/` + a line in `site/src/data/gallery.ts` |
| Hours tutored, students helped, money saved | `site/src/data/impact.ts` (hidden until filled in) |
| GroupMe, BBNvolved, tutoring booking links | `site/src/data/join.ts` |

## Publishing

Commit and push to `main`. GitHub builds the site and themcats.org updates in a minute or two. If the build fails, the GitHub Actions tab shows which file and field caused it, and the live site stays on the previous version.
