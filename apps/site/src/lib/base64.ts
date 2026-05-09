import { Maybe } from "@lib/util/maybe";

export const base64UrlToBase64 = (str: string): Uint8Array =>
  Maybe.some(str.replace(/-/g, "+").replace(/_/g, "/"))
    .map((s) => s + "=".repeat((4 - (s.length % 4)) % 4))
    .map(atob)
    .map((s) => new Uint8Array(Array.from(new Array(s.length).map((_, i) => s.charCodeAt(i)))))
    .unwrap();

export const base64Encode = (str: string): Uint8Array => new TextEncoder().encode(str);

export const base64Decode = (buf: Uint8Array): string => new TextDecoder().decode(buf);
