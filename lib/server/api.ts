import { createClient } from "@supabase/supabase-js";
import { InputError } from "../validation.ts";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

export function database(token?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new HttpError(503, "Service is not configured.");
  // Deliberately uses the publishable key and caller's JWT; never bypasses RLS.
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
  });
}

export async function authenticate(request: Request, admin = false) {
  const match = /^Bearer ([^\s]+)$/i.exec(request.headers.get("authorization") || "");
  if (!match) throw new HttpError(401, "Sign in to continue.");
  const db = database(match[1]);
  const { data: { user }, error } = await db.auth.getUser(match[1]);
  if (error || !user) throw new HttpError(401, "Your session has expired. Sign in again.");
  if (admin) {
    const result = await db.rpc("is_marketplace_admin");
    if (result.error) throw new HttpError(503, "Could not verify administrator access.");
    if (result.data !== true) throw new HttpError(403, "Administrator access required.");
  }
  return { db, user };
}

export async function readJson(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new HttpError(415, "JSON required.");
  const reader = request.body?.getReader();
  if (!reader) throw new InputError("Request body required.");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 32768) { await reader.cancel(); throw new HttpError(413, "Request is too large."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)) as unknown; }
  catch { throw new InputError("Invalid JSON."); }
}

export function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
}

export function databaseError(error: { code?: string }) {
  if (error.code === "42501") throw new HttpError(403, "This operation is not permitted.");
  if (error.code === "23505") throw new HttpError(409, "Submission reference already used. Start a new submission.");
  if (error.code === "40001") throw new HttpError(409, "Listing changed. Refresh before reviewing.");
  if (error.code === "P0002") throw new HttpError(404, "Listing not found.");
  if (error.code === "P0001") throw new HttpError(429, "Daily listing limit reached.");
  if (error.code?.startsWith("22") || error.code?.startsWith("23")) throw new HttpError(400, "Invalid listing details or media. Check your submission.");
  throw new HttpError(503, "Could not complete the request.");
}

export function failure(error: unknown) {
  if (error instanceof InputError) return json({ error: error.message }, 400);
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  // Do not log tokens, contact information, or raw database errors.
  console.error("Marketplace request failed", { type: error instanceof Error ? error.name : "unknown" });
  return json({ error: "Could not complete the request." }, 500);
}
