import { Hono } from "hono";

import { HomePage } from "@/components/HomePage";
import { Name } from "@/components/Name";
import { getRecentPosts } from "@/lib/blog-posts";

export const staticRoutes = new Hono<{ Bindings: CloudflareBindings }>();

staticRoutes.get("/", c =>
  c.render(<HomePage posts={getRecentPosts()} />, { pageTitle: "Eddy Chen" }),
);

staticRoutes.get("/name", c => c.render(<Name />, { pageTitle: "Eddy Chen | What's in a name?" }));
