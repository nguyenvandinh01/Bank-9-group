const encoder = new TextEncoder();

export function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function randomHex(bytes = 32): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return toHex(digest);
}

export async function hmacHex(secret: string, input: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(input));
  return toHex(signature);
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256Hex(`${salt}:${password}`);
}

export async function createSignedSession(
  secret: string,
  payload: { email: string; exp: number; nonce: string },
): Promise<string> {
  const body = btoa(JSON.stringify(payload));
  const signature = await hmacHex(secret, body);
  return `${body}.${signature}`;
}

export async function verifySignedSession(
  secret: string,
  token: string,
): Promise<{ email: string; exp: number; nonce: string } | null> {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = await hmacHex(secret, body);
  if (!constantTimeEqual(signature, expected)) return null;
  try {
    const payload = JSON.parse(atob(body)) as {
      email: string;
      exp: number;
      nonce: string;
    };
    if (typeof payload.email !== "string" || typeof payload.exp !== "number") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function orderCode(now: number): string {
  const date = new Date(now);
  const y = date.getUTCFullYear().toString().slice(2);
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const random = randomHex(3).toUpperCase();
  return `B9${y}${m}${d}${random}`;
}
