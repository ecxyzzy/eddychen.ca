import { revChron } from "@lib/rev-chron";
import type { PostData, PostWithContent, PostWithSlug } from "@lib/types";
import { Maybe } from "@lib/util/maybe";
import matter from "gray-matter";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified().use(remarkParse).use(remarkRehype).use(rehypeStringify);

export const getPrivatePost = async (slug: string, env: Env): Promise<Maybe<PostWithContent>> =>
  Maybe.from(await env.PRIVATE_POSTS.get(`posts/${slug}.md`))
    .mapAsync((o) => o.text())
    .then((p) =>
      p.map(matter).mapAsync(async ({ data, content }) => ({
        data: data as PostData,
        html: await processor.process(content).then((r) => r.toString()),
      })),
    );

export const listPrivatePosts = async (env: Env): Promise<PostWithSlug[]> =>
  Promise.all(
    await env.PRIVATE_POSTS.list({ prefix: "posts/" }).then((p) =>
      p.objects.map((o) =>
        Promise.all([
          o.key.replace(/^posts\//, "").replace(/\.md$/, ""),
          env.PRIVATE_POSTS.get(o.key).then((b) => b?.text().then((q) => matter(q).data)),
        ] as const),
      ),
    ),
  ).then((p) =>
    p
      .filter(([_, b]) => b)
      .map(([slug, data]) => ({ slug, data: data as PostData }))
      .sort(revChron),
  );
