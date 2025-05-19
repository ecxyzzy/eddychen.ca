import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  schema: z.object({ title: z.string(), description: z.string(), date: z.date() }),
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
});

export const collections = { blog };
