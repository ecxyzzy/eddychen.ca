import { Try } from "claustrum/adt/Try";
import { type ZodError, z } from "zod";

export const parseOrThrow = <T>(schema: z.Schema<T>, value: unknown): T =>
  Try(() => z.parse(schema, value))
    .mapFailure<ZodError<T>>((e) => JSON.stringify(z.treeifyError(e)))
    .get();
