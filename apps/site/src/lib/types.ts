import type { z } from "zod";

import type { postDataSchema } from "./schema";

export type PostData = z.infer<typeof postDataSchema>;

export interface Post {
  data: PostData;
}

export interface PostWithContent extends Post {
  html: string;
}

export interface PostWithSlug extends Post {
  slug: string;
}
