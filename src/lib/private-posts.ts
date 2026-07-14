import { Just, Maybe } from "claustrum/adt/Maybe";
import { Arr } from "claustrum/collections/Arr";
import { Task } from "claustrum/concurrent/Task";
import { TaskMaybe } from "claustrum/concurrent/TaskMaybe";
import { Context } from "hono";

import { bodyToContent } from "@/lib/content";
import type { PostWithContent, PostWithSlug } from "@/lib/types";

export const getPrivatePost = (
  c: Context<{ Bindings: CloudflareBindings }>,
): TaskMaybe<PostWithContent> =>
  TaskMaybe(async () =>
    Maybe(await c.env.PRIVATE_POSTS.get(`posts/${c.req.param("slug")}.mdx`)),
  ).flatMap(bodyToContent);

export const listPrivatePosts = (env: CloudflareBindings): Task<Arr<PostWithSlug>> =>
  Task(async () => await env.PRIVATE_POSTS.list({ prefix: "posts/" })).flatMap(p =>
    Arr.from(p.objects)
      .filter(o => o.key.endsWith(".mdx"))
      .traverseTask(async o =>
        Just(o.key.replace(/^posts\//, "").replace(/\.mdx$/, ""))
          .zip(
            await TaskMaybe(async () => Maybe(await env.PRIVATE_POSTS.get(o.key)))
              .flatMap(bodyToContent)
              .map(c => c.data)
              .run(),
          )
          .map(([slug, data]) => ({ slug, data })),
      )
      .map(s => s.catMaybes()),
  );
