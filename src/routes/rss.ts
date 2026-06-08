import { Hono } from "hono";

import { getAllPosts } from "@/lib/blog-posts";
import { escapeXml } from "@/lib/escape-xml";

export const rssRoute = new Hono<{ Bindings: CloudflareBindings }>();

rssRoute.get("/rss.xml", c => {
  const posts = getAllPosts();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Eddy's Blog</title>
    <description>Miscellaneous musings of a mediocre maker</description>
    <link>https://eddychen.ca</link>
${posts
  .map(
    ({ slug, data }) => `    <item>
      <title>${escapeXml(data.title)}</title>
      <description>${escapeXml(data.description)}</description>
      <pubDate>${data.date.toUTCString()}</pubDate>
      <link>https://eddychen.ca/blog/${slug}</link>
      <guid>https://eddychen.ca/blog/${slug}</guid>
    </item>`,
  )
  .join("\n")}
  </channel>
</rss>`;
  return c.body(xml, { headers: { "Content-Type": "application/rss+xml" } });
});
