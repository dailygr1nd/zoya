import Link from "next/link";

export default function ListPropertySuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F3EE] px-6 text-[#171717]">

      <div className="max-w-xl text-center">

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
          ✓
        </div>

        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
          Submission received
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
          Your property is on its way.
        </h1>

        <p className="mt-5 text-lg leading-relaxed text-gray-500">
          Thanks for listing with ZOYA. Your property has been
          submitted for review and will appear on the marketplace
          once it has been approved.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

          <Link
            href="/properties"
            className="rounded-full bg-[#171717] px-6 py-3 font-semibold text-white transition hover:bg-[#2a2a2a]"
          >
            Browse properties
          </Link>

          <Link
            href="/"
            className="rounded-full border border-black/10 bg-white px-6 py-3 font-semibold transition hover:bg-gray-50"
          >
            Back home
          </Link>

        </div>

      </div>

    </main>
  );
}