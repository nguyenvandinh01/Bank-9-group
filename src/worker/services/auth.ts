import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Context } from "hono";
import type { AppContext } from "../env";
import {
  constantTimeEqual,
  createSignedSession,
  sha256Hex,
  verifySignedSession,
} from "../lib/crypto";
import { forbidden, tooManyRequests, unauthorized } from "../lib/errors";

export const SESSION_COOKIE = "bank9_admin";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function clientIp(c: Context<AppContext>): string {
  return (
    c.req.header("CF-Connecting-IP") ??
    c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ??
    "local"
  );
}

export async function isRateLimited(
  c: Context<AppContext>,
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const db = c.env.DB;
  const now = Date.now();
  const row = await db
    .prepare("SELECT count, window_start FROM rate_limits WHERE key = ?")
    .bind(key)
    .first<{ count: number; window_start: number }>();

  if (!row || now - row.window_start > windowMs) {
    await db
      .prepare(
        `INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)
         ON CONFLICT(key) DO UPDATE SET count = 1, window_start = excluded.window_start`,
      )
      .bind(key, now)
      .run();
    return false;
  }

  if (row.count >= limit) return true;

  await db
    .prepare("UPDATE rate_limits SET count = count + 1 WHERE key = ?")
    .bind(key)
    .run();
  return false;
}

export async function requireAdmin(
  c: Context<AppContext>,
): Promise<string> {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) throw unauthorized();

  const payload = await verifySignedSession(c.env.SESSION_SECRET, token);
  if (!payload) throw unauthorized("Phiên đăng nhập không hợp lệ");

  if (payload.exp < Date.now()) throw unauthorized("Phiên đăng nhập đã hết hạn");

  const tokenHash = await sha256Hex(token);
  const session = await c.env.DB.prepare(
    "SELECT email, expires_at FROM admin_sessions WHERE token_hash = ?",
  )
    .bind(tokenHash)
    .first<{ email: string; expires_at: number }>();

  if (!session || session.expires_at < Date.now()) {
    throw unauthorized("Phiên đăng nhập đã hết hạn");
  }

  if (!constantTimeEqual(session.email, payload.email)) {
    throw unauthorized("Phiên đăng nhập không hợp lệ");
  }

  return session.email;
}

export function assertSameOrigin(c: Context<AppContext>): void {
  const method = c.req.method;
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return;

  const origin = c.req.header("Origin");
  if (!origin) return;

  const url = new URL(c.req.url);
  if (origin !== url.origin) {
    throw forbidden("Yêu cầu không hợp lệ");
  }
}

export async function login(
  c: Context<AppContext>,
  email: string,
  password: string,
  userAgent: string | null,
): Promise<{ email: string; expiresAt: number }> {
  const ip = clientIp(c);
  const recent = await c.env.DB.prepare(
    "SELECT COUNT(*) AS attempts FROM login_attempts WHERE ip = ? AND created_at > ?",
  )
    .bind(ip, Date.now() - WINDOW_MS)
    .first<{ attempts: number }>();

  if ((recent?.attempts ?? 0) >= MAX_ATTEMPTS) {
    throw tooManyRequests("Bạn đã thử đăng nhập quá nhiều lần, vui lòng thử lại sau 15 phút");
  }

  const configuredEmail = (c.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const configuredPassword = c.env.ADMIN_PASSWORD ?? "";
  const expected = await sha256Hex(`${configuredEmail}:${configuredPassword}`);
  const actual = await sha256Hex(`${email.trim().toLowerCase()}:${password}`);
  const validEmail = email.trim().toLowerCase() === configuredEmail;
  const validPassword = constantTimeEqual(expected, actual);
  const success = Boolean(configuredPassword) && validEmail && validPassword;

  await c.env.DB.prepare(
    "INSERT INTO login_attempts (ip, email, success, created_at) VALUES (?, ?, ?, ?)",
  )
    .bind(ip, email.trim().toLowerCase(), success ? 1 : 0, Date.now())
    .run();

  if (!success) throw unauthorized("Email hoặc mật khẩu không đúng");

  const ttlHours = Number.parseInt(c.env.SESSION_TTL_HOURS ?? "12", 10);
  const ttlMs = (Number.isFinite(ttlHours) ? ttlHours : 12) * 60 * 60 * 1000;
  const expiresAt = Date.now() + ttlMs;
  const nonce = crypto.randomUUID();
  const token = await createSignedSession(c.env.SESSION_SECRET, {
    email: configuredEmail,
    exp: expiresAt,
    nonce,
  });

  const tokenHash = await sha256Hex(token);
  await c.env.DB.prepare(
    `INSERT INTO admin_sessions (token_hash, email, expires_at, created_at, user_agent, ip)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(tokenHash, configuredEmail, expiresAt, Date.now(), userAgent, ip)
    .run();

  await c.env.DB.prepare("DELETE FROM admin_sessions WHERE expires_at < ?")
    .bind(Date.now())
    .run();
  await c.env.DB.prepare("DELETE FROM login_attempts WHERE created_at < ?")
    .bind(Date.now() - 24 * 60 * 60 * 1000)
    .run();

  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "Strict",
    secure: c.env.ENVIRONMENT !== "development",
    path: "/",
    maxAge: Math.floor(ttlMs / 1000),
  });

  return { email: configuredEmail, expiresAt };
}

export async function logout(c: Context<AppContext>): Promise<void> {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) {
    const tokenHash = await sha256Hex(token);
    await c.env.DB.prepare("DELETE FROM admin_sessions WHERE token_hash = ?")
      .bind(tokenHash)
      .run();
  }
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}
