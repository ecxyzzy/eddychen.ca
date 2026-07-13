import { FC } from "hono/jsx";

import { PostWithContent } from "@/lib/types";

export const BlogPost: FC<{ post: PostWithContent }> = ({ post }) => (
  <>
    <h1>{post.data.title}</h1>
    <i>
      {post.data.description} ({post.data.date.toLocaleDateString("en-CA")})
    </i>
    <div dangerouslySetInnerHTML={{ __html: post.html }} />
    <a href="/blog">More posts</a> <a href="/">Go back</a>
  </>
);
