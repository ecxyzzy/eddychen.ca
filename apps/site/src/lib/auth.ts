import { base64Decode, base64Encode, base64UrlToBase64 } from "@lib/base64";
import { typedJsonParse } from "@lib/typed-json-parse";
import { Maybe } from "@lib/util/maybe";
import { Try } from "@lib/util/try";

interface JWK {
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

const fetchJWKs = async (certsUrl: string): Promise<JWK[]> =>
  Try.fromAsync(async () => await fetch(certsUrl))
    .then((p) =>
      p
        .filterOrElse(
          (r) => r.ok,
          (r) => new Error(`Failed to fetch JWKs: ${r.status}`),
        )
        .mapAsync((r) => r.json<{ keys: JWK[] }>()),
    )
    .then((p) => p.get().keys);

let cachedKeys: { keys: JWK[]; fetchedAt: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000;

async function getJWKs(certsUrl: string): Promise<JWK[]> {
  if (cachedKeys && Date.now() - cachedKeys.fetchedAt < CACHE_TTL) {
    return cachedKeys.keys;
  }
  const data = await fetchJWKs(certsUrl);
  cachedKeys = { keys: data, fetchedAt: Date.now() };
  return data;
}

const parseCookie = (cookieHeader: string, name: string) =>
  Maybe.from(cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))?.[1]);

const decodeJWTPart = <T>(str: string) => typedJsonParse<T>(base64Decode(base64UrlToBase64(str)));

const verifyJWT = (token: string, certsUrl: string): Promise<Maybe<string>> =>
  Maybe.some(token)
    .map((t) => t.split("."))
    .filter((t) => t.length === 3)
    .map(
      ([h, p, s]) =>
        [decodeJWTPart<JWTHeader>(h), decodeJWTPart<JWTPayload>(p), base64UrlToBase64(s)] as const,
    )
    .mapAsync(
      async ([h, p, s]) =>
        [h, p, s, await getJWKs(certsUrl).then((k) => k.find((l) => l.kid === h.kid))] as const,
    )
    .then((p) =>
      p
        .narrow((x): x is [JWTHeader, JWTPayload, Uint8Array, JWK] => !!x[3])
        .filterAsync(
          async ([h, q, s, k]) =>
            await crypto.subtle.verify(
              "RSASSA-PKCS1-v1_5",
              await crypto.subtle.importKey(
                "jwk",
                { kty: k.kty, n: k.n, e: k.e, alg: "RS256", ext: true },
                { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
                false,
                ["verify"],
              ),
              s,
              base64Encode(`${h}.${q}`),
            ),
        ),
    )
    .then((p) => p.filter(([_, q]) => q.exp && q.exp < Date.now() / 1000).map(([_, q]) => q.email));

const getAuthndUserProd = (request: Request, env: Env): Promise<Maybe<string>> =>
  Maybe.from(request.headers.get("cookie"))
    .flatMap((c) => parseCookie(c, "CF_Authorization"))
    .flatMapAsync((t) => verifyJWT(t, env.CF_ACCESS_CERTS_URL));

export const getAuthenticatedUser = async (request: Request, env: Env): Promise<Maybe<string>> =>
  import.meta.env.DEV ? Maybe.some("dev@localhost") : getAuthndUserProd(request, env);
