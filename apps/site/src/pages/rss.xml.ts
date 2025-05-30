import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import { revChron } from "@lib/rev-chron.ts";
import type { APIRoute } from "astro";

export const GET: APIRoute = async (ctx) => {
  const blog = await getCollection("blog");
  return rss({
    title: "Eddy's Blog",
    description: "Miscellaneous musings of a mediocre maker",
    site: ctx.site ?? "https://eddychen.ca",
    items: blog.sort(revChron).map(({ id, data }) => ({
      id,
      title: data.title,
      pubDate: data.date,
      description: data.description,
      link: `/blog/${id}`,
    })),
  });
};
