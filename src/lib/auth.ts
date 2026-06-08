import { Just, Maybe } from "claustrum/adt/Maybe";
import { Seq } from "claustrum/collections/Seq";
import { TaskMaybe } from "claustrum/concurrent/TaskMaybe";
import { TaskTry } from "claustrum/concurrent/TaskTry";
import { Context } from "hono";

import { bufToStr, strToBuf } from "@/lib/buffer";
import { typedJsonParse } from "@/lib/typed-json-parse";

interface JsonWebKey {
  kid: string;
  kty: string;
  n: string;
  e: string;
}

interface JWTHeader {
  alg: string;
  kid: string;
}

interface JWTPayload {
  email?: string;
  exp?: number;
}

interface JWT {
  header: JWTHeader;
  payload: JWTPayload;
  signature: Uint8Array;
}

const fetchJsonWebKeys = (certsUrl: string): TaskTry<Seq<JsonWebKey>> =>
  TaskTry(async () => await fetch(certsUrl))
    .filterOrElse(
      r => r.ok,
      r => new Error(`Failed to fetch JSON web keys: ${r.status}`),
    )
    .map(r => r.json<{ keys: JsonWebKey[] }>())
    .map(x => x.keys)
    .map(Seq.from);

let cachedKeys: { keys: Seq<JsonWebKey>; fetchedAt: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000;

async function getJsonWebKeys(certsUrl: string): Promise<Seq<JsonWebKey>> {
  if (cachedKeys && Date.now() - cachedKeys.fetchedAt < CACHE_TTL) {
    return cachedKeys.keys;
  }
  const data = (await fetchJsonWebKeys(certsUrl).run()).get();
  cachedKeys = { keys: data, fetchedAt: Date.now() };
  return data;
}

const parseCookie = (name: string) => (cookieHeader: string) =>
  Maybe(cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))?.[1]);

const decodeJWTPart = <T>(str: string) =>
  typedJsonParse<T>(bufToStr(Uint8Array.fromBase64(str, { alphabet: "base64url" })));

const verifyJWT =
  (certsUrl: string) =>
  (token: string): TaskMaybe<string> =>
    Just(token)
      .map(t => t.split("."))
      .narrow((t): t is [string, string, string] => t.length === 3)
      .map(
        ([h, p, s]): JWT => ({
          header: decodeJWTPart<JWTHeader>(h),
          payload: decodeJWTPart<JWTPayload>(p),
          signature: Uint8Array.fromBase64(s, { alphabet: "base64url" }),
        }),
      )
      .liftTask()
      .flatMap(x =>
        TaskMaybe(async () =>
          Just(x).zip((await getJsonWebKeys(certsUrl)).find(k => k.kid === x.header.kid)),
        ),
      )
      .filter(
        async ([{ header, payload, signature }, { kty, n, e }]) =>
          await crypto.subtle.verify(
            "RSASSA-PKCS1-v1_5",
            await crypto.subtle.importKey(
              "jwk",
              { kty, n, e, alg: "RS256", ext: true },
              { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
              false,
              ["verify"],
            ),
            signature,
            strToBuf(
              `${strToBuf(JSON.stringify(header)).toBase64()}.${strToBuf(JSON.stringify(payload)).toBase64()}`,
            ),
          ),
      )
      .filter(([{ payload }]) => payload.exp && payload.exp >= Date.now() / 1000)
      .map(([{ payload }]) => payload.email);

const getAuthndUserProd = (request: Request, env: CloudflareBindings): TaskMaybe<string> =>
  Maybe(request.headers.get("cookie"))
    .flatMap(parseCookie("CF_Authorization"))
    .liftTask()
    .flatMap(verifyJWT(env.CF_ACCESS_CERTS_URL));

export const getAuthenticatedUser = (
  c: Context<{ Bindings: CloudflareBindings }>,
): TaskMaybe<string> =>
  import.meta.env.DEV ? Just("dev@localhost").liftTask() : getAuthndUserProd(c.req.raw, c.env);
