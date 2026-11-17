"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Property = {
  id: string;
  image_url: string | null;
  title: string;
  location: string;
  city: string;
  price: number;
  currency: string;
  listing_type: "sale" | "rent";
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqm: number | null;
  verified: boolean;
};

const cities = [
  {
    name: "Dar es Salaam",
    image: "/images/dar.jpg",
    description:
      "Tanzania's largest city and a major hub for residential, commercial and investment property.",
  },
  {
    name: "Arusha",
    image: "/images/arusha.jpg",
    description:
      "A growing northern city known for tourism, business, residential communities and investment opportunities.",
  },
  {
    name: "Dodoma",
    image: "/images/dodoma.jpg",
    description:
      "Tanzania's capital, with growing demand for residential, commercial and development property.",
  },
  {
    name: "Mwanza",
    image: "/images/mwanza.jpg",
    description:
      "A major commercial centre on Lake Victoria with a growing property market.",
  },
];

export default function LocationsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================
      FETCH PROPERTIES
  ========================== */

  useEffect(() => {
    async function fetchProperties() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("properties")
        .select(
          "id, image_url, title, location, city, price, currency, listing_type, property_type, bedrooms, bathrooms, area_sqm, verified"
        )
        .eq("status", "approved");

      if (error) {
        console.error("Error loading location data:", error);
        setError("We couldn't load the locations.");
      } else {
        setProperties(data || []);
      }

      setLoading(false);
    }

    fetchProperties();
  }, []);

  /* =========================
      LOCATION STATS
  ========================== */

  const locationStats = useMemo(() => {
    return cities.map((city) => {
      const cityProperties = properties.filter(
        (property) =>
          property.city?.toLowerCase() === city.name.toLowerCase()
      );

      const saleCount = cityProperties.filter(
        (property) => property.listing_type === "sale"
      ).length;

      const rentCount = cityProperties.filter(
        (property) => property.listing_type === "rent"
      ).length;

      const verifiedCount = cityProperties.filter(
        (property) => property.verified
      ).length;

      return {
        ...city,
        total: cityProperties.length,
        saleCount,
        rentCount,
        verifiedCount,
      };
    });
  }, [properties]);

  /* =========================
      TOTAL PROPERTY COUNT
  ========================== */

  const totalProperties = properties.length;

  /* =========================
      TOP LOCATIONS
  ========================== */

  const topLocations = useMemo(() => {
    const counts: Record<string, number> = {};

    properties.forEach((property) => {
      if (!property.city) return;

      counts[property.city] =
        (counts[property.city] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [properties]);

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
              className="text-gray-500 transition hover:text-black"
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
              className="text-black"
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
              Explore Tanzania
            </p>

            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em] md:text-7xl">
              Find property
              <br />
              where you&apos;re going.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
              Explore property markets across Tanzania and
              discover homes, businesses, land and developments
              in the places that matter to you.
            </p>

          </div>

          {/* MARKET STAT */}

          <div className="mt-12 flex flex-wrap gap-8">

            <div>
              <p className="text-3xl font-semibold">
                {loading ? "—" : totalProperties}
              </p>

              <p className="mt-1 text-sm text-white/40">
                Approved properties
              </p>
            </div>

            <div>
              <p className="text-3xl font-semibold">
                {cities.length}
              </p>

              <p className="mt-1 text-sm text-white/40">
                Featured cities
              </p>
            </div>

          </div>

        </div>

      </section>

      {/* =========================
          FEATURED CITIES
      ========================== */}

      <section className="px-6 py-16 lg:px-8 lg:py-24">

        <div className="mx-auto max-w-7xl">

          <div className="max-w-2xl">

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
              Cities
            </p>

            <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
              Explore by location.
            </h2>

            <p className="mt-5 text-lg leading-relaxed text-gray-500">
              Browse available property in some of Tanzania&apos;s
              most active and growing property markets.
            </p>

          </div>

          {/* ERROR */}

          {!loading && error && (
            <div className="mt-10 rounded-3xl bg-white px-6 py-20 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F3EE] text-2xl">
                !
              </div>

              <h3 className="mt-6 text-2xl font-semibold">
                Something went wrong
              </h3>

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

          {/* CITY GRID */}

          {!error && (
            <div className="mt-12 grid gap-6 md:grid-cols-2">

              {locationStats.map((city) => (
                <Link
                  key={city.name}
                  href={`/properties?location=${encodeURIComponent(
                    city.name
                  )}`}
                  className="group overflow-hidden rounded-3xl bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >

                  {/* IMAGE */}

                  <div className="relative h-72 overflow-hidden bg-[#E8E5DE]">

                    <img
                      src={city.image}
                      alt={city.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                    <div className="absolute bottom-6 left-6 right-6 text-white">

                      <p className="text-3xl font-semibold tracking-tight">
                        {city.name}
                      </p>

                      <p className="mt-1 text-sm text-white/70">
                        {loading
                          ? "Loading properties..."
                          : `${city.total} ${
                              city.total === 1
                                ? "property"
                                : "properties"
                            }`}
                      </p>

                    </div>

                  </div>

                  {/* CONTENT */}

                  <div className="p-7">

                    <p className="text-sm leading-relaxed text-gray-500">
                      {city.description}
                    </p>

                    <div className="mt-6 grid grid-cols-3 gap-3">

                      <div className="rounded-2xl bg-[#F5F3EE] p-4">

                        <p className="text-xl font-semibold">
                          {loading ? "—" : city.saleCount}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          For sale
                        </p>

                      </div>

                      <div className="rounded-2xl bg-[#F5F3EE] p-4">

                        <p className="text-xl font-semibold">
                          {loading ? "—" : city.rentCount}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          For rent
                        </p>

                      </div>

                      <div className="rounded-2xl bg-[#F5F3EE] p-4">

                        <p className="text-xl font-semibold">
                          {loading ? "—" : city.verifiedCount}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Verified
                        </p>

                      </div>

                    </div>

                    <div className="mt-6 text-sm font-semibold">
                      Explore {city.name} →
                    </div>

                  </div>

                </Link>
              ))}

            </div>
          )}

        </div>

      </section>

      {/* =========================
          PROPERTY MARKET OVERVIEW
      ========================== */}

      {!loading &&
        !error &&
        properties.length > 0 && (
          <section className="bg-white px-6 py-16 lg:px-8 lg:py-24">

            <div className="mx-auto max-w-7xl">

              <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

                <div>

                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                    Property activity
                  </p>

                  <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                    See where the listings are.
                  </h2>

                  <p className="mt-5 max-w-xl text-lg leading-relaxed text-gray-500">
                    As more properties are added to ZOYA, this
                    section gives you a quick view of where
                    listings are currently concentrated.
                  </p>

                </div>

                <div className="rounded-3xl bg-[#F5F3EE] p-7">

                  <div className="space-y-5">

                    {topLocations.map(
                      ([locationName, count], index) => {
                        const percentage =
                          totalProperties > 0
                            ? Math.round(
                                (count / totalProperties) * 100
                              )
                            : 0;

                        return (
                          <div key={locationName}>

                            <div className="flex items-center justify-between">

                              <p className="text-sm font-semibold">
                                {locationName}
                              </p>

                              <p className="text-sm text-gray-500">
                                {count}
                              </p>

                            </div>

                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/5">

                              <div
                                className="h-full rounded-full bg-[#171717]"
                                style={{
                                  width: `${percentage}%`,
                                }}
                              />

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>

                </div>

              </div>

            </div>

          </section>
        )}

      {/* =========================
          LOCATION CTA
      ========================== */}

      <section className="px-6 py-16 lg:px-8 lg:py-24">

        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#171717] px-8 py-16 text-white md:px-16 md:py-20">

          <div className="max-w-3xl">

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/40">
              Find your place
            </p>

            <h2 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
              Your next property could be here.
            </h2>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/60">
              Search the full ZOYA marketplace and find homes,
              offices, commercial spaces, land and developments
              across Tanzania.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">

              <Link
                href="/properties"
                className="rounded-full bg-white px-7 py-3.5 font-semibold text-[#171717] transition hover:bg-white/90"
              >
                Browse properties
              </Link>

              <Link
                href="/list-property"
                className="rounded-full border border-white/20 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                List your property
              </Link>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}