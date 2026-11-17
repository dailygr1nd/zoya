import { authenticate, databaseError, failure, json, readJson } from "@/lib/server/api";
import { parseListing } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const { db, user } = await authenticate(request);
    const input = parseListing(await readJson(request), user.id);
    const { data, error } = await db.rpc("submit_property", { p_input: input });
    if (error) databaseError(error);
    return json({ id: data }, 201);
  } catch (error) { return failure(error); }
}
