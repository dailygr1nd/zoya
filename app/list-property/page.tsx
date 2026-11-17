"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "../../lib/api-client";
import { parseListing } from "../../lib/validation";
import { supabase } from "../../lib/supabase";

export default function ListPropertyPage() {
  const router = useRouter();
  const submissionId = useRef<string | null>(null);
  const uploadedFiles = useRef(new Map<File, string>());

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [listingType, setListingType] = useState("sale");
  const [propertyType, setPropertyType] = useState("apartment");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("TZS");
  const [rentPeriod, setRentPeriod] = useState("month");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("Dar es Salaam");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [areaSqm, setAreaSqm] = useState("");

  const [agentName, setAgentName] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [agentWhatsapp, setAgentWhatsapp] = useState("");

  const [images, setImages] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [error, setError] = useState("");

  function handleImagesChange(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);

    const combinedFiles = [...images, ...selectedFiles].slice(0, 10);

    setImages(combinedFiles);

    const previews = combinedFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setImagePreviews(previews);
  }

  function removeImage(index: number) {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    setImages(newImages);
    setImagePreviews(newPreviews);
  }

  function handleVideoChange(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0]) return;

    setVideo(e.target.files[0]);
  }

  async function uploadMedia(file: File, ownerId: string, videoFile = false) {
    const cached = uploadedFiles.current.get(file);
    if (cached) return cached;
    const types: Record<string, string> = videoFile
      ? { "video/mp4": "mp4", "video/webm": "webm" }
      : { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
    const extension = types[file.type];
    const limit = videoFile ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (!extension || file.size <= 0 || file.size > limit) throw new Error(videoFile
      ? "Use an MP4 or WebM video up to 50 MB."
      : "Use JPEG, PNG or WebP images up to 10 MB each.");
    const bucket = videoFile ? "property-videos" : "property-images";
    const path = `${ownerId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error("Media upload failed. Check your session and file limits.");
    const url = `/api/media/${bucket}/${path}`;
    uploadedFiles.current.set(file, url);
    return url;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Sign in before submitting a property.");
      submissionId.current ||= crypto.randomUUID();
      if (!title.trim()) {
        throw new Error("Please enter a property title.");
      }

      if (!price) {
        throw new Error("Please enter a property price.");
      }

      if (!location.trim()) {
        throw new Error("Please enter the property location.");
      }

      if (!agentName.trim()) {
        throw new Error("Please enter the agent or owner name.");
      }

      if (!agentPhone.trim()) {
        throw new Error("Please enter a phone number.");
      }

      if (!agentWhatsapp.trim()) {
        throw new Error("Please enter a WhatsApp number.");
      }

      if (images.length === 0) {
        throw new Error("Please upload at least one property image.");
      }

      // =========================
      // UPLOAD IMAGES
      // =========================

      setUploadProgress("Uploading property images...");

      const uploadedImages: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const imageUrl = await uploadMedia(images[i], user.id);

        uploadedImages.push(imageUrl);
      }

      // =========================
      // UPLOAD VIDEO
      // =========================

      let videoUrl: string | null = null;

      if (video) {
        setUploadProgress("Uploading property video...");

        videoUrl = await uploadMedia(video, user.id, true);
      }

      // =========================
      // SAVE PROPERTY
      // =========================

      setUploadProgress("Submitting property...");

      await apiRequest("/api/properties", "POST", parseListing({
          submission_id: submissionId.current,
          title: title.trim(),
          description: description.trim() || null,

          listing_type: listingType,
          property_type: propertyType,

          price: Number(price),
          currency,

          rent_period:
            listingType === "rent" ? rentPeriod : null,

          location: location.trim(),
          city,

          bedrooms: Number(bedrooms) || 0,
          bathrooms: Number(bathrooms) || 0,
          area_sqm: Number(areaSqm) || null,

          // =========================
          // AGENT CONTACT INFORMATION
          // =========================

          agent_name: agentName.trim(),
          agent_phone: agentPhone.trim(),
          agent_whatsapp: agentWhatsapp.trim(),

          // =========================
          // PROPERTY STATUS
          // =========================



          // =========================
          // MEDIA
          // =========================

          image_urls: uploadedImages,

          video_url: videoUrl,
        }, user.id));

      // =========================
      // SUCCESS
      // =========================

      setUploadProgress("");

      router.push("/list-property/success");
    } catch (err) {


      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong while submitting the property.");
      }

      setSubmitting(false);
      setUploadProgress("");
    }
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

          <Link
            href="/properties"
            className="text-sm font-medium text-gray-500 transition hover:text-black"
          >
            Browse properties
          </Link>

        </div>

      </nav>

      {/* =========================
          HEADER
      ========================== */}

      <section className="border-b border-black/5 bg-white px-6 py-12 lg:px-8">

        <div className="mx-auto max-w-4xl">

          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">
            List with ZOYA
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            List your property.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-gray-500">
            Add your property to ZOYA and connect it with people
            looking for their next home, office, commercial space or
            piece of land.
          </p>

        </div>

      </section>

      {/* =========================
          FORM
      ========================== */}

      <section className="px-6 py-12 lg:px-8">

        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-4xl space-y-8"
        >

          {/* =========================
              BASIC INFORMATION
          ========================== */}

          <div className="rounded-3xl bg-white p-6 md:p-8">

            <div className="mb-8">

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Step 1
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Property information
              </h2>

            </div>

            <div className="space-y-6">

              <div>

                <label className="text-sm font-semibold">
                  Property title
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Modern 3 Bedroom Apartment"
                  className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F3EE] px-4 py-3 outline-none transition focus:border-black"
                  required
                />

              </div>

              <div>

                <label className="text-sm font-semibold">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell people about this property..."
                  rows={6}
                  className="mt-2 w-full resize-none rounded-xl border border-black/10 bg-[#F5F3EE] px-4 py-3 outline-none transition focus:border-black"
                />

              </div>

              <div className="grid gap-5 md:grid-cols-2">

                <div>

                  <label className="text-sm font-semibold">
                    Listing type
                  </label>

                  <select
                    value={listingType}
                    onChange={(e) =>
                      setListingType(e.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F3EE] px-4 py-3 outline-none focus:border-black"
                  >

                    <option value="sale">
                      For Sale
                    </option>

                    <option value="rent">
                      For Rent
                    </option>

                  </select>

                </div>

                <div>

                  <label className="text-sm font-semibold">
                    Property type
                  </label>

                  <select
                    value={propertyType}
                    onChange={(e) =>
                      setPropertyType(e.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F3EE] px-4 py-3 outline-none focus:border-black"
                  >

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

                </div>

              </div>

            </div>

          </div>

          {/* =========================
              PRICE
          ========================== */}

          <div className="rounded-3xl bg-white p-6 md:p-8">

            <div className="mb-8">

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Step 2
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Pricing
              </h2>

            </div>

            <div className="grid gap-5 md:grid-cols-2">

              <div>

                <label className="text-sm font-semibold">
                  Price
                </label>

                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 1800000"
                  className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F3EE] px-4 py-3 outline-none focus:border-black"
                  required
                />

              </div>

              <div>

                <label className="text-sm font-semibold">
                  Currency
                </label>

                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F3EE] px-4 py-3 outline-none focus:border-black"
                >

                  <option value="TZS">
                    Tanzanian Shilling (TZS)
                  </option>

                  <option value="USD">
                    US Dollar (USD)
                  </option>

                </select>

              </div>

            </div>

            {listingType === "rent" && (

              <div className="mt-5">

                <label className="text-sm font-semibold">
                  Rent period
                </label>

                <select
                  value={rentPeriod}
                  onChange={(e) =>
                    setRentPeriod(e.target.value)
                  }
                  className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F3EE] px-4 py-3 outline-none focus:border-black"
                >

                  <option value="month">
                    Per month
                  </option>

                  <option value="week">
                    Per week
                  </option>

                  <option value="day">
                    Per day
                  </option>

                  <option value="year">
                    Per year
                  </option>

                </select>

              </div>

            )}

          </div>

          {/* =========================
              LOCATION
          ========================== */}

          <div className="rounded-3xl bg-white p-6 md:p-8">

            <div className="mb-8">

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Step 3
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Location
              </h2>

            </div>

            <div className="grid gap-5 md:grid-cols-2">

              <div>

                <label className="text-sm font-semibold">
                  Area / location
                </label>

                <input
                  type="text"
                  value={location}
                  onChange={(e) =>
                    setLocation(e.target.value)
                  }
                  placeholder="e.g. Mikocheni"
                  className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F3EE] px-4 py-3 outline-none focus:border-black"
                  required
                />

              </div>

              <div>

                <label className="text-sm font-semibold">
                  City
                </label>

                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F3EE] px-4 py-3 outline-none focus:border-black"
                >

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

                  <option value="Zanzibar">
                    Zanzibar
                  </option>

                  <option value="Mbeya">
                    Mbeya
                  </option>

                  <option value="Tanga">
                    Tanga
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>

            </div>

          </div>

          {/* =========================
              DETAILS
          ========================== */}

          <div className="rounded-3xl bg-white p-6 md:p-8">

            <div className="mb-8">

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Step 4
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Property details
              </h2>

            </div>

            <div className="grid gap-5 sm:grid-cols-3">

              <div>

                <label className="text-sm font-semibold">
                  Bedrooms
                </label>

                <input
                  type="number"
                  min="0"
                  value={bedrooms}
                  onChange={(e) =>
                    setBedrooms(e.target.value)
                  }
                  placeholder="3"
                  className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F3EE] px-4 py-3 outline-none focus:border-black"
                />

              </div>

              <div>

                <label className="text-sm font-semibold">
                  Bathrooms
                </label>

                <input
                  type="number"
                  min="0"
                  value={bathrooms}
                  onChange={(e) =>
                    setBathrooms(e.target.value)
                  }
                  placeholder="2"
                  className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F3EE] px-4 py-3 outline-none focus:border-black"
                />

              </div>

              <div>

                <label className="text-sm font-semibold">
                  Area (m²)
                </label>

                <input
                  type="number"
                  min="0"
                  value={areaSqm}
                  onChange={(e) =>
                    setAreaSqm(e.target.value)
                  }
                  placeholder="180"
                  className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F3EE] px-4 py-3 outline-none focus:border-black"
                />

              </div>

            </div>

          </div>

          {/* =========================
              CONTACT INFORMATION
          ========================== */}

          <div className="rounded-3xl bg-white p-6 md:p-8">

            <div className="mb-8">

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Step 5
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Contact information
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                This information will be used by potential buyers or
                renters to contact the person responsible for this
                property.
              </p>

            </div>

            <div className="space-y-5">

              {/* Agent Name */}

              <div>

                <label className="text-sm font-semibold">
                  Agent / Owner name
                </label>

                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F3EE] px-4 py-3 outline-none transition focus:border-black"
                  required
                />

              </div>

              {/* Phone */}

              <div>

                <label className="text-sm font-semibold">
                  Phone number
                </label>

                <input
                  type="tel"
                  value={agentPhone}
                  onChange={(e) => setAgentPhone(e.target.value)}
                  placeholder="e.g. +255 712 345 678"
                  className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F3EE] px-4 py-3 outline-none transition focus:border-black"
                  required
                />

              </div>

              {/* WhatsApp */}

              <div>

                <label className="text-sm font-semibold">
                  WhatsApp number
                </label>

                <input
                  type="tel"
                  value={agentWhatsapp}
                  onChange={(e) =>
                    setAgentWhatsapp(e.target.value)
                  }
                  placeholder="e.g. +255 712 345 678"
                  className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F3EE] px-4 py-3 outline-none transition focus:border-black"
                  required
                />

                <p className="mt-2 text-xs text-gray-400">
                  Include the country code, e.g. +255.
                </p>

              </div>

            </div>

          </div>

          {/* =========================
              IMAGES
          ========================== */}

          <div className="rounded-3xl bg-white p-6 md:p-8">

            <div className="mb-8">

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Step 6
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Property photos
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Upload up to 10 photos. The first photo will be
                used as the main property image.
              </p>

            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black/10 bg-[#F5F3EE] px-6 py-12 text-center transition hover:border-black/30">

              <div className="text-4xl">
                📸
              </div>

              <p className="mt-4 font-semibold">
                Add property photos
              </p>

              <p className="mt-2 text-sm text-gray-500">
                PNG, JPG or WEBP
              </p>

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={handleImagesChange}
                className="hidden"
              />

            </label>

            {imagePreviews.length > 0 && (

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">

                {imagePreviews.map((preview, index) => (

                  <div
                    key={preview}
                    className="group relative aspect-square overflow-hidden rounded-2xl"
                  >

                    <img
                      src={preview}
                      alt={`Property preview ${index + 1}`}
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      ×
                    </button>

                    {index === 0 && (

                      <div className="absolute bottom-2 left-2 rounded-full bg-white px-3 py-1 text-xs font-semibold">
                        Main image
                      </div>

                    )}

                  </div>

                ))}

              </div>

            )}

          </div>

          {/* =========================
              VIDEO
          ========================== */}

          <div className="rounded-3xl bg-white p-6 md:p-8">

            <div className="mb-8">

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                Step 7
              </p>

              <h2 className="mt-2 text-2xl font-semibold">
                Property video
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Optional. Add a video walkthrough of the property.
              </p>

            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-black/10 bg-[#F5F3EE] p-5 transition hover:border-black/30">

              <div>

                <p className="font-semibold">
                  {video ? video.name : "Choose a video"}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  MP4, MOV or WebM
                </p>

              </div>

              <span className="rounded-full bg-[#171717] px-4 py-2 text-sm font-semibold text-white">
                Browse
              </span>

              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={handleVideoChange}
                className="hidden"
              />

            </label>

          </div>

          {/* =========================
              ERROR
          ========================== */}

          {error && (

            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">

              <strong>Something went wrong:</strong>{" "}
              {error}

            </div>

          )}

          {/* =========================
              SUBMIT
          ========================== */}

          <div className="rounded-3xl bg-[#171717] p-6 text-white md:p-8">

            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">

              <div>

                <h2 className="text-xl font-semibold">
                  Ready to submit?
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">
                  Your property will be reviewed by ZOYA before
                  it becomes publicly visible.
                </p>

                {uploadProgress && (

                  <p className="mt-4 text-sm font-medium text-white/80">
                    {uploadProgress}
                  </p>

                )}

              </div>

              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-white px-7 py-3.5 font-semibold text-[#171717] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {submitting
                  ? "Submitting..."
                  : "Submit property"}

              </button>

            </div>

          </div>

        </form>

      </section>

    </main>
  );
}
