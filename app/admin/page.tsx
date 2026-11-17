"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiRequest } from "../../lib/api-client";
import { supabase } from "../../lib/supabase";

type PropertyStatus = "pending" | "approved" | "rejected";

type Property = {
  id: string;
  title: string;
  description: string | null;
  listing_type: string;
  property_type: string;
  price: number;
  currency: string;
  rent_period: string | null;
  location: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number | null;
  verified: boolean;
  status: PropertyStatus;
  image_url: string | null;
  image_urls: string[] | null;
  video_url: string | null;
  created_at: string;
};

type Filter = "pending" | "approved" | "rejected" | "all";

async function loadReviewRows() {
      const result = await apiRequest("/api/admin/properties");
      // Private review media uses the reviewer's JWT, never the anonymous endpoint.
      const preview = async (url: string | null) => {
        if (!url?.startsWith("/api/media/")) return null;
        const [bucket, ...parts] = url.slice("/api/media/".length).split("/");
        const { data } = await supabase.storage.from(bucket).createSignedUrl(parts.join("/"), 600);
        return data?.signedUrl || null;
      };
      const rows = await Promise.all((result.properties as Property[]).map(async (row) => ({
        ...row, image_url: await preview(row.image_url),
        image_urls: (await Promise.all((row.image_urls || []).map(preview))).filter((url): url is string => url !== null),
        video_url: await preview(row.video_url),
      })));
      return rows;
}

export default function AdminPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] =
    useState<Property | null>(null);
  const [filter, setFilter] = useState<Filter>("pending");
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [loadError, setLoadError] = useState("");

  async function fetchProperties() {
    try {
      const rows = await loadReviewRows();
      setProperties(rows);
      setLoadError("");
    } catch (error) {
      setProperties([]);
      setLoadError(error instanceof Error ? error.message : "Unable to load listings.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let active = true;
    loadReviewRows().then(rows => {
      if (active) setProperties(rows);
    }).catch(error => {
      if (active) setLoadError(error instanceof Error ? error.message : "Unable to load listings.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function updateStatus(id: string, status: PropertyStatus) {
    const current = properties.find((property) => property.id === id);
    if (!current) return;
    const reason = window.prompt("Give a review reason (5–1000 characters). Approval does not verify ownership.");
    if (reason === null) return;
    setUpdating(true);
    try {
      await apiRequest("/api/admin/properties", "PATCH", {
        id, status, expected_status: current.status, reason,
      });
      setSelectedProperty(null);
      await fetchProperties();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Review failed.");
      await fetchProperties();
    } finally { setUpdating(false); }
  }

  const filteredProperties = useMemo(() => {
    if (filter === "all") {
      return properties;
    }

    return properties.filter(
      (property) => property.status === filter
    );
  }, [properties, filter]);

  const pendingCount = properties.filter(
    (property) => property.status === "pending"
  ).length;

  const approvedCount = properties.filter(
    (property) => property.status === "approved"
  ).length;

  const rejectedCount = properties.filter(
    (property) => property.status === "rejected"
  ).length;

  function formatPrice(property: Property) {
    const formatted = new Intl.NumberFormat("en-TZ").format(
      property.price
    );

    if (property.listing_type === "rent") {
      return `TSh ${formatted} / ${
        property.rent_period || "month"
      }`;
    }

    return `TSh ${formatted}`;
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-TZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  }

  if (loadError) return <main className="p-10"><h1>Administration unavailable</h1><p role="alert">{loadError}</p><Link href="/login">Sign in</Link></main>;

  return (
    <main className="min-h-screen bg-[#F5F3EE] text-[#171717]">

      {/* =========================
          NAVIGATION
      ========================== */}

      <header className="border-b border-black/5 bg-white">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">

          <div>

            <Link
              href="/"
              className="text-2xl font-bold tracking-[-0.04em]"
            >
              ZOYA
            </Link>

            <p className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-gray-400">
              Admin dashboard
            </p>

          </div>

          <div className="flex items-center gap-5">

            <button
              onClick={() => { setRefreshing(true); void fetchProperties(); }}
              disabled={refreshing}
              className="text-sm font-medium text-gray-500 transition hover:text-black disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <Link
              href="/properties"
              className="text-sm font-medium text-gray-500 transition hover:text-black"
            >
              View marketplace →
            </Link>

          </div>

        </div>

      </header>

      {/* =========================
          HEADER
      ========================== */}

      <section className="px-6 pb-8 pt-12 lg:px-8">

        <div className="mx-auto max-w-7xl">

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            Property management
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Listings
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-500">
            Review and manage properties submitted to ZOYA.
          </p>

        </div>

      </section>

      {/* =========================
          STATS
      ========================== */}

      <section className="px-6 pb-8 lg:px-8">

        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-3">

          {/* PENDING */}

          <button
            onClick={() => setFilter("pending")}
            className={`rounded-3xl p-6 text-left transition ${
              filter === "pending"
                ? "bg-[#171717] text-white"
                : "bg-white hover:-translate-y-0.5"
            }`}
          >

            <p
              className={
                filter === "pending"
                  ? "text-sm text-white/60"
                  : "text-sm text-gray-500"
              }
            >
              Pending review
            </p>

            <p className="mt-2 text-3xl font-semibold">
              {pendingCount}
            </p>

          </button>

          {/* APPROVED */}

          <button
            onClick={() => setFilter("approved")}
            className={`rounded-3xl p-6 text-left transition ${
              filter === "approved"
                ? "bg-[#171717] text-white"
                : "bg-white hover:-translate-y-0.5"
            }`}
          >

            <p
              className={
                filter === "approved"
                  ? "text-sm text-white/60"
                  : "text-sm text-gray-500"
              }
            >
              Approved
            </p>

            <p className="mt-2 text-3xl font-semibold">
              {approvedCount}
            </p>

          </button>

          {/* REJECTED */}

          <button
            onClick={() => setFilter("rejected")}
            className={`rounded-3xl p-6 text-left transition ${
              filter === "rejected"
                ? "bg-[#171717] text-white"
                : "bg-white hover:-translate-y-0.5"
            }`}
          >

            <p
              className={
                filter === "rejected"
                  ? "text-sm text-white/60"
                  : "text-sm text-gray-500"
              }
            >
              Rejected
            </p>

            <p className="mt-2 text-3xl font-semibold">
              {rejectedCount}
            </p>

          </button>

        </div>

      </section>

      {/* =========================
          FILTERS
      ========================== */}

      <section className="px-6 pb-6 lg:px-8">

        <div className="mx-auto flex max-w-7xl flex-wrap gap-2">

          {(
            [
              ["pending", "Pending"],
              ["approved", "Approved"],
              ["rejected", "Rejected"],
              ["all", "All listings"],
            ] as [Filter, string][]
          ).map(([value, label]) => (

            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                filter === value
                  ? "bg-[#171717] text-white"
                  : "bg-white text-gray-500 hover:text-black"
              }`}
            >
              {label}
            </button>

          ))}

        </div>

      </section>

      {/* =========================
          LISTINGS
      ========================== */}

      <section className="px-6 pb-20 lg:px-8">

        <div className="mx-auto max-w-7xl">

          {loading ? (

            <div className="rounded-3xl bg-white p-16 text-center text-gray-500">
              Loading listings...
            </div>

          ) : filteredProperties.length === 0 ? (

            <div className="rounded-3xl bg-white p-16 text-center">

              <div className="text-4xl">
                {filter === "pending"
                  ? "✓"
                  : "🏠"}
              </div>

              <h2 className="mt-5 text-2xl font-semibold">
                {filter === "pending"
                  ? "You're all caught up."
                  : "No listings here."}
              </h2>

              <p className="mt-3 text-gray-500">
                {filter === "pending"
                  ? "There are no properties waiting for review."
                  : "Properties will appear here when they match this status."}
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {filteredProperties.map((property) => (

                <article
                  key={property.id}
                  className="rounded-3xl bg-white p-5"
                >

                  <div className="flex flex-col gap-6 md:flex-row">

                    {/* IMAGE */}

                    <div className="h-52 w-full shrink-0 overflow-hidden rounded-2xl bg-[#F5F3EE] md:w-64">

                      {property.image_url ? (

                        <img
                          src={property.image_url}
                          alt={property.title}
                          className="h-full w-full object-cover"
                        />

                      ) : (

                        <div className="flex h-full items-center justify-center text-3xl">
                          🏠
                        </div>

                      )}

                    </div>

                    {/* CONTENT */}

                    <div className="flex min-w-0 flex-1 flex-col">

                      <div className="flex flex-wrap items-start justify-between gap-3">

                        <div>

                          <div className="flex flex-wrap items-center gap-3">

                            <h2 className="text-xl font-semibold">
                              {property.title}
                            </h2>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                property.status === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : property.status === "rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {property.status}
                            </span>

                          </div>

                          <p className="mt-2 text-sm text-gray-500">
                            {property.location},{" "}
                            {property.city}
                          </p>

                        </div>

                        <p className="font-semibold">
                          {formatPrice(property)}
                        </p>

                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-500">

                        <span className="rounded-full bg-[#F5F3EE] px-3 py-1.5 capitalize">
                          {property.property_type}
                        </span>

                        {property.bedrooms > 0 && (
                          <span className="rounded-full bg-[#F5F3EE] px-3 py-1.5">
                            {property.bedrooms} beds
                          </span>
                        )}

                        {property.bathrooms > 0 && (
                          <span className="rounded-full bg-[#F5F3EE] px-3 py-1.5">
                            {property.bathrooms} baths
                          </span>
                        )}

                        {property.area_sqm && (
                          <span className="rounded-full bg-[#F5F3EE] px-3 py-1.5">
                            {property.area_sqm} m²
                          </span>
                        )}

                        {property.video_url && (
                          <span className="rounded-full bg-[#F5F3EE] px-3 py-1.5">
                            🎥 Video
                          </span>
                        )}

                      </div>

                      <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">

                        <p className="text-xs text-gray-400">
                          Submitted{" "}
                          {formatDate(property.created_at)}
                        </p>

                        <button
                          onClick={() =>
                            setSelectedProperty(property)
                          }
                          className="rounded-full bg-[#171717] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2a2a]"
                        >
                          Review listing →
                        </button>

                      </div>

                    </div>

                  </div>

                </article>

              ))}

            </div>

          )}

        </div>

      </section>

      {/* =========================
          REVIEW MODAL
      ========================== */}

      {selectedProperty && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">

          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] bg-white">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-black/5 bg-white px-6 py-5">

              <div>

                <div className="flex items-center gap-3">

                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">
                    Review listing
                  </p>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      selectedProperty.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : selectedProperty.status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {selectedProperty.status}
                  </span>

                </div>

                <h2 className="mt-1 text-xl font-semibold">
                  {selectedProperty.title}
                </h2>

              </div>

              <button
                onClick={() => setSelectedProperty(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F3EE] text-xl transition hover:bg-gray-200"
              >
                ×
              </button>

            </div>

            <div className="p-6 md:p-8">

              {/* PHOTOS */}

              <div>

                <p className="mb-4 text-sm font-semibold">
                  Property photos
                </p>

                <div className="grid gap-4 sm:grid-cols-2">

                  {(selectedProperty.image_urls?.length
                    ? selectedProperty.image_urls
                    : selectedProperty.image_url
                    ? [selectedProperty.image_url]
                    : []
                  ).map((image, index) => (

                    <div
                      key={`${image}-${index}`}
                      className="overflow-hidden rounded-2xl"
                    >

                      <img
                        src={image}
                        alt={`${selectedProperty.title} ${
                          index + 1
                        }`}
                        className="h-72 w-full object-cover"
                      />

                    </div>

                  ))}

                </div>

              </div>

              {/* VIDEO */}

              {selectedProperty.video_url && (

                <div className="mt-8">

                  <p className="mb-4 text-sm font-semibold">
                    Property video
                  </p>

                  <video
                    src={selectedProperty.video_url}
                    controls
                    playsInline
                    className="max-h-[600px] w-full rounded-2xl bg-black"
                  />

                </div>

              )}

              {/* INFORMATION */}

              <div className="mt-8">

                <p className="mb-4 text-sm font-semibold">
                  Property information
                </p>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                  <Info
                    label="Price"
                    value={formatPrice(selectedProperty)}
                  />

                  <Info
                    label="Location"
                    value={`${selectedProperty.location}, ${selectedProperty.city}`}
                  />

                  <Info
                    label="Type"
                    value={selectedProperty.property_type}
                  />

                  <Info
                    label="Listing"
                    value={
                      selectedProperty.listing_type === "rent"
                        ? "For rent"
                        : "For sale"
                    }
                  />

                  <Info
                    label="Bedrooms"
                    value={String(
                      selectedProperty.bedrooms
                    )}
                  />

                  <Info
                    label="Bathrooms"
                    value={String(
                      selectedProperty.bathrooms
                    )}
                  />

                  <Info
                    label="Area"
                    value={
                      selectedProperty.area_sqm
                        ? `${selectedProperty.area_sqm} m²`
                        : "Not specified"
                    }
                  />

                  <Info
                    label="Verified"
                    value={
                      selectedProperty.verified
                        ? "Yes"
                        : "No"
                    }
                  />

                </div>

              </div>

              {/* DESCRIPTION */}

              {selectedProperty.description && (

                <div className="mt-8">

                  <p className="text-sm font-semibold">
                    Description
                  </p>

                  <p className="mt-3 whitespace-pre-line leading-relaxed text-gray-500">
                    {selectedProperty.description}
                  </p>

                </div>

              )}

              {/* ACTIONS */}

              {selectedProperty.status === "pending" && (

                <div className="mt-10 flex flex-col gap-3 border-t border-black/5 pt-6 sm:flex-row sm:justify-end">

                  <button
                    disabled={updating}
                    onClick={() =>
                      updateStatus(
                        selectedProperty.id,
                        "rejected"
                      )
                    }
                    className="rounded-full border border-red-200 px-6 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reject listing
                  </button>

                  <button
                    disabled={updating}
                    onClick={() =>
                      updateStatus(
                        selectedProperty.id,
                        "approved"
                      )
                    }
                    className="rounded-full bg-[#171717] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updating
                      ? "Updating..."
                      : "Approve listing"}
                  </button>

                </div>

              )}

            </div>

          </div>

        </div>

      )}

    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#F5F3EE] p-4">

      <p className="text-xs uppercase tracking-wider text-gray-400">
        {label}
      </p>

      <p className="mt-2 font-semibold capitalize">
        {value}
      </p>

    </div>
  );
}
