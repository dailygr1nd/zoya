export class InputError extends Error {}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new InputError("Expected an object.");
  return value as Record<string, unknown>;
}

function text(value: unknown, name: string, min: number, max: number) {
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) {
    throw new InputError(`${name} must contain ${min}–${max} characters.`);
  }
  return value.trim();
}

function choice(value: unknown, name: string, options: string[]) {
  if (typeof value !== "string" || !options.includes(value)) throw new InputError(`Invalid ${name}.`);
  return value;
}

function number(value: unknown, name: string, min: number, max: number, integer = false) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
    throw new InputError(`Invalid ${name}.`);
  }
  return value;
}

function fields(input: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(input).some((key) => !allowed.includes(key))) throw new InputError("Unexpected field.");
}

export function parseListing(value: unknown, ownerId: string) {
  const v = object(value);
  fields(v, ["submission_id", "title", "description", "listing_type", "property_type", "price", "currency", "rent_period", "location", "city", "bedrooms", "bathrooms", "area_sqm", "agent_name", "agent_phone", "agent_whatsapp", "image_urls", "video_url"]);
  if (typeof v.submission_id !== "string" || !UUID.test(v.submission_id)) throw new InputError("Invalid submission identifier.");
  const listingType = choice(v.listing_type, "listing type", ["sale", "rent"]);
  const media = (url: unknown, bucket: string, extensions: string) => {
    if (typeof url !== "string" || !new RegExp(`^/api/media/${bucket}/${ownerId}/[0-9a-f-]{36}\\.(${extensions})$`).test(url)) {
      throw new InputError("Invalid media reference.");
    }
    return url;
  };
  if (!Array.isArray(v.image_urls) || v.image_urls.length < 1 || v.image_urls.length > 10) throw new InputError("Provide 1–10 images.");
  const images = v.image_urls.map((url) => media(url, "property-images", "jpg|png|webp"));
  if (new Set(images).size !== images.length) throw new InputError("Duplicate images.");
  const phone = (value: unknown) => {
    if (typeof value !== "string" || !/^\+[1-9][0-9]{7,14}$/.test(value)) throw new InputError("Use international phone format, for example +255712345678.");
    return value;
  };
  if (listingType === "sale" && v.rent_period != null) throw new InputError("Sale listings cannot have a rent period.");
  return {
    submission_id: v.submission_id,
    title: text(v.title, "Title", 3, 160),
    description: v.description == null ? null : text(v.description, "Description", 0, 10000),
    listing_type: listingType,
    property_type: choice(v.property_type, "property type", ["apartment", "house", "office", "shop", "warehouse", "land", "development"]),
    price: number(v.price, "price", 0.01, 99999999999999.99),
    currency: choice(v.currency, "currency", ["TZS", "USD"]),
    rent_period: listingType === "rent" ? choice(v.rent_period, "rent period", ["day", "week", "month", "year"]) : null,
    location: text(v.location, "Location", 2, 200),
    city: text(v.city, "City", 2, 100),
    bedrooms: number(v.bedrooms, "bedrooms", 0, 100, true),
    bathrooms: number(v.bathrooms, "bathrooms", 0, 100, true),
    area_sqm: v.area_sqm == null ? null : number(v.area_sqm, "area", 0.01, 1000000000),
    agent_name: text(v.agent_name, "Contact name", 1, 120),
    agent_phone: phone(v.agent_phone),
    agent_whatsapp: phone(v.agent_whatsapp),
    image_urls: images,
    video_url: v.video_url == null ? null : media(v.video_url, "property-videos", "mp4|webm"),
  };
}

export function parseModeration(value: unknown) {
  const v = object(value);
  fields(v, ["id", "status", "expected_status", "reason"]);
  if (typeof v.id !== "string" || !UUID.test(v.id)) throw new InputError("Invalid property identifier.");
  return { id: v.id, status: choice(v.status, "status", ["pending", "approved", "rejected"]),
    expected_status: choice(v.expected_status, "expected status", ["pending", "approved", "rejected"]),
    reason: text(v.reason, "Review reason", 5, 1000) };
}
