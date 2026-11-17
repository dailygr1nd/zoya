"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PropertyCard from "../components/PropertyCard";
import { supabase } from "../../lib/supabase";

type Development = {
  id: string;
  image_url: string | null;
  title: string;
  location: string;
  city: string;
  price: number;
  currency: string;
  rent_period: string | null;
  listing_type: "sale" | "rent";
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number | null;
  verified: boolean;
};

const cities = [
  "All",
  "Dar es Salaam",
  "Arusha",
  "Dodoma",
  "Mwanza",
];

export default function DevelopmentsPage() {
  const [developments, setDevelopments] = useState<Development[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [location, setLocation] = useState("All");
  const [listingType, setListingType] = useState("All");

  /* =========================
      FETCH DEVELOPMENTS
  ========================== */

  useEffect(() => {
    async function fetchDevelopments() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "approved")
        .eq("property_type", "development")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading developments:", error);
        setError("We couldn't load the developments.");
      } else {
        setDevelopments(data || []);
      }

      setLoading(false);
    }

    fetchDevelopments();
  }, []);

  /* =========================
      FILTER DEVELOPMENTS
  ========================== */

  const filteredDevelopments = useMemo(() => {
    return developments.filter((development) => {
      const matchesLocation =
        location === "All" ||
        development.city?.toLowerCase() === location.toLowerCase();

      const matchesListingType =
        listingType === "All" ||
        development.listing_type === listingType.toLowerCase();

      return matchesLocation && matchesListingType;
    });
  }, [developments, location, listingType]);

  /* =========================
      PRICE FORMATTER
  ========================== */

  function formatPrice(development: Development) {
    const isUSD =
      development.currency?.toUpperCase() === "USD";

    const formatted = new Intl.NumberFormat(
      isUSD ? "en-US" : "en-TZ"
    ).format(development.price);

    const currencySymbol = isUSD ? "$" : "TSh";

    if (development.listing_type === "rent") {
      return `${currencySymbol} ${formatted} / ${
        development.rent_period || "month"
      }`;
    }

    return `${currencySymbol} ${formatted}`;
  }

  /* =========================
      DETAILS FORMATTER
  ========================== */

  function formatDetails(development: Development) {
    const details: string[] = [];

    if (development.bedrooms > 0) {
      details.push(
        `${development.bedrooms} ${
          development.bedrooms === 1 ? "bed" : "beds"
        }`
      );
    }

    if (development.bathrooms > 0) {
      details.push(
        `${development.bathrooms} ${
          development.bathrooms === 1 ? "bath" : "baths"
        }`
      );
    }

    if (development.area_sqm) {
      details.push(`${development.area_sqm} m²`);
    }

    return details.join(" · ");
  }

  /* =========================
      RESET FILTERS
  ========================== */

  function resetFilters() {
    setLocation("All");
    setListingType("All");
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

          <div className="hidden items-center gap-8 text-sm font-medium md:flex">

            <Link
              href="/properties"
              className="text-gray-500 transition hover:text-black"
            >
              Properties
            </Link>

            <Link
              href="/developments"
              className="text-black"
            >
              Developments
            </Link>

            <Link
              href="/agents"
              className="text-gray-500 transition hover:text-black"
            >
              Agents
            </Link>

            <Link
              href="/locations"
              className="text-gray-500 transition hover:text-black"
            >
              Locations
            </Link>

          </div>

          <Link
            href="/list-property"
            className="rounded-full bg-[#171717] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a2a2a]"
          >
            List Property
          </Link>

        </div>
      </nav>

      {/* =========================
          HERO
      ========================== */}

      <section className="bg-[#171717] px-6 py-20 text-white lg:px-8 lg:py-28">

        <div className="mx-auto max-w-7xl">

          <div className="max-w-3xl">

            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50">
              Property Developments
            </p>

            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em] md:text-7xl">
              Discover what&apos;s being built.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
              Explore new developments, residential projects
              and investment opportunities across Tanzania.
            </p>

          </div>

          <div className="mt-10 flex flex-wrap gap-3">

            <Link
              href="/properties"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#171717] transition hover:bg-white/90"
            >
              Browse all properties
            </Link>

            <Link
              href="/list-property"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              List a development
            </Link>

          </div>

        </div>

      </section>

      {/* =========================
          FILTERS
      ========================== */}

      <section className="border-b border-black/5 bg-white px-6 py-8 lg:px-8">

        <div className="mx-auto max-w-7xl">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Explore
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {filteredDevelopments.length}{" "}
                {filteredDevelopments.length === 1
                  ? "development"
                  : "developments"}{" "}
                available
              </p>

            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="rounded-xl border border-black/10 bg-[#F5F3EE] px-4 py-3 text-sm outline-none transition focus:border-black"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city === "All" ? "All locations" : city}
                  </option>
                ))}
              </select>

              <select
                value={listingType}
                onChange={(e) => setListingType(e.target.value)}
                className="rounded-xl border border-black/10 bg-[#F5F3EE] px-4 py-3 text-sm outline-none transition focus:border-black"
              >
                <option value="All">
                  Buy or Rent
                </option>

                <option value="sale">
                  For sale
                </option>

                <option value="rent">
                  For rent
                </option>
              </select>

              {(location !== "All" || listingType !== "All") && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-[#F5F3EE] hover:text-black"
                >
                  Reset
                </button>
              )}

            </div>

          </div>

        </div>

      </section>

      {/* =========================
          DEVELOPMENT LISTINGS
      ========================== */}

      <section className="px-6 py-14 lg:px-8">

        <div className="mx-auto max-w-7xl">

          {/* LOADING */}

          {loading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="h-[420px] animate-pulse rounded-3xl bg-white"
                />
              ))}

            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="rounded-3xl bg-white px-6 py-20 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F3EE] text-2xl">
                !
              </div>

              <h2 className="mt-6 text-2xl font-semibold">
                Something went wrong
              </h2>

              <p className="mx-auto mt-3 max-w-md text-gray-500">
                {error}
              </p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-7 rounded-full bg-[#171717] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2a2a]"
              >
                Try again
              </button>

            </div>
          )}

          {/* RESULTS */}

          {!loading &&
            !error &&
            filteredDevelopments.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                {filteredDevelopments.map((development) => (
                  <PropertyCard
                    key={development.id}
                    id={development.id}
                    image={
                      development.image_url ||
                      "/images/property-1.jpg"
                    }
                    title={development.title}
                    location={`${development.location}, ${development.city}`}
                    price={formatPrice(development)}
                    details={formatDetails(development)}
                    verified={development.verified}
                  />
                ))}

              </div>
            )}

          {/* EMPTY STATE */}

          {!loading &&
            !error &&
            filteredDevelopments.length === 0 && (
              <div className="rounded-3xl bg-white px-6 py-24 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F3EE] text-2xl">
                  🏗️
                </div>

                <h2 className="mt-6 text-2xl font-semibold">
                  No developments found
                </h2>

                <p className="mx-auto mt-3 max-w-md text-gray-500">
                  There are currently no approved developments
                  matching your search. Try another location or
                  browse all available properties.
                </p>

                <div className="mt-7 flex flex-wrap justify-center gap-3">

                  <button
                    type="button"
                    onClick={resetFilters}
                    className="rounded-full bg-[#171717] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2a2a]"
                  >
                    Clear filters
                  </button>

                  <Link
                    href="/properties"
                    className="rounded-full border border-black/10 px-6 py-3 text-sm font-semibold transition hover:bg-[#F5F3EE]"
                  >
                    Browse properties
                  </Link>

                </div>

              </div>
            )}

        </div>

      </section>

      {/* =========================
          DEVELOPER CTA
      ========================== */}

      <section className="px-6 pb-24 lg:px-8">

        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-white">

          <div className="grid lg:grid-cols-2">

            <div className="p-8 md:p-12 lg:p-16">

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                For developers
              </p>

              <h2 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
                Building something worth discovering?
              </h2>

              <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-500">
                Put your development in front of people
                actively searching for property across Tanzania.
              </p>

              <Link
                href="/list-property"
                className="mt-8 inline-block rounded-full bg-[#171717] px-7 py-3.5 font-semibold text-white transition hover:bg-[#2a2a2a]"
              >
                List your development
              </Link>

            </div>

            <div className="min-h-[320px] bg-[#F5F3EE] p-8 md:p-12 lg:min-h-full">

              <div className="flex h-full flex-col justify-end">

                <div className="text-7xl">
                  🏗️
                </div>

                <p className="mt-8 max-w-sm text-sm leading-relaxed text-gray-500">
                  From residential communities to commercial
                  projects, ZOYA is building a better way for people
                  to discover property opportunities.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}
