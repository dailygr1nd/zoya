"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "./components/Navbar";
import PropertyCard from "./components/PropertyCard";
import LocationCard from "./components/LocationCard";
import { supabase } from "../lib/supabase";

type Property = {
  id: string;
  image_url: string | null;
  title: string;
  location: string;
  city: string;
  price: number;
  currency: string;
  rent_period: string | null;
  listing_type: "sale" | "rent";
  bedrooms: number;
  bathrooms: number;
  area_sqm: number | null;
  verified: boolean;
};

const locations = [
  {
    image: "/images/dar.jpg",
    name: "Dar es Salaam",
    propertyCount: "1,240 properties",
  },
  {
    image: "/images/arusha.jpg",
    name: "Arusha",
    propertyCount: "420 properties",
  },
  {
    image: "/images/dodoma.jpg",
    name: "Dodoma",
    propertyCount: "285 properties",
  },
  {
    image: "/images/mwanza.jpg",
    name: "Mwanza",
    propertyCount: "190 properties",
  },
];

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);

  /* =========================
      SEARCH STATE
  ========================== */

  const [searchListingType, setSearchListingType] =
    useState<"sale" | "rent">("sale");

  const [searchPropertyType, setSearchPropertyType] =
    useState("all");

  const [searchLocation, setSearchLocation] =
    useState("all");

  /* =========================
      LOAD FEATURED PROPERTIES
  ========================== */

  useEffect(() => {
    async function fetchFeaturedProperties() {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) {
        console.error(
          "Error loading featured properties:",
          error
        );
      } else {
        setProperties(data || []);
      }

      setLoadingProperties(false);
    }

    fetchFeaturedProperties();
  }, []);

  /* =========================
      HOMEPAGE SEARCH
  ========================== */

  function handleSearch() {
    const params = new URLSearchParams();

    // Buy / Rent
    params.set("listing", searchListingType);

    // Property type
    if (searchPropertyType !== "all") {
      params.set("type", searchPropertyType);
    }

    // Location
    if (searchLocation !== "all") {
      params.set("location", searchLocation);
    }

    // Send the user to the existing
    // properties/search page.
    window.location.href = `/properties?${params.toString()}`;
  }

  /* =========================
      PRICE FORMATTER
  ========================== */

  function formatPrice(property: Property) {
    const currency =
      property.currency?.toUpperCase() === "USD"
        ? "USD"
        : "TZS";

    const formatted = new Intl.NumberFormat(
      currency === "USD" ? "en-US" : "en-TZ"
    ).format(property.price);

    const currencySymbol =
      currency === "USD" ? "$" : "TSh";

    if (property.listing_type === "rent") {
      return `${currencySymbol} ${formatted} / ${
        property.rent_period || "month"
      }`;
    }

    return `${currencySymbol} ${formatted}`;
  }

  /* =========================
      PROPERTY DETAILS
  ========================== */

  function formatDetails(property: Property) {
    const details: string[] = [];

    if (property.bedrooms > 0) {
      details.push(
        `${property.bedrooms} ${
          property.bedrooms === 1 ? "bed" : "beds"
        }`
      );
    }

    if (property.bathrooms > 0) {
      details.push(
        `${property.bathrooms} ${
          property.bathrooms === 1 ? "bath" : "baths"
        }`
      );
    }

    if (property.area_sqm) {
      details.push(`${property.area_sqm} m²`);
    }

    return details.join(" · ");
  }

  return (
    <main className="min-h-screen bg-[#F5F3EE] text-[#171717]">

      {/* =========================
          HERO
      ========================== */}

      <section className="relative min-h-[720px] overflow-hidden">

        {/* Hero Image */}

        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/images/hero.jpg')",
          }}
        />

        {/* Dark Overlay */}

        <div className="absolute inset-0 bg-black/45" />

        {/* Navigation */}

        <Navbar />

        {/* Hero Content */}

        <div className="relative z-10 mx-auto flex min-h-[720px] max-w-7xl flex-col justify-center px-6 pt-20 lg:px-8">

          <div className="max-w-4xl">

            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-white/80">
              Tanzania&apos;s Property Marketplace
            </p>

            <h1 className="text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-white md:text-7xl lg:text-8xl">
              Find your
              <br />
              next place.
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/80">
              Discover homes, offices, commercial spaces and
              land across Tanzania.
            </p>

          </div>

          {/* =========================
              SEARCH BOX
          ========================== */}

          <div className="mt-12 max-w-5xl rounded-2xl bg-white p-3 shadow-2xl">

            <div className="grid gap-2 md:grid-cols-4">

              {/* LOOKING FOR */}

              <label className="rounded-xl px-5 py-4 transition hover:bg-gray-50">

                <span className="block text-xs font-medium text-gray-400">
                  Looking for
                </span>

                <select
                  value={searchListingType}
                  onChange={(e) =>
                    setSearchListingType(
                      e.target.value as "sale" | "rent"
                    )
                  }
                  className="mt-1 w-full cursor-pointer appearance-none bg-transparent font-semibold outline-none"
                >
                  <option value="sale">
                    Buy
                  </option>

                  <option value="rent">
                    Rent
                  </option>
                </select>

              </label>

              {/* PROPERTY TYPE */}

              <label className="rounded-xl px-5 py-4 transition hover:bg-gray-50">

                <span className="block text-xs font-medium text-gray-400">
                  Property type
                </span>

                <select
                  value={searchPropertyType}
                  onChange={(e) =>
                    setSearchPropertyType(e.target.value)
                  }
                  className="mt-1 w-full cursor-pointer appearance-none bg-transparent font-semibold outline-none"
                >
                  <option value="all">
                    Any property
                  </option>

                  <option value="apartment">
                    Apartment
                  </option>

                  <option value="house">
                    House
                  </option>

                  <option value="office">
                    Office
                  </option>

                  <option value="shop">
                    Shop
                  </option>

                  <option value="warehouse">
                    Warehouse
                  </option>

                  <option value="land">
                    Land
                  </option>

                  <option value="development">
                    Development
                  </option>
                </select>

              </label>

              {/* LOCATION */}

              <label className="rounded-xl px-5 py-4 transition hover:bg-gray-50">

                <span className="block text-xs font-medium text-gray-400">
                  Location
                </span>

                <select
                  value={searchLocation}
                  onChange={(e) =>
                    setSearchLocation(e.target.value)
                  }
                  className="mt-1 w-full cursor-pointer appearance-none bg-transparent font-semibold outline-none"
                >
                  <option value="all">
                    All locations
                  </option>

                  <option value="Dar es Salaam">
                    Dar es Salaam
                  </option>

                  <option value="Arusha">
                    Arusha
                  </option>

                  <option value="Dodoma">
                    Dodoma
                  </option>

                  <option value="Mwanza">
                    Mwanza
                  </option>
                </select>

              </label>

              {/* SEARCH BUTTON */}

              <button
                type="button"
                onClick={handleSearch}
                className="flex items-center justify-center rounded-xl bg-[#171717] px-6 py-4 text-center font-semibold text-white transition hover:bg-[#2a2a2a]"
              >
                Search properties
              </button>

            </div>

          </div>

        </div>

      </section>

      {/* =========================
          CATEGORIES
      ========================== */}

      <section className="px-6 py-24 lg:px-8">

        <div className="mx-auto max-w-7xl">

          <div className="max-w-2xl">

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              Explore
            </p>

            <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
              Property for every move.
            </h2>

            <p className="mt-5 text-lg leading-relaxed text-gray-500">
              From your next home to your next business location,
              discover spaces that fit your plans.
            </p>

          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">

            <Category
              icon="🏠"
              title="Residential"
              description="Houses, apartments and villas."
              href="/properties?type=house"
            />

            <Category
              icon="🏢"
              title="Commercial"
              description="Offices, shops and warehouses."
              href="/properties?type=office"
            />

            <Category
              icon="🌍"
              title="Land"
              description="Plots, farms and development land."
              href="/properties?type=land"
            />

            <Category
              icon="🏗️"
              title="Developments"
              description="Discover new property projects."
              href="/developments"
            />

          </div>

        </div>

      </section>

      {/* =========================
          FEATURED PROPERTIES
      ========================== */}

      <section className="px-6 pb-24 lg:px-8">

        <div className="mx-auto max-w-7xl">

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">

            <div>

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
                Featured
              </p>

              <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
                Properties worth seeing.
              </h2>

              <p className="mt-4 max-w-xl text-lg leading-relaxed text-gray-500">
                Explore some of the properties currently available
                through ZOYA.
              </p>

            </div>

            <Link
              href="/properties"
              className="w-fit text-sm font-semibold transition hover:opacity-60"
            >
              View all properties →
            </Link>

          </div>

          {/* Featured Properties */}

          <div className="mt-12">

            {/* Loading */}

            {loadingProperties && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-[420px] animate-pulse rounded-3xl bg-white"
                  />
                ))}

              </div>
            )}

            {/* Properties */}

            {!loadingProperties &&
              properties.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                  {properties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      id={property.id}
                      image={
                        property.image_url ||
                        "/images/property-1.jpg"
                      }
                      title={property.title}
                      location={`${property.location}, ${property.city}`}
                      price={formatPrice(property)}
                      details={formatDetails(property)}
                      verified={property.verified}
                    />
                  ))}

                </div>
              )}

            {/* Empty State */}

            {!loadingProperties &&
              properties.length === 0 && (
                <div className="rounded-3xl bg-white px-6 py-20 text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F3EE] text-2xl">
                    🏠
                  </div>

                  <h3 className="mt-6 text-2xl font-semibold">
                    Properties coming soon
                  </h3>

                  <p className="mx-auto mt-3 max-w-md text-gray-500">
                    We&apos;re currently adding properties to
                    ZOYA. Check back soon to discover available
                    homes, offices, land and commercial spaces.
                  </p>

                  <Link
                    href="/properties"
                    className="mt-7 inline-block rounded-full bg-[#171717] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2a2a]"
                  >
                    Browse properties
                  </Link>

                </div>
              )}

          </div>

        </div>

      </section>

      {/* =========================
          EXPLORE TANZANIA
      ========================== */}

      <section className="bg-[#171717] px-6 py-24 text-white lg:px-8">

        <div className="mx-auto max-w-7xl">

          <div className="max-w-2xl">

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
              Explore Tanzania
            </p>

            <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
              Find property where you&apos;re going.
            </h2>

            <p className="mt-5 text-lg leading-relaxed text-white/60">
              Explore homes, offices, land and developments across
              Tanzania&apos;s growing cities.
            </p>

          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {locations.map((location) => (
              <LocationCard
                key={location.name}
                {...location}
              />
            ))}

          </div>

        </div>

      </section>

      {/* =========================
          TRUST SECTION
      ========================== */}

      <section className="px-6 py-24 lg:px-8">

        <div className="mx-auto max-w-7xl">

          <div className="max-w-2xl">

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
              Why ZOYA
            </p>

            <h2 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
              Property discovery you can trust.
            </h2>

            <p className="mt-5 text-lg leading-relaxed text-gray-500">
              We&apos;re building a better way to discover property
              in Tanzania — with clearer information, verified
              listings and better connections between people and
              property professionals.
            </p>

          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">

            {/* Verified Listings */}

            <div className="rounded-3xl bg-white p-8">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F3EE] text-2xl">
                ✓
              </div>

              <h3 className="mt-8 text-xl font-semibold">
                Verified listings
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                We&apos;re building systems to help users identify
                listings that have been reviewed and verified.
              </p>

            </div>

            {/* Fresh Information */}

            <div className="rounded-3xl bg-white p-8">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F3EE] text-2xl">
                ◷
              </div>

              <h3 className="mt-8 text-xl font-semibold">
                Fresh information
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                See when property information was last confirmed
                so you can spend less time chasing outdated listings.
              </p>

            </div>

            {/* Verified Agents */}

            <div className="rounded-3xl bg-white p-8">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F3EE] text-2xl">
                👤
              </div>

              <h3 className="mt-8 text-xl font-semibold">
                Verified agents
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                Connect with property professionals and learn more
                about who is behind each listing.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* =========================
          FINAL CTA
      ========================== */}

      <section className="px-6 pb-24 lg:px-8">

        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#171717] px-8 py-16 text-center text-white md:px-16 md:py-20">

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
            List with ZOYA
          </p>

          <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
            Have a property to list?
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/60">
            Connect your property with people looking for their
            next home, office, commercial space or piece of land.
          </p>

          <Link
            href="/list-property"
            className="mt-8 inline-block rounded-full bg-white px-7 py-3.5 font-semibold text-[#171717] transition hover:bg-white/90"
          >
            List your property
          </Link>

        </div>

      </section>

    </main>
  );
}

/* =========================
    CATEGORY COMPONENT
========================== */

function Category({
  icon,
  title,
  description,
  href,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-3xl bg-white p-8 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F3EE] text-2xl">
        {icon}
      </div>

      <h3 className="mt-8 text-xl font-semibold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-relaxed text-gray-500">
        {description}
      </p>

      <div className="mt-8 text-sm font-semibold">
        Explore →
      </div>

    </Link>
  );
}