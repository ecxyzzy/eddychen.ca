export const typedJsonParse = <T>(str: string, reviver?: (k: string, v: unknown) => unknown): T =>
  JSON.parse(str, reviver) as T;
