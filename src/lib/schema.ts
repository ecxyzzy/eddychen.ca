import { z } from "zod";

export const postDataSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
});
