import { parseOrThrow } from "@lib/parse-or-throw";
import { revChron } from "@lib/rev-chron";
import { postDataSchema } from "@lib/schema";
import type { PostData, PostWithContent, PostWithSlug } from "@lib/types";
import { Maybe } from "@lib/util/maybe";
import type { Nullable } from "@lib/util/types";
import matter from "gray-matter";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified().use(remarkParse).use(remarkRehype).use(rehypeStringify);

export const getPrivatePost = async (slug: string, env: Env): Promise<Nullable<PostWithContent>> =>
  Maybe.from(await env.PRIVATE_POSTS.get(`posts/${slug}.mdx`))
    .mapAsync((o) => o.text())
    .then((p) =>
      p.map(matter).mapAsync(async ({ data, content }) => ({
        data: parseOrThrow(postDataSchema, data),
        html: await processor.process(content).then((r) => r.toString()),
      })),
    )
    .then((p) => p.get());

export const listPrivatePosts = async (env: Env): Promise<PostWithSlug[]> =>
  Promise.all(
    await env.PRIVATE_POSTS.list({ prefix: "posts/" }).then((p) =>
      p.objects
        .filter((o) => o.key.endsWith(".mdx"))
        .map((o) =>
          Promise.all([
            o.key.replace(/^posts\//, "").replace(/\.mdx$/, ""),
            env.PRIVATE_POSTS.get(o.key).then((b) =>
              b?.text().then((q) => parseOrThrow(postDataSchema, matter(q).data)),
            ),
          ] as const),
        ),
    ),
  ).then((p) =>
    p
      .filter((x): x is [string, PostData] => !!x[1])
      .map(([slug, data]) => ({ slug, data }))
      .sort(revChron),
  );
