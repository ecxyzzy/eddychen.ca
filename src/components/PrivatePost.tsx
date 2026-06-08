import { FC } from "hono/jsx";

import { PostWithContent } from "@/lib/types";

export const PrivatePost: FC<{ post: PostWithContent }> = ({ post }) => (
  <>
    <h1>{post.data.title}</h1>
    <i>
      {post.data.description} ({post.data.date.toLocaleDateString("en-CA")})
    </i>
    <div dangerouslySetInnerHTML={{ __html: post.html }} />
    <a href="/private">More private posts</a>
    <a href="/">Go back</a>
  </>
);
