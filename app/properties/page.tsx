"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PropertyCard from "../components/PropertyCard";
import { supabase } from "../../lib/supabase";

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
  property_type:
    | "apartment"
    | "house"
    | "office"
    | "shop"
    | "warehouse"
    | "land"
    | "development";
  bedrooms: number;
  bathrooms: number;
  area_sqm: number | null;
  verified: boolean;
};

const propertyTypes = [
  "Apartment",
  "House",
  "Office",
  "Shop",
  "Warehouse",
  "Land",
  "Development",
];

const locations = [
  "Dar es Salaam",
  "Arusha",
  "Dodoma",
  "Mwanza",
];

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================
      FILTER STATE
  ========================== */

  const [listingType, setListingType] = useState("All");
  const [propertyType, setPropertyType] = useState("All");
  const [location, setLocation] = useState("All");
  const [bedrooms, setBedrooms] = useState("Any");
  const [maxPrice, setMaxPrice] = useState("Any");

  /* =========================
      READ URL FILTERS
  ========================== */

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const listing = params.get("listing");
    const type = params.get("type");
    const searchLocation = params.get("location");
    const searchBedrooms = params.get("bedrooms");
    const searchMaxPrice = params.get("maxPrice");

    if (listing === "sale") {
      setListingType("Buy");
    }

    if (listing === "rent") {
      setListingType("Rent");
    }

    if (
      type &&
      propertyTypes.some(
        (item) => item.toLowerCase() === type.toLowerCase()
      )
    ) {
      const matchingType = propertyTypes.find(
        (item) => item.toLowerCase() === type.toLowerCase()
      );

      if (matchingType) {
        setPropertyType(matchingType);
      }
    }

    if (
      searchLocation &&
      locations.some(
        (item) => item.toLowerCase() === searchLocation.toLowerCase()
      )
    ) {
      const matchingLocation = locations.find(
        (item) => item.toLowerCase() === searchLocation.toLowerCase()
      );

      if (matchingLocation) {
        setLocation(matchingLocation);
      }
    }

    if (
      searchBedrooms &&
      ["1", "2", "3", "4"].includes(searchBedrooms)
    ) {
      setBedrooms(searchBedrooms);
    }

    if (
      searchMaxPrice &&
      [
        "2000000",
        "5000000",
        "500000000",
        "1000000000",
      ].includes(searchMaxPrice)
    ) {
      setMaxPrice(searchMaxPrice);
    }
  }, []);

  /* =========================
      FETCH PROPERTIES
  ========================== */

  useEffect(() => {
    async function fetchProperties() {
      setLoading(true);

      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading properties:", error);
        setError("We couldn't load the properties.");
      } else {
        setProperties(data || []);
      }

      setLoading(false);
    }

    fetchProperties();
  }, []);

  /* =========================
      FILTER PROPERTIES
  ========================== */

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesListingType =
        listingType === "All" ||
        property.listing_type === listingType.toLowerCase();

      const matchesPropertyType =
        propertyType === "All" ||
        property.property_type === propertyType.toLowerCase();

      const matchesLocation =
        location === "All" ||
        property.city?.toLowerCase() === location.toLowerCase();

      const matchesBedrooms =
        bedrooms === "Any" ||
        property.bedrooms >= Number(bedrooms);

      /*
       * IMPORTANT:
       *
       * Price filtering is performed against the property's
       * actual stored currency.
       *
       * The filter values below are currently TSh thresholds.
       * USD properties are therefore excluded from the TSh
       * price filter rather than being incorrectly compared
       * against TSh amounts.
       */

      const matchesPrice =
        maxPrice === "Any" ||
        property.currency?.toUpperCase() !== "USD"
          ? maxPrice === "Any" ||
            property.price <= Number(maxPrice)
          : true;

      return (
        matchesListingType &&
        matchesPropertyType &&
        matchesLocation &&
        matchesBedrooms &&
        matchesPrice
      );
    });
  }, [
    properties,
    listingType,
    propertyType,
    location,
    bedrooms,
    maxPrice,
  ]);

  /* =========================
      UPDATE URL
  ========================== */

  function updateUrl(
    newListingType = listingType,
    newPropertyType = propertyType,
    newLocation = location,
    newBedrooms = bedrooms,
    newMaxPrice = maxPrice
  ) {
    const params = new URLSearchParams();

    if (newListingType !== "All") {
      params.set(
        "listing",
        newListingType.toLowerCase()
      );
    }

    if (newPropertyType !== "All") {
      params.set(
        "type",
        newPropertyType.toLowerCase()
      );
    }

    if (newLocation !== "All") {
      params.set("location", newLocation);
    }

    if (newBedrooms !== "Any") {
      params.set("bedrooms", newBedrooms);
    }

    if (newMaxPrice !== "Any") {
      params.set("maxPrice", newMaxPrice);
    }

    const queryString = params.toString();

    window.history.replaceState(
      {},
      "",
      queryString
        ? `/properties?${queryString}`
        : "/properties"
    );
  }

  /* =========================
      FILTER HANDLERS
  ========================== */

  function handleListingTypeChange(value: string) {
    setListingType(value);

    updateUrl(
      value,
      propertyType,
      location,
      bedrooms,
      maxPrice
    );
  }

  function handlePropertyTypeChange(value: string) {
    setPropertyType(value);

    updateUrl(
      listingType,
      value,
      location,
      bedrooms,
      maxPrice
    );
  }

  function handleLocationChange(value: string) {
    setLocation(value);

    updateUrl(
      listingType,
      propertyType,
      value,
      bedrooms,
      maxPrice
    );
  }

  function handleBedroomsChange(value: string) {
    setBedrooms(value);

    updateUrl(
      listingType,
      propertyType,
      location,
      value,
      maxPrice
    );
  }

  function handleMaxPriceChange(value: string) {
    setMaxPrice(value);

    updateUrl(
      listingType,
      propertyType,
      location,
      bedrooms,
      value
    );
  }

  /* =========================
      RESET FILTERS
  ========================== */

  function resetFilters() {
    setListingType("All");
    setPropertyType("All");
    setLocation("All");
    setBedrooms("Any");
    setMaxPrice("Any");

    window.history.replaceState(
      {},
      "",
      "/properties"
    );
  }

  /* =========================
      PRICE FORMATTER
  ========================== */

  function formatPrice(property: Property) {
    const isUSD =
      property.currency?.toUpperCase() === "USD";

    const formatted = new Intl.NumberFormat(
      isUSD ? "en-US" : "en-TZ"
    ).format(property.price);

    const currencySymbol = isUSD ? "$" : "TSh";

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
              className="text-black"
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
          HEADER
      ========================== */}

      <section className="border-b border-black/5 bg-white px-6 py-10 lg:px-8">

        <div className="mx-auto max-w-7xl">

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            Property Search
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Find your next place.
          </h1>

          <p className="mt-4 max-w-2xl text-gray-500">
            Browse homes, offices, commercial spaces, land and
            developments available through ZOYA.
          </p>

        </div>

      </section>

      {/* =========================
          FILTERS
      ========================== */}

      <section className="border-b border-black/5 bg-white px-6 pb-8 lg:px-8">

        <div className="mx-auto max-w-7xl">

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">

            {/* LISTING TYPE */}

            <select
              value={listingType}
              onChange={(e) =>
                handleListingTypeChange(e.target.value)
              }
              className="rounded-xl border border-black/10 bg-[#F5F3EE] px-4 py-3 text-sm outline-none transition focus:border-black"
            >
              <option value="All">
                Buy or Rent
              </option>

              <option value="Buy">
                Buy
              </option>

              <option value="Rent">
                Rent
              </option>
            </select>

            {/* PROPERTY TYPE */}

            <select
              value={propertyType}
              onChange={(e) =>
                handlePropertyTypeChange(e.target.value)
              }
              className="rounded-xl border border-black/10 bg-[#F5F3EE] px-4 py-3 text-sm outline-none transition focus:border-black"
            >
              <option value="All">
                Any property type
              </option>

              {propertyTypes.map((type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              ))}

            </select>

            {/* LOCATION */}

            <select
              value={location}
              onChange={(e) =>
                handleLocationChange(e.target.value)
              }
              className="rounded-xl border border-black/10 bg-[#F5F3EE] px-4 py-3 text-sm outline-none transition focus:border-black"
            >
              <option value="All">
                All locations
              </option>

              {locations.map((city) => (
                <option
                  key={city}
                  value={city}
                >
                  {city}
                </option>
              ))}

            </select>

            {/* BEDROOMS */}

            <select
              value={bedrooms}
              onChange={(e) =>
                handleBedroomsChange(e.target.value)
              }
              className="rounded-xl border border-black/10 bg-[#F5F3EE] px-4 py-3 text-sm outline-none transition focus:border-black"
            >
              <option value="Any">
                Any bedrooms
              </option>

              <option value="1">
                1+ bedroom
              </option>

              <option value="2">
                2+ bedrooms
              </option>

              <option value="3">
                3+ bedrooms
              </option>

              <option value="4">
                4+ bedrooms
              </option>

            </select>

            {/* PRICE */}

            <select
              value={maxPrice}
              onChange={(e) =>
                handleMaxPriceChange(e.target.value)
              }
              className="rounded-xl border border-black/10 bg-[#F5F3EE] px-4 py-3 text-sm outline-none transition focus:border-black"
            >
              <option value="Any">
                Any price
              </option>

              <option value="2000000">
                Under TSh 2M
              </option>

              <option value="5000000">
                Under TSh 5M
              </option>

              <option value="500000000">
                Under TSh 500M
              </option>

              <option value="1000000000">
                Under TSh 1B
              </option>

            </select>

          </div>

          {/* =========================
              ACTIVE FILTERS
          ========================== */}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">

            <div className="flex flex-wrap gap-2">

              {listingType !== "All" && (
                <span className="rounded-full bg-[#F5F3EE] px-3 py-1.5 text-xs font-medium">
                  {listingType}
                </span>
              )}

              {propertyType !== "All" && (
                <span className="rounded-full bg-[#F5F3EE] px-3 py-1.5 text-xs font-medium">
                  {propertyType}
                </span>
              )}

              {location !== "All" && (
                <span className="rounded-full bg-[#F5F3EE] px-3 py-1.5 text-xs font-medium">
                  {location}
                </span>
              )}

              {bedrooms !== "Any" && (
                <span className="rounded-full bg-[#F5F3EE] px-3 py-1.5 text-xs font-medium">
                  {bedrooms}+ bedrooms
                </span>
              )}

              {maxPrice !== "Any" && (
                <span className="rounded-full bg-[#F5F3EE] px-3 py-1.5 text-xs font-medium">
                  Under TSh{" "}
                  {Number(maxPrice).toLocaleString("en-TZ")}
                </span>
              )}

            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-medium text-gray-500 transition hover:text-black"
            >
              Reset filters
            </button>

          </div>

        </div>

      </section>

      {/* =========================
          RESULTS
      ========================== */}

      <section className="px-6 py-12 lg:px-8">

        <div className="mx-auto max-w-7xl">

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

            <div>

              <h2 className="text-2xl font-semibold">
                Properties
              </h2>

              {!loading && (
                <p className="mt-1 text-sm text-gray-500">
                  {filteredProperties.length}{" "}
                  {filteredProperties.length === 1
                    ? "property"
                    : "properties"}{" "}
                  found
                </p>
              )}

            </div>

            <div className="rounded-xl bg-white px-5 py-3 text-sm text-gray-500">
              ✓ Verified properties
            </div>

          </div>

          {/* =========================
              LOADING
          ========================== */}

          {loading && (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-[420px] animate-pulse rounded-3xl bg-white"
                />
              ))}

            </div>
          )}

          {/* =========================
              ERROR
          ========================== */}

          {!loading && error && (
            <div className="mt-10 rounded-3xl bg-white px-6 py-20 text-center">

              <h3 className="text-2xl font-semibold">
                Something went wrong
              </h3>

              <p className="mt-3 text-gray-500">
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

          {/* =========================
              RESULTS
          ========================== */}

          {!loading &&
            !error &&
            filteredProperties.length > 0 && (
              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                {filteredProperties.map((property) => (
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

          {/* =========================
              EMPTY STATE
          ========================== */}

          {!loading &&
            !error &&
            filteredProperties.length === 0 && (
              <div className="mt-10 rounded-3xl bg-white px-6 py-20 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F3EE] text-2xl">
                  🔎
                </div>

                <h3 className="mt-6 text-2xl font-semibold">
                  No properties found
                </h3>

                <p className="mx-auto mt-3 max-w-md text-gray-500">
                  We couldn&apos;t find properties matching your
                  current search. Try changing your filters.
                </p>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-7 rounded-full bg-[#171717] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2a2a]"
                >
                  Clear filters
                </button>

              </div>
            )}

        </div>

      </section>

    </main>
  );
}