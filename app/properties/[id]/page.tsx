"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type Property = {
  id: string;

  image_url: string | null;
  image_urls: string[] | null;
  video_url: string | null;

  title: string;
  location: string;
  city: string;

  price: number;
  currency: string;
  rent_period: string | null;

  listing_type: string;
  property_type: string;

  bedrooms: number;
  bathrooms: number;
  area_sqm: number | null;

  verified: boolean;
  description: string | null;

  // Agent information
  agent_name: string | null;
  agent_phone: string | null;
  agent_whatsapp: string | null;
};

export default function PropertyPage() {
  const params = useParams();

  const id = params.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    async function fetchProperty() {
      if (!id) {
        setError("Property not found.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .eq("status", "approved")
        .single();

      if (error) {
        console.error("Error loading property:", error);
        setError("Unable to load this property.");
        setLoading(false);
        return;
      }

      setProperty(data);
      setLoading(false);
    }

    fetchProperty();
  }, [id]);

  /* =========================
      LOADING
  ========================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F3EE]">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">

          <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />

          <div className="mt-8 h-[500px] animate-pulse rounded-[2rem] bg-gray-200" />

          <div className="mt-10 h-20 w-2/3 animate-pulse rounded bg-gray-200" />

        </div>
      </main>
    );
  }

  /* =========================
      ERROR
  ========================== */

  if (error || !property) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F5F3EE] px-6">

        <div className="text-center">

          <div className="text-5xl">
            🏠
          </div>

          <h1 className="mt-6 text-3xl font-semibold">
            Property not found
          </h1>

          <p className="mt-3 text-gray-500">
            {error || "This property may no longer be available."}
          </p>

          <Link
            href="/properties"
            className="mt-8 inline-block rounded-full bg-[#171717] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2a2a]"
          >
            Browse properties
          </Link>

        </div>

      </main>
    );
  }

  /* =========================
      IMAGE GALLERY
  ========================== */

  const images =
    property.image_urls && property.image_urls.length > 0
      ? property.image_urls
      : property.image_url
        ? [property.image_url]
        : ["/images/property-1.jpg"];

  /* =========================
      PRICE
  ========================== */

  const formattedPrice = new Intl.NumberFormat(
    property.currency === "USD" ? "en-US" : "en-TZ"
  ).format(property.price);

  const currencySymbol =
    property.currency === "USD" ? "$" : "TSh";

  const isRent = property.listing_type === "rent";

  const price = `${currencySymbol} ${formattedPrice}`;

  /* =========================
      PROPERTY DETAILS
  ========================== */

  const details = [
    property.bedrooms > 0
      ? {
          label: "Bedrooms",
          value: String(property.bedrooms),
        }
      : null,

    property.bathrooms > 0
      ? {
          label: "Bathrooms",
          value: String(property.bathrooms),
        }
      : null,

    property.area_sqm
      ? {
          label: "Area",
          value: `${property.area_sqm} m²`,
        }
      : null,

    {
      label: "Type",
      value: property.property_type,
    },
  ].filter(Boolean) as {
    label: string;
    value: string;
  }[];

  /* =========================
      CONTACT INFORMATION
  ========================== */

  const agentName =
    property.agent_name?.trim() || "Property Agent";

  const agentPhone =
    property.agent_phone?.trim() || "";

  const agentWhatsapp =
    property.agent_whatsapp?.trim() || "";

  /*
    Converts common Tanzanian number formats into
    the international format required by WhatsApp.

    Examples:

    +255 712 345 678
    → 255712345678

    0712 345 678
    → 255712345678

    712 345 678
    → 255712345678
  */

  function formatWhatsAppNumber(phone: string) {
    let cleaned = phone.replace(/\D/g, "");

    if (cleaned.startsWith("0")) {
      cleaned = "255" + cleaned.substring(1);
    }

    if (cleaned.startsWith("255")) {
      return cleaned;
    }

    if (cleaned.length === 9) {
      return "255" + cleaned;
    }

    return cleaned;
  }

  function contactAgent() {
    if (!agentPhone) {
      alert("No phone number has been provided for this property.");
      return;
    }

    window.location.href = `tel:${agentPhone}`;
  }

  function contactWhatsApp() {
    if (!agentWhatsapp) {
      alert("No WhatsApp number has been provided for this property.");
      return;
    }

    const whatsappNumber = formatWhatsAppNumber(agentWhatsapp);

    const message = encodeURIComponent(
      `Hello ${agentName}, I found your property "${property.title}" on ZOYA and I'm interested in it. Is it still available?`
    );

    window.open(
      `https://wa.me/${whatsappNumber}?text=${message}`,
      "_blank"
    );
  }

  /* =========================
      GALLERY CONTROLS
  ========================== */

  function previousImage() {
    setActiveImage((current) =>
      current === 0 ? images.length - 1 : current - 1
    );
  }

  function nextImage() {
    setActiveImage((current) =>
      current === images.length - 1 ? 0 : current + 1
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F3EE] text-[#171717]">

      {/* =========================
          NAVIGATION
      ========================== */}

      <nav className="border-b border-black/5 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">

          <Link
            href="/"
            className="text-2xl font-bold tracking-[-0.04em]"
          >
            ZOYA
          </Link>

          <Link
            href="/properties"
            className="text-sm font-medium text-gray-500 transition hover:text-black"
          >
            ← Back to properties
          </Link>

        </div>

      </nav>

      {/* =========================
          MAIN
      ========================== */}

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">

        {/* Breadcrumb */}

        <div className="mb-8 text-sm text-gray-500">

          <Link
            href="/"
            className="transition hover:text-black"
          >
            Home
          </Link>

          <span className="mx-2">/</span>

          <Link
            href="/properties"
            className="transition hover:text-black"
          >
            Properties
          </Link>

          <span className="mx-2">/</span>

          <span>
            {property.location}
          </span>

        </div>

        {/* =========================
            GALLERY
        ========================== */}

        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">

          {/* MAIN IMAGE */}

          <div className="relative overflow-hidden rounded-[2rem] bg-white">

            <img
              src={images[activeImage]}
              alt={property.title}
              className="h-[400px] w-full object-cover md:h-[600px]"
            />

            {/* VERIFIED BADGE */}

            {property.verified && (
              <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-lg">

                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs text-white">
                  ✓
                </span>

                ZOYA Verified

              </div>
            )}

            {/* IMAGE COUNTER */}

            {images.length > 1 && (
              <div className="absolute bottom-5 right-5 rounded-full bg-black/60 px-4 py-2 text-xs font-medium text-white backdrop-blur">
                {activeImage + 1} / {images.length}
              </div>
            )}

            {/* PREVIOUS */}

            {images.length > 1 && (
              <button
                type="button"
                onClick={previousImage}
                aria-label="Previous image"
                className="absolute left-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl shadow-md backdrop-blur transition hover:bg-white"
              >
                ←
              </button>
            )}

            {/* NEXT */}

            {images.length > 1 && (
              <button
                type="button"
                onClick={nextImage}
                aria-label="Next image"
                className="absolute right-5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl shadow-md backdrop-blur transition hover:bg-white"
              >
                →
              </button>
            )}

          </div>

          {/* THUMBNAILS */}

          <div className="grid max-h-[600px] grid-cols-4 gap-3 overflow-y-auto lg:grid-cols-1">

            {images.map((image, index) => (

              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveImage(index)}
                className={`overflow-hidden rounded-2xl border-2 transition ${
                  activeImage === index
                    ? "border-[#171717]"
                    : "border-transparent"
                }`}
              >

                <img
                  src={image}
                  alt={`${property.title} ${index + 1}`}
                  className="h-24 w-full object-cover transition duration-300 hover:scale-105 lg:h-[139px]"
                />

              </button>

            ))}

          </div>

        </div>

        {/* =========================
            PROPERTY INFORMATION
        ========================== */}

        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">

          {/* =========================
              LEFT COLUMN
          ========================== */}

          <div>

            {/* LISTING TYPE */}

            <div className="flex flex-wrap items-center gap-3">

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                {isRent ? "For Rent" : "For Sale"} ·{" "}
                {property.property_type}
              </p>

              {property.verified && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  ✓ Verified
                </span>
              )}

            </div>

            {/* TITLE */}

            <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
              {property.title}
            </h1>

            {/* LOCATION */}

            <p className="mt-4 text-lg text-gray-500">
              📍 {property.location}, {property.city}
            </p>

            {/* DETAILS */}

            {details.length > 0 && (
              <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">

                {details.map((detail) => (

                  <div
                    key={`${detail.label}-${detail.value}`}
                    className="rounded-2xl bg-white p-5"
                  >

                    <p className="text-xs uppercase tracking-wider text-gray-400">
                      {detail.label}
                    </p>

                    <p className="mt-2 font-semibold capitalize">
                      {detail.value}
                    </p>

                  </div>

                ))}

              </div>
            )}

            {/* =========================
                DESCRIPTION
            ========================== */}

            <div className="mt-14">

              <h2 className="text-2xl font-semibold">
                About this property
              </h2>

              <p className="mt-5 max-w-3xl whitespace-pre-line text-lg leading-relaxed text-gray-500">
                {property.description ||
                  "No description has been provided for this property yet."}
              </p>

            </div>

            {/* =========================
                VIDEO
            ========================== */}

            {property.video_url && (

              <div className="mt-14">

                <div>

                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Walkthrough
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold">
                    Property video
                  </h2>

                </div>

                <div className="mt-5 overflow-hidden rounded-3xl bg-black">

                  <video
                    src={property.video_url}
                    controls
                    playsInline
                    preload="metadata"
                    className="max-h-[650px] w-full"
                  />

                </div>

              </div>

            )}

            {/* =========================
                LOCATION
            ========================== */}

            <div className="mt-14">

              <h2 className="text-2xl font-semibold">
                Location
              </h2>

              <div className="mt-5 flex h-72 items-center justify-center rounded-3xl bg-[#DEDCD6]">

                <div className="text-center">

                  <div className="text-4xl">
                    📍
                  </div>

                  <p className="mt-3 text-sm font-semibold">
                    {property.location}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {property.city}
                  </p>

                  <p className="mt-4 text-xs text-gray-400">
                    Interactive map coming soon
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* =========================
              RIGHT SIDEBAR
          ========================== */}

          <div>

            <div className="sticky top-8 rounded-3xl bg-white p-7 shadow-sm">

              {/* PRICE */}

              <p className="text-sm text-gray-500">
                {isRent ? "For Rent" : "For Sale"}
              </p>

              <p className="mt-2 text-3xl font-semibold">
                {price}
              </p>

              {isRent && (
                <p className="mt-1 text-sm text-gray-400">
                  per {property.rent_period || "month"}
                </p>
              )}

              <div className="my-7 h-px bg-black/5" />

              {/* LISTED BY */}

              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Listed by
              </p>

              <div className="mt-4 flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F3EE] text-xl">
                  🏠
                </div>

                <div className="min-w-0">

                  <p className="truncate font-semibold">
                    {agentName}
                  </p>

                  {property.verified && (
                    <p className="mt-1 text-xs font-medium text-green-600">
                      ✓ Verified listing
                    </p>
                  )}

                </div>

              </div>

              {/* CONTACT AGENT */}

              <button
                type="button"
                onClick={contactAgent}
                disabled={!agentPhone}
                className="mt-7 w-full rounded-xl bg-[#171717] py-4 font-semibold text-white transition hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Contact Agent
              </button>

              {/* WHATSAPP */}

              <button
                type="button"
                onClick={contactWhatsApp}
                disabled={!agentWhatsapp}
                className="mt-3 w-full rounded-xl border border-black/10 py-4 font-semibold transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                WhatsApp
              </button>

              {/* SAVE */}

              <button
                type="button"
                onClick={() =>
                  alert(
                    "Save property functionality will be available soon."
                  )
                }
                className="mt-3 w-full rounded-xl border border-black/10 py-4 font-semibold transition hover:bg-gray-50"
              >
                ♡ Save Property
              </button>

              {/* CONTACT DETAILS */}

              {(agentPhone || agentWhatsapp) && (

                <div className="mt-6 rounded-2xl border border-black/5 bg-[#F5F3EE] p-4">

                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Contact
                  </p>

                  {agentPhone && (
                    <a
                      href={`tel:${agentPhone}`}
                      className="mt-3 block text-sm font-medium transition hover:underline"
                    >
                      📞 {agentPhone}
                    </a>
                  )}

                  {agentWhatsapp && (
                    <button
                      type="button"
                      onClick={contactWhatsApp}
                      className="mt-2 block text-left text-sm font-medium transition hover:underline"
                    >
                      💬 WhatsApp
                    </button>
                  )}

                </div>

              )}

              {/* SAFETY */}

              <div className="mt-6 rounded-2xl bg-[#F5F3EE] p-4">

                <p className="text-xs font-semibold">
                  Stay safe
                </p>

                <p className="mt-2 text-xs leading-relaxed text-gray-500">
                  Never send money before viewing and verifying a
                  property. Meet the agent or owner in person and
                  confirm the property details before making any
                  payment.
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}