import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import type { APIRoute } from "astro";

export const GET: APIRoute = async (ctx) => {
  const blog = await getCollection("blog");
  return rss({
    title: "Eddy's Blog",
    description: "Miscellaneous musings of a mediocre maker",
    site: ctx.site ?? "https://eddychen.ca",
    items: blog.map(({ id, data }) => ({
      title: data.title,
      pubDate: data.date,
      description: data.description,
      link: `/blog/${id}`,
    })),
  });
};
