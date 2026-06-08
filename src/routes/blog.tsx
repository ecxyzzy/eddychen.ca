import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { BlogArchive } from "@/components/BlogArchive";
import { BlogPost } from "@/components/BlogPost";
import { getAllPosts, getPost } from "@/lib/blog-posts";

export const blogRoutes = new Hono<{ Bindings: CloudflareBindings }>();

blogRoutes.get("/", c =>
  c.render(<BlogArchive posts={getAllPosts()} />, { pageTitle: "Eddy Chen | Blog Archive" }),
);

blogRoutes.get("/:slug", async c =>
  getPost(c.req.param("slug") ?? "")
    .map(post => c.render(<BlogPost post={post} />))
    .expect(new HTTPException(404))
    .run(),
);
