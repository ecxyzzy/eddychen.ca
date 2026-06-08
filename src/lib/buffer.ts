export const strToBuf = (str: string): Uint8Array => new TextEncoder().encode(str);

export const bufToStr = (buf: Uint8Array): string => new TextDecoder().decode(buf);
