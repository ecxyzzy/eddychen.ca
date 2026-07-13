import { Just } from "claustrum/adt/Maybe";
import { TaskMaybe } from "claustrum/concurrent/TaskMaybe";
import matter, { GrayMatterFile } from "gray-matter";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import { parseOrThrow } from "@/lib/parse-or-throw";
import { postDataSchema } from "@/lib/schema";
import type { PostWithContent } from "@/lib/types";

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeStringify);

export const matterToContent = async ({
  data,
  content,
}: GrayMatterFile<string>): Promise<PostWithContent> => ({
  data: parseOrThrow(postDataSchema, data),
  html: (await processor.process(content)).toString(),
});

export const bodyToContent = (body: R2ObjectBody): TaskMaybe<PostWithContent> =>
  Just(body)
    .liftTask()
    .map(o => o.text())
    .map(matter)
    .map(matterToContent);
