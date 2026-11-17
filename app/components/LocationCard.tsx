type LocationCardProps = {
  image: string;
  name: string;
  propertyCount: string;
};

export default function LocationCard({
  image,
  name,
  propertyCount,
}: LocationCardProps) {
  return (
    <div className="group relative aspect-[4/5] overflow-hidden rounded-3xl">
      
      {/* Image */}
      <img
        src={image}
        alt={name}
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
      />

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">

        <p className="text-sm text-white/70">
          {propertyCount}
        </p>

        <h3 className="mt-1 text-2xl font-semibold">
          {name}
        </h3>

        <p className="mt-3 text-sm font-medium opacity-0 transition duration-300 group-hover:opacity-100">
          Explore properties →
        </p>

      </div>

    </div>
  );
}