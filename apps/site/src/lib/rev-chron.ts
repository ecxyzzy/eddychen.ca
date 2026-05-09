import type { Post } from "@lib/types";

export const revChron = (a: Post, b: Post) => b.data.date.valueOf() - a.data.date.valueOf();
