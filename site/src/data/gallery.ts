// ─────────────────────────────────────────────────────────────
//  Club photo collage (bottom of the About page).
//
//  1. Drop a photo into src/assets/gallery/ (jpg, png, webp, avif; any size).
//  2. Add a line below with its filename and a caption.
//
//  Photos appear in the order listed here; any photo in the folder that
//  isn't listed still shows (after these), just without a caption.
//  `date` is optional, in YYYY-MM-DD form.
// ─────────────────────────────────────────────────────────────

export type GalleryPhoto = { file: string; caption?: string; date?: string };

export const gallery: GalleryPhoto[] = [
  // { file: 'first-seminar.jpg', caption: 'Our very first seminar, Biology 1 in CP 222', date: '2026-09-09' },
];
