import { base64Decode, base64Encode, base64UrlToBase64 } from "@lib/base64";
import { typedJsonParse } from "@lib/typed-json-parse";
import { TaskList } from "@lib/util/task/task-list";
import { TaskMaybe } from "@lib/util/task/task-maybe";
import { TaskTry } from "@lib/util/task/task-try";
import { List } from "@lib/util/value/list";
import { Maybe, Some } from "@lib/util/value/maybe";
import type { Try } from "@lib/util/value/try";

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

const fetchJsonWebKeys = async (certsUrl: string): Promise<Try<List<JsonWebKey>>> =>
  TaskTry(async () => await fetch(certsUrl))
    .filterOrElse(
      (r) => r.ok,
      (r) => new Error(`Failed to fetch JSON web keys: ${r.status}`),
    )
    .map((r) => r.json<{ keys: JsonWebKey[] }>())
    .map(async (x) => x.keys)
    .map(List.from)
    .run();

let cachedKeys: { keys: List<JsonWebKey>; fetchedAt: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000;

async function getJsonWebKeys(certsUrl: string): Promise<List<JsonWebKey>> {
  if (cachedKeys && Date.now() - cachedKeys.fetchedAt < CACHE_TTL) {
    return cachedKeys.keys;
  }
  const data = (await fetchJsonWebKeys(certsUrl)).get();
  cachedKeys = { keys: data, fetchedAt: Date.now() };
  return data;
}

const parseCookie = (cookieHeader: string, name: string) =>
  Maybe(cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))?.[1]);

const decodeJWTPart = <T>(str: string) =>
  base64UrlToBase64(str)
    .map(base64Decode)
    .map(typedJsonParse<T>);

const verifyJWT = (token: string, certsUrl: string): TaskMaybe<string> =>
  Some(token)
    .map((t) => t.split("."))
    .filter((t) => t.length === 3)
    .flatMap(([h, p, s]) =>
      Maybe.all([decodeJWTPart<JWTHeader>(h), decodeJWTPart<JWTPayload>(p), base64UrlToBase64(s)]),
    )
    .map(([header, payload, signature]): JWT => ({ header, payload, signature }))
    .toTask()
    .flatMap((x) =>
      TaskMaybe.all([
        TaskMaybe(async () => Some(x)),
        TaskList(async () => await getJsonWebKeys(certsUrl)).find((k) => k.kid === x.header.kid),
      ]),
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
          base64Encode(`${header}.${payload}`),
        ),
    )
    .filter(([{ payload }]) => payload.exp && payload.exp >= Date.now() / 1000)
    .map(([{ payload }]) => payload.email);

const getAuthndUserProd = (request: Request, env: Env): TaskMaybe<string> =>
  Maybe(request.headers.get("cookie"))
    .flatMap((c) => parseCookie(c, "CF_Authorization"))
    .toTask()
    .flatMap((t) => verifyJWT(t, env.CF_ACCESS_CERTS_URL));

export const getAuthenticatedUser = async (request: Request, env: Env): Promise<Maybe<string>> =>
  import.meta.env.DEV ? Some("dev@localhost") : getAuthndUserProd(request, env).run();
