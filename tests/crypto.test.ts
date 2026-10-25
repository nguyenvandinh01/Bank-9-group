import { describe, expect, it } from "vitest";
import {
  constantTimeEqual,
  createSignedSession,
  fromHex,
  hashPassword,
  hmacHex,
  orderCode,
  randomHex,
  sha256Hex,
  toHex,
  verifySignedSession,
} from "../src/worker/lib/crypto";

describe("hex helpers", () => {
  it("round trips bytes", () => {
    const hex = "00ff10a1";
    expect(toHex(fromHex(hex).buffer as ArrayBuffer)).toBe(hex);
  });

  it("creates random hex with the requested length", () => {
    const value = randomHex(8);
    expect(value).toMatch(/^[0-9a-f]{16}$/);
    expect(randomHex(8)).not.toBe(value);
  });
});

describe("hashing", () => {
  it("computes a stable SHA-256 hex digest", async () => {
    expect(await sha256Hex("bank9")).toBe(
      "6241c77b89a128e104e08aaf68d7c85b6a2fa7a2a5b70c53bf009b0a46602be6",
    );
  });

  it("salts passwords", async () => {
    const first = await hashPassword("secret", "salt-a");
    const second = await hashPassword("secret", "salt-b");
    expect(first).not.toBe(second);
    expect(await hashPassword("secret", "salt-a")).toBe(first);
  });

  it("verifies HMAC signatures", async () => {
    const signature = await hmacHex("secret", "payload");
    expect(signature).toHaveLength(64);
    expect(await hmacHex("secret", "payload")).toBe(signature);
    expect(await hmacHex("other", "payload")).not.toBe(signature);
  });
});

describe("constantTimeEqual", () => {
  it("compares equal and different strings", () => {
    expect(constantTimeEqual("abcd", "abcd")).toBe(true);
    expect(constantTimeEqual("abcd", "abce")).toBe(false);
    expect(constantTimeEqual("abc", "abcd")).toBe(false);
  });
});

describe("signed sessions", () => {
  it("signs and verifies a session", async () => {
    const payload = { email: "admin@bank9.local", exp: Date.now() + 60000, nonce: "abc" };
    const token = await createSignedSession("secret", payload);
    expect(await verifySignedSession("secret", token)).toEqual(payload);
  });

  it("rejects a tampered session", async () => {
    const payload = { email: "admin@bank9.local", exp: Date.now() + 60000, nonce: "abc" };
    const token = await createSignedSession("secret", payload);
    const [, signature] = token.split(".");
    const forgedBody = btoa(JSON.stringify({ ...payload, email: "evil@bank9.local" }));
    expect(await verifySignedSession("secret", `${forgedBody}.${signature}`)).toBeNull();
  });

  it("rejects a session signed with another secret", async () => {
    const payload = { email: "admin@bank9.local", exp: Date.now() + 60000, nonce: "abc" };
    const token = await createSignedSession("secret", payload);
    expect(await verifySignedSession("other-secret", token)).toBeNull();
  });

  it("rejects malformed tokens", async () => {
    expect(await verifySignedSession("secret", "not-a-token")).toBeNull();
  });
});

describe("orderCode", () => {
  it("uses the B9 prefix, UTC date and six random hex characters", () => {
    expect(orderCode(0)).toMatch(/^B9700101[0-9A-F]{6}$/);
  });

  it("is unique enough for demo orders", () => {
    const codes = new Set(Array.from({ length: 50 }, () => orderCode(Date.now())));
    expect(codes.size).toBe(50);
  });
});
