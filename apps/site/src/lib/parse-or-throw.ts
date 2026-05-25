import { Either } from "@lib/util/value/either";
import { type ZodError, z } from "zod";

export const parseOrThrow = <T>(schema: z.Schema<T>, data: unknown): T =>
  Either.fromTaggedUnion<ZodError<T>, T, "success", "error", "data">(
    schema.safeParse(data),
    "success",
    "error",
    "data",
  ).unwrapOrThrow((e) => new Error(JSON.stringify(z.treeifyError(e))));
