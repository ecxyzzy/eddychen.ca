import { Just } from "claustrum/adt/Maybe";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { PrivatePost } from "@/components/PrivatePost";
import { PrivatePosts } from "@/components/PrivatePosts";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPrivatePost, listPrivatePosts } from "@/lib/private-posts";

export const privateRoutes = new Hono<{ Bindings: CloudflareBindings }>();

privateRoutes.get("/", async c =>
  Just(c)
    .liftTask()
    .flatMap(getAuthenticatedUser)
    .expect(new HTTPException(401))
    .flatMap(_ => listPrivatePosts(c.env))
    .map(posts =>
      c.render(<PrivatePosts posts={posts} />, { pageTitle: "Eddy Chen | Private Posts" }),
    )
    .run(),
);

privateRoutes.get("/:slug", async c =>
  Just(c)
    .liftTask()
    .flatMap(getAuthenticatedUser)
    .expect(new HTTPException(401))
    .map(_ => Just(c))
    .liftMaybe()
    .flatMap(getPrivatePost)
    .expect(new HTTPException(404))
    .map(post =>
      c.render(<PrivatePost post={post} />, { pageTitle: `Eddy Chen | ${post.data.title}` }),
    )
    .run(),
);
