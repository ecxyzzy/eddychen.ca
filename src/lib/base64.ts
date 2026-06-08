import { Just, type Maybe } from "claustrum/adt/Maybe";

export const base64UrlToBase64 = (str: string): Maybe<Uint8Array> =>
  Just(str.replace(/-/g, "+").replace(/_/g, "/"))
    .map(s => s + "=".repeat((4 - (s.length % 4)) % 4))
    .map(atob)
    .map(s => new Uint8Array(Array(s.length)).map((_, i) => s.charCodeAt(i)));

export const base64Encode = (str: string): Uint8Array => new TextEncoder().encode(str);

export const base64Decode = (buf: Uint8Array): string => new TextDecoder().decode(buf);
