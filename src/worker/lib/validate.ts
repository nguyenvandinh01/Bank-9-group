import type { Context } from "hono";
import type { ZodType } from "zod";
import { badRequest } from "./errors";

export async function parseJson<T>(c: Context, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw badRequest("Dữ liệu gửi lên không phải JSON hợp lệ");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw badRequest(
      "Dữ liệu không hợp lệ",
      parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    );
  }
  return parsed.data;
}

export function intParam(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function boolParam(value: string | undefined): boolean | undefined {
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return undefined;
}

export function cleanText(value: string | null | undefined): string {
  return (value ?? "").trim();
}
