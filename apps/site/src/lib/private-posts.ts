import { parseOrThrow } from "@lib/parse-or-throw";
import { revChron } from "@lib/rev-chron";
import { postDataSchema } from "@lib/schema";
import type { PostData, PostWithContent, PostWithSlug } from "@lib/types";
import { TaskMaybe } from "@lib/util/task/task-maybe";
import type { List } from "@lib/util/value/list";
import type { Some } from "@lib/util/value/maybe";
import matter from "gray-matter";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified().use(remarkParse).use(remarkRehype).use(rehypeStringify);

export const getPrivatePost = (slug: string, env: Env): TaskMaybe<PostWithContent> =>
  TaskMaybe.from(async () => await env.PRIVATE_POSTS.get(`posts/${slug}.mdx`))
    .map((o) => o.text())
    .map(matter)
    .map(async ({ data, content }) => ({
      data: parseOrThrow(postDataSchema, data),
      html: await processor.process(content).then((r) => r.toString()),
    }));

export const listPrivatePosts = async (env: Env): Promise<List<PostWithSlug>> =>
  TaskMaybe.from(async () => await env.PRIVATE_POSTS.list({ prefix: "posts/" }))
    .map((p) => p.objects)
    .toTaskList()
    .filter((o) => o.key.endsWith(".mdx"))
    .map(
      async (o) =>
        [
          o.key.replace(/^posts\//, "").replace(/\.mdx$/, ""),
          await TaskMaybe.from(async () => await env.PRIVATE_POSTS.get(""))
            .map((o) => o.text())
            .map((q) => parseOrThrow(postDataSchema, matter(q).data))
            .run(),
        ] as const,
    )
    .narrow((x): x is [string, Some<PostData>] => x[1].isSome())
    .map(([slug, maybeData]) => ({ slug, data: maybeData.unwrap() }))
    .toSorted(revChron)
    .run();
