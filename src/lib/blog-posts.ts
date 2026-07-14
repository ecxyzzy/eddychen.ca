import { Arr } from "claustrum/collections/Arr";
import { StrMap } from "claustrum/collections/StrMap";
import { TaskMaybe } from "claustrum/concurrent/TaskMaybe";
import matter from "gray-matter";

import { matterToContent } from "@/lib/content";
import { parseOrThrow } from "@/lib/parse-or-throw";
import { revChron } from "@/lib/rev-chron";
import { postDataSchema } from "@/lib/schema";
import type { PostWithContent, PostWithSlug } from "@/lib/types";

const modules = StrMap.from(
  import.meta.glob("../content/blog/*.mdx", {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>,
);

// TODO: add toArr to CollectionLike
const posts = Arr.from(
  modules
    .entries()
    .map(([path, raw]) => ({
      slug: path.replace(/^.*\//, "").replace(/\.mdx$/, ""),
      data: parseOrThrow(postDataSchema, matter(raw).data),
    }))
    .toJsArray()
    .toSorted(revChron),
);

const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

export const getAllPosts = (): Arr<PostWithSlug> => posts;

export const getPost = (slug: string): TaskMaybe<PostWithContent> =>
  modules
    .entries()
    .find(([path]) => path.replace(/^.*\//, "").replace(/\.mdx$/, "") === slug)
    .map(([, raw]) => matter(raw))
    .liftTask()
    .map(matterToContent);

export const getRecentPosts = (): Arr<PostWithSlug> =>
  posts.filter(p => p.data.date.valueOf() >= thirtyDaysAgo).take(3);
