import { Seq } from "claustrum/collections/Seq";
import { FC } from "hono/jsx";

import { PostWithSlug } from "@/lib/types";

export const PrivatePosts: FC<{ posts: Seq<PostWithSlug> }> = ({ posts }) => (
  <>
    <h1>Private Posts</h1>
    <ul>
      {posts.map(({ slug, data }) => (
        <li>
          <div>
            <a href={`/private/${slug}`}>{data.title}</a>
            <p class="text-half">
              {data.description} ({data.date.toLocaleDateString("en-CA")})
            </p>
          </div>
        </li>
      ))}
    </ul>
    <a href="/">Go back</a>
  </>
);
