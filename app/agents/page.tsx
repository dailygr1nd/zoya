"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Agent = {
  id: string;
  name: string;
  company: string | null;
  profile_image_url: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  location: string | null;
  bio: string | null;
  verified: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
};

const cities = [
  "All",
  "Dar es Salaam",
  "Arusha",
  "Dodoma",
  "Mwanza",
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All");

  /* =========================
      FETCH AGENTS
  ========================== */

  useEffect(() => {
    async function fetchAgents() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading agents:", error);
        setError("We couldn't load the agents.");
      } else {
        setAgents(data || []);
      }

      setLoading(false);
    }

    fetchAgents();
  }, []);

  /* =========================
      FILTER AGENTS
  ========================== */

  const filteredAgents = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return agents.filter((agent) => {
      const matchesSearch =
        searchTerm === "" ||
        agent.name?.toLowerCase().includes(searchTerm) ||
        agent.company?.toLowerCase().includes(searchTerm) ||
        agent.location?.toLowerCase().includes(searchTerm);

      const matchesCity =
        city === "All" ||
        agent.city?.toLowerCase() === city.toLowerCase();

      return matchesSearch && matchesCity;
    });
  }, [agents, search, city]);

  /* =========================
      RESET FILTERS
  ========================== */

  function resetFilters() {
    setSearch("");
    setCity("All");
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
              className="text-gray-500 transition hover:text-black"
            >
              Developments
            </Link>

            <Link
              href="/agents"
              className="text-black"
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
              Property Professionals
            </p>

            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em] md:text-7xl">
              Meet the people
              <br />
              behind the properties.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
              Connect with property agents and professionals
              helping people find their next home, investment,
              office or commercial space.
            </p>

          </div>

        </div>

      </section>

      {/* =========================
          SEARCH & FILTERS
      ========================== */}

      <section className="border-b border-black/5 bg-white px-6 py-8 lg:px-8">

        <div className="mx-auto max-w-7xl">

          <div className="flex flex-col gap-3 md:flex-row">

            {/* SEARCH */}

            <div className="relative flex-1">

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search agents or companies..."
                className="w-full rounded-xl border border-black/10 bg-[#F5F3EE] px-5 py-3.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-black"
              />

            </div>

            {/* CITY */}

            <select
              value={city}
              onChange={(e) =>
                setCity(e.target.value)
              }
              className="rounded-xl border border-black/10 bg-[#F5F3EE] px-5 py-3.5 text-sm outline-none transition focus:border-black"
            >

              {cities.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item === "All"
                    ? "All locations"
                    : item}
                </option>
              ))}

            </select>

            {(search !== "" || city !== "All") && (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl px-5 py-3 text-sm font-medium text-gray-500 transition hover:bg-[#F5F3EE] hover:text-black"
              >
                Reset
              </button>
            )}

          </div>

        </div>

      </section>

      {/* =========================
          AGENTS
      ========================== */}

      <section className="px-6 py-14 lg:px-8">

        <div className="mx-auto max-w-7xl">

          {/* HEADER */}

          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">

            <div>

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
                Agents
              </p>

              {!loading && !error && (
                <p className="mt-2 text-sm text-gray-500">
                  {filteredAgents.length}{" "}
                  {filteredAgents.length === 1
                    ? "agent"
                    : "agents"}{" "}
                  available
                </p>
              )}

            </div>

            <div className="rounded-full bg-white px-4 py-2 text-xs font-medium text-gray-500">
              ✓ Verified professionals
            </div>

          </div>

          {/* =========================
              LOADING
          ========================== */}

          {loading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="overflow-hidden rounded-3xl bg-white"
                >

                  <div className="h-72 animate-pulse bg-gray-200" />

                  <div className="space-y-3 p-7">

                    <div className="h-5 w-1/2 animate-pulse rounded bg-gray-200" />

                    <div className="h-4 w-1/3 animate-pulse rounded bg-gray-200" />

                    <div className="h-4 w-full animate-pulse rounded bg-gray-200" />

                    <div className="h-4 w-4/5 animate-pulse rounded bg-gray-200" />

                  </div>

                </div>
              ))}

            </div>
          )}

          {/* =========================
              ERROR
          ========================== */}

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
                onClick={() =>
                  window.location.reload()
                }
                className="mt-7 rounded-full bg-[#171717] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2a2a]"
              >
                Try again
              </button>

            </div>
          )}

          {/* =========================
              AGENT GRID
          ========================== */}

          {!loading &&
            !error &&
            filteredAgents.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                {filteredAgents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                  />
                ))}

              </div>
            )}

          {/* =========================
              EMPTY STATE
          ========================== */}

          {!loading &&
            !error &&
            filteredAgents.length === 0 && (
              <div className="rounded-3xl bg-white px-6 py-24 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F3EE] text-2xl">
                  👤
                </div>

                <h2 className="mt-6 text-2xl font-semibold">
                  No agents found
                </h2>

                <p className="mx-auto mt-3 max-w-md text-gray-500">

                  {agents.length === 0
                    ? "There are currently no agents listed on ZOYA. Check back soon as we add property professionals to the marketplace."
                    : "We couldn't find any agents matching your search. Try changing your search or location."}

                </p>

                {agents.length > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-7 rounded-full bg-[#171717] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2a2a2a]"
                  >
                    Clear filters
                  </button>
                )}

              </div>
            )}

        </div>

      </section>

      {/* =========================
          AGENT CTA
      ========================== */}

      <section className="px-6 pb-24 lg:px-8">

        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#171717] px-8 py-16 text-white md:px-16 md:py-20">

          <div className="max-w-3xl">

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/40">
              For property professionals
            </p>

            <h2 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
              Are you a property agent?
            </h2>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/60">
              Build your presence on ZOYA and connect with
              people actively searching for property across
              Tanzania.
            </p>

            <Link
              href="/list-property"
              className="mt-8 inline-block rounded-full bg-white px-7 py-3.5 font-semibold text-[#171717] transition hover:bg-white/90"
            >
              List a property
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}

/* =========================
    AGENT CARD
========================== */

function AgentCard({
  agent,
}: {
  agent: Agent;
}) {
  return (
    <div className="group overflow-hidden rounded-3xl bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl">

      {/* PROFILE IMAGE */}

      <div className="relative h-72 overflow-hidden bg-[#E8E5DE]">

        {agent.profile_image_url ? (
          <img
            src={agent.profile_image_url}
            alt={agent.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-7xl">
            👤
          </div>
        )}

        {/* VERIFIED BADGE */}

        {agent.verified && (
          <div className="absolute left-5 top-5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-sm">
            ✓ Verified
          </div>
        )}

      </div>

      {/* CONTENT */}

      <div className="p-7">

        <div className="flex items-start justify-between gap-4">

          <div>

            <h3 className="text-xl font-semibold">
              {agent.name}
            </h3>

            {agent.company && (
              <p className="mt-1 text-sm font-medium text-gray-500">
                {agent.company}
              </p>
            )}

          </div>

        </div>

        {/* LOCATION */}

        {(agent.city || agent.location) && (
          <p className="mt-4 text-sm text-gray-500">
            📍{" "}
            {agent.location
              ? `${agent.location}${
                  agent.city
                    ? `, ${agent.city}`
                    : ""
                }`
              : agent.city}
          </p>
        )}

        {/* BIO */}

        {agent.bio && (
          <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-gray-500">
            {agent.bio}
          </p>
        )}

        {/* CONTACT */}

        <div className="mt-6 flex gap-2">

          {agent.phone && (
            <a
              href={`tel:${agent.phone}`}
              className="flex-1 rounded-xl border border-black/10 px-4 py-3 text-center text-sm font-semibold transition hover:bg-[#F5F3EE]"
            >
              Call
            </a>
          )}

          {agent.email && (
            <a
              href={`mailto:${agent.email}`}
              className="flex-1 rounded-xl bg-[#171717] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#2a2a2a]"
            >
              Email
            </a>
          )}

        </div>

      </div>

    </div>
  );
}