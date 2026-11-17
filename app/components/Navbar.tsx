import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="absolute left-0 right-0 top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">

        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold tracking-[-0.04em] text-white transition-opacity hover:opacity-80"
        >
          ZOYA
        </Link>

        {/* Navigation */}
        <div className="hidden items-center gap-8 text-sm font-medium text-white/80 md:flex">

          <Link
            href="/properties"
            className="transition hover:text-white"
          >
            Properties
          </Link>

          <Link
            href="/developments"
            className="transition hover:text-white"
          >
            Developments
          </Link>

          <Link
            href="/agents"
            className="transition hover:text-white"
          >
            Agents
          </Link>

          <Link
            href="/locations"
            className="transition hover:text-white"
          >
            Locations
          </Link>

        </div>

        {/* CTA */}
        <Link
          href="/list-property"
          className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#171717] transition hover:bg-white/90"
        >
          List Property
        </Link>

      </div>
    </nav>
  );
}