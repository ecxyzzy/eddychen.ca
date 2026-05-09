export interface PostData {
  title: string;
  description: string;
  date: Date;
}

export interface Post {
  data: PostData;
}

export interface PostWithContent extends Post {
  html: string;
}

export interface PostWithSlug extends Post {
  slug: string;
}
