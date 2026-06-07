import { parseOrThrow } from "@lib/parse-or-throw";
import { postDataSchema } from "@lib/schema";
import type { PostWithContent, PostWithSlug } from "@lib/types";
import matter from "gray-matter";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import { Just, Maybe } from "claustrum/adt/Maybe";
import { Seq } from "claustrum/collections/Seq";
import { Task } from "claustrum/concurrent/Task";
import { TaskMaybe } from "claustrum/concurrent/TaskMaybe";

const processor = unified().use(remarkParse).use(remarkRehype).use(rehypeStringify);

export const getPrivatePost = (slug: string, env: Env): TaskMaybe<PostWithContent> =>
  TaskMaybe(async () => Maybe(await env.PRIVATE_POSTS.get(`posts/${slug}.mdx`)))
    .map((o) => o.text())
    .map(matter)
    .map(async ({ data, content }) => ({
      data: parseOrThrow(postDataSchema, data),
      html: await processor.process(content).then((r) => r.toString()),
    }));

export const listPrivatePosts = (env: Env): Task<Seq<PostWithSlug>> =>
  Task(async () => await env.PRIVATE_POSTS.list({ prefix: "posts/" })).flatMap((p) =>
    Seq.from(p.objects)
      .filter((o) => o.key.endsWith(".mdx"))
      .traverseTask(async (o) =>
        Just(o.key.replace(/^posts\//, "").replace(/\.mdx$/, ""))
          .zip(
            await TaskMaybe(async () => Maybe(await env.PRIVATE_POSTS.get(o.key)))
              .map((o) => o.text())
              .map((q) => parseOrThrow(postDataSchema, matter(q).data))
              .run(),
          )
          .map(([slug, data]): PostWithSlug => ({ slug, data })),
      )
      .map((s) => s.catMaybes()),
  );
