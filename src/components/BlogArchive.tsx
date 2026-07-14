import { Arr } from "claustrum/collections/Arr";
import { FC } from "hono/jsx";

import { PostWithSlug } from "@/lib/types";

export const BlogArchive: FC<{ posts: Arr<PostWithSlug> }> = ({ posts }) => (
  <>
    <h1>Blog Archive</h1>
    <ul>
      {posts
        .map(({ slug, data }) => (
          <li>
            <div>
              <a href={`/blog/${slug}`}>{data.title}</a>
              <p class="text-half">
                {data.description} ({data.date.toLocaleDateString("en-CA")})
              </p>
            </div>
          </li>
        ))
        .toJsArray()}
    </ul>
    <a href="/">Go back</a>
  </>
);
