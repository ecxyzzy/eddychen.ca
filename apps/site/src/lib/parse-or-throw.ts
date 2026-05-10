import { Either } from "@lib/util/either";
import { z } from "zod";

export const parseOrThrow = <T>(schema: z.Schema<T>, data: unknown): T =>
  Either.fromTaggedUnion(schema.safeParse(data)).unwrapOrThrow(
    (e) => new Error(JSON.stringify(z.treeifyError(e))),
  );
