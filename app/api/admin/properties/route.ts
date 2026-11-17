import { authenticate, databaseError, failure, json, readJson } from "@/lib/server/api";
import { parseModeration } from "@/lib/validation";

export async function GET(request: Request) {
  try {
    const { db } = await authenticate(request, true);
    const { data, error } = await db.from("properties").select("*").order("created_at", { ascending: false }).limit(100);
    if (error) databaseError(error);
    return json({ properties: data });
  } catch (error) { return failure(error); }
}

export async function PATCH(request: Request) {
  try {
    const { db } = await authenticate(request, true);
    const input = parseModeration(await readJson(request));
    const { error } = await db.rpc("moderate_property", {
      p_id: input.id, p_status: input.status, p_expected_status: input.expected_status, p_reason: input.reason,
    });
    if (error) databaseError(error);
    return json({ ok: true });
  } catch (error) { return failure(error); }
}
