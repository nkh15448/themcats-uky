import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const section = z.enum(['cp', 'cars', 'bb', 'ps']);

const resources = defineCollection({
  loader: file('src/content/resources.yaml'),
  schema: z.object({
    title: z.string(),
    kind: z.enum(['anki', 'handout', 'tool', 'course', 'book', 'community']),
    sections: z.array(section).optional(),
    subject: z.string().optional(),
    cost: z.enum(['free', 'paid']),
    summary: z.string(),
    details: z.string().optional(),
    note: z.string().optional(),
    stats: z.string().optional(),
    href: z.string(),
    download: z.string().optional(),
    // an extra button in the expanded row, e.g. booking a session
    cta: z.object({ label: z.string(), href: z.string() }).optional(),
  }),
});

const meetings = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/meetings' }),
  schema: z.object({
    title: z.string(),
    type: z.enum(['chemistry', 'biology', 'general']),
    date: z.coerce.date(),
    time: z.string(),
    end: z.string().optional(),
    location: z.string(),
    summary: z.string().optional(),
    covers: z.array(z.string()).default([]),
    topics: z.array(z.string()).default([]),
    prep: z.array(z.string()).optional(),
    recap: z.array(z.string()).optional(),
    materials: z
      .array(
        z.object({
          // Optional: when omitted, the name is generated from `chapters`.
          title: z.string().optional(),
          kind: z.enum(['slides', 'recording', 'questions', 'handout', 'link']),
          chapters: z.array(z.string()).default([]),
          href: z.string(),
        }),
      )
      .default([]),
    resources: z.array(z.string()).default([]),
  }),
});

export const collections = { resources, meetings };
