import Link from "next/link";

type PropertyCardProps = {
  id?: string;
  image: string;
  title: string;
  location: string;
  price: string;
  details: string;
  verified?: boolean;
};

export default function PropertyCard({
  id,
  image,
  title,
  location,
  price,
  details,
  verified,
}: PropertyCardProps) {
  const cardContent = (
    <div className="group overflow-hidden rounded-3xl bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-[280px] w-full object-cover transition duration-500 group-hover:scale-105"
        />

        {/* Verified badge */}
        {verified && (
          <div className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow-md">
            ✓ Verified
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-sm text-gray-500">
          {location}
        </p>

        <h3 className="mt-2 text-xl font-semibold tracking-tight">
          {title}
        </h3>

        <p className="mt-4 text-lg font-semibold">
          {price}
        </p>

        <p className="mt-2 text-sm text-gray-500">
          {details}
        </p>

        <div className="mt-6 text-sm font-semibold">
          View property →
        </div>
      </div>
    </div>
  );

  // If an ID exists, make the entire card clickable.
  if (id) {
    return (
      <Link
        href={`/properties/${id}`}
        className="block"
      >
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
