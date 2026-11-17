import { database, failure, json } from "@/lib/server/api";
import { UUID } from "@/lib/validation";

export async function GET(_request: Request, context: { params: Promise<{ bucket: string; owner: string; file: string }> }) {
  try {
    const { bucket, owner, file } = await context.params;
    const extensions = bucket === "property-images" ? "jpg|png|webp" : bucket === "property-videos" ? "mp4|webm" : null;
    if (!extensions || !UUID.test(owner) || !new RegExp(`^[0-9a-f-]{36}\\.(${extensions})$`).test(file)) return json({ error: "Not found." }, 404);
    // Anonymous RLS allows only media attached to an approved listing.
    const { data, error } = await database().storage.from(bucket).createSignedUrl(`${owner}/${file}`, 60);
    if (error || !data) return json({ error: "Not found." }, 404);
    return new Response(null, { status: 307, headers: { Location: data.signedUrl, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  } catch (error) { return failure(error); }
}
