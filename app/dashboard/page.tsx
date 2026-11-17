"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

type Agent = {
  id: string;
  user_id: string;
  name: string;
  company: string | null;
  city: string | null;
  verified: boolean;
};

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [agent, setAgent] = useState<Agent | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const displayName = typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name.slice(0, 120) : "Property owner";
      const { error: profileError } = await supabase.rpc("ensure_agent", { p_name: displayName || "Property owner" });
      if (profileError) {
        setLoading(false);
        setProfileError("Could not load your profile. Please try again later.");
        return;
      }
      const { data } = await supabase
        .from("agents")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!data) {
        router.push("/signup");
        return;
      }

      setAgent(data);
      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (profileError) return <main className="p-10" role="alert">{profileError}</main>;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#F5F3EE]">
        <p className="text-gray-500">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F3EE]">

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>
            <h1 className="text-2xl font-bold">ZOYA Dashboard</h1>
            <p className="text-sm text-gray-500">
              Welcome back, {agent?.name}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl bg-black px-5 py-2 text-white"
          >
            Logout
          </button>

        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">

        <div className="grid gap-6 md:grid-cols-3">

          <StatCard
            title="Listings"
            value="0"
          />

          <StatCard
            title="Pending"
            value="0"
          />

          <StatCard
            title="Approved"
            value="0"
          />

        </div>

        <div className="mt-10 rounded-3xl bg-white p-8">

          <h2 className="text-2xl font-semibold">
            Quick Actions
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            <Link
              href="/list-property"
              className="rounded-2xl border p-6 transition hover:bg-[#F5F3EE]"
            >
              <h3 className="font-semibold">
                ➕ Add Property
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Submit a new listing.
              </p>
            </Link>

            <Link
              href="/properties"
              className="rounded-2xl border p-6 transition hover:bg-[#F5F3EE]"
            >
              <h3 className="font-semibold">
                🏠 Browse Properties
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                View the marketplace.
              </p>
            </Link>

          </div>

        </div>

        <div className="mt-10 rounded-3xl bg-white p-8">

          <h2 className="text-2xl font-semibold">
            Agent Profile
          </h2>

          <div className="mt-6 space-y-3">

            <p>
              <strong>Name:</strong> {agent?.name}
            </p>

            <p>
              <strong>Company:</strong>{" "}
              {agent?.company || "Not provided"}
            </p>

            <p>
              <strong>City:</strong>{" "}
              {agent?.city || "Not provided"}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {agent?.verified ? "✅ Verified" : "⏳ Pending Verification"}
            </p>

          </div>

        </div>

      </section>

    </main>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-8">
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <h3 className="mt-3 text-4xl font-bold">
        {value}
      </h3>
    </div>
  );
}
