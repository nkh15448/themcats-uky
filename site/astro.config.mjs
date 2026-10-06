// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // The live site is themcats.org at the root. A preview build overrides these, e.g.
  //   SITE_URL=https://nkh15448.github.io SITE_BASE=/themcats-preview PUBLIC_PREVIEW=1 npm run build
  site: process.env.SITE_URL ?? 'https://themcats.org',
  base: process.env.SITE_BASE ?? '/',
  // Fetch a page in the background as soon as its link is hovered.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
});
