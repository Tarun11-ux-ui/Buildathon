"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bath,
  BedDouble,
  Bookmark,
  Building2,
  ChevronRight,
  DollarSign,
  ExternalLink,
  Filter,
  Heart,
  Home as HomeIcon,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Square,
  Star,
  X,
} from "lucide-react";
import { getProperties } from "../lib/api";

const regionPresets = [
  { label: "Austin", regionId: "10221", helper: "Live verified search" },
  { label: "San Francisco", regionId: "20330", helper: "Zillow docs example" },
  { label: "Anakin default", regionId: "12447", helper: "Catalog default region" },
];

const initialSearch = {
  regionId: "10221",
  status: "ForSale",
  minPrice: "",
  maxPrice: "",
  beds: "",
  baths: "",
};

function formatCurrency(value) {
  if (!value) return "Price unavailable";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function listingImage(property) {
  return (
    property.img_src ||
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=900&q=80"
  );
}

function compactAddress(address = "") {
  return address.split(",").slice(0, 2).join(",") || "Address unavailable";
}

export default function Home() {
  const [search, setSearch] = useState(initialSearch);
  const [draftRegion, setDraftRegion] = useState(initialSearch.regionId);
  const [properties, setProperties] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [savedRegions, setSavedRegions] = useState([]);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedFavoriteIds = localStorage.getItem("favoriteListings");
    const savedRegionIds = localStorage.getItem("savedRegions");

    if (savedFavoriteIds) setFavorites(JSON.parse(savedFavoriteIds));
    if (savedRegionIds) setSavedRegions(JSON.parse(savedRegionIds));
  }, []);

  useEffect(() => {
    localStorage.setItem("favoriteListings", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("savedRegions", JSON.stringify(savedRegions));
  }, [savedRegions]);

  useEffect(() => {
    let isMounted = true;

    async function loadListings() {
      try {
        setLoading(true);
        setError("");

        const listings = await getProperties(search);

        if (!isMounted) return;

        setProperties(listings);
        setSelectedId(listings[0]?.zpid || null);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || "Unable to load listings.");
        setProperties([]);
        setSelectedId(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadListings();

    return () => {
      isMounted = false;
    };
  }, [search]);

  const visibleProperties = useMemo(() => {
    const text = query.trim().toLowerCase();

    return properties
      .filter((property) => {
        if (!text) return true;

        return [property.address, property.home_type, property.status_text, property.broker_name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(text);
      })
      .filter((property) => !showSavedOnly || favorites.includes(property.zpid))
      .sort((a, b) => {
        if (sortBy === "price-low") return Number(a.price || 0) - Number(b.price || 0);
        if (sortBy === "price-high") return Number(b.price || 0) - Number(a.price || 0);
        if (sortBy === "beds") return Number(b.beds || 0) - Number(a.beds || 0);
        if (sortBy === "newest") return Number(a.days_on_zillow || 0) - Number(b.days_on_zillow || 0);
        return Number(b.area || 0) - Number(a.area || 0);
      });
  }, [favorites, properties, query, showSavedOnly, sortBy]);

  const selectedProperty = visibleProperties.find((property) => property.zpid === selectedId) || visibleProperties[0];
  const averagePrice = properties.length
    ? Math.round(properties.reduce((sum, property) => sum + Number(property.price || 0), 0) / properties.length)
    : 0;
  const savedCount = properties.filter((property) => favorites.includes(property.zpid)).length;

  function runSearch(event) {
    event?.preventDefault();
    const regionId = draftRegion.trim();

    if (!regionId) {
      setError("Enter a Zillow region ID before searching.");
      return;
    }

    setSearch((current) => ({
      ...current,
      regionId,
    }));
  }

  function updateSearchField(field, value) {
    setSearch((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function toggleFavorite(zpid) {
    setFavorites((current) => (current.includes(zpid) ? current.filter((id) => id !== zpid) : [...current, zpid]));
  }

  function toggleSavedRegion(regionId) {
    setSavedRegions((current) =>
      current.includes(regionId) ? current.filter((id) => id !== regionId) : [...current, regionId],
    );
  }

  return (
    <main className="min-h-screen px-4 py-4 text-ink sm:px-6 lg:px-8">
      <section className="mx-auto grid max-w-[1440px] gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-white/70 bg-white/90 p-4 shadow-lift backdrop-blur lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-ocean text-white">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-normal text-coral">Live Zillow workspace</p>
              <h1 className="text-xl font-black text-ink">Real Estate Agent</h1>
            </div>
          </div>

          <form className="mt-5 space-y-4" onSubmit={runSearch}>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-600" htmlFor="region">
                Zillow region ID
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    id="region"
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm font-semibold outline-none transition focus:border-ocean focus:ring-4 focus:ring-ocean/15"
                    inputMode="numeric"
                    value={draftRegion}
                    onChange={(event) => setDraftRegion(event.target.value)}
                    placeholder="10221"
                  />
                </div>
                <button
                  className="grid h-11 w-11 place-items-center rounded-lg bg-ocean text-white shadow-lg shadow-ocean/20 transition hover:bg-teal-700"
                  type="submit"
                  aria-label="Search region"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              {regionPresets.map((preset) => (
                <button
                  className={`rounded-lg border p-3 text-left transition hover:border-ocean hover:bg-ocean/5 ${
                    search.regionId === preset.regionId ? "border-ocean bg-ocean/10" : "border-slate-200 bg-white"
                  }`}
                  key={preset.regionId}
                  onClick={() => {
                    setDraftRegion(preset.regionId);
                    setSearch((current) => ({ ...current, regionId: preset.regionId }));
                  }}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-ink">{preset.label}</p>
                      <p className="text-xs font-semibold text-slate-500">Region {preset.regionId} - {preset.helper}</p>
                    </div>
                    <MapPin size={18} className="text-ocean" />
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-ink">
                <SlidersHorizontal size={18} />
                Backend filters
              </div>
              <div className="grid gap-3">
                <label className="grid gap-1 text-xs font-bold text-slate-600">
                  Status
                  <select
                    className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-ink outline-none focus:border-ocean focus:ring-4 focus:ring-ocean/15"
                    value={search.status}
                    onChange={(event) => updateSearchField("status", event.target.value)}
                  >
                    <option value="ForSale">For sale</option>
                    <option value="ForRent">For rent</option>
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1 text-xs font-bold text-slate-600">
                    Min price
                    <input
                      className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-ink outline-none focus:border-ocean focus:ring-4 focus:ring-ocean/15"
                      inputMode="numeric"
                      value={search.minPrice}
                      onChange={(event) => updateSearchField("minPrice", event.target.value)}
                      placeholder="0"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-bold text-slate-600">
                    Max price
                    <input
                      className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-ink outline-none focus:border-ocean focus:ring-4 focus:ring-ocean/15"
                      inputMode="numeric"
                      value={search.maxPrice}
                      onChange={(event) => updateSearchField("maxPrice", event.target.value)}
                      placeholder="900000"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="grid gap-1 text-xs font-bold text-slate-600">
                    Beds
                    <select
                      className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-ink outline-none focus:border-ocean focus:ring-4 focus:ring-ocean/15"
                      value={search.beds}
                      onChange={(event) => updateSearchField("beds", event.target.value)}
                    >
                      <option value="">Any</option>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <option key={value} value={value}>{value}+</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs font-bold text-slate-600">
                    Baths
                    <select
                      className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-ink outline-none focus:border-ocean focus:ring-4 focus:ring-ocean/15"
                      value={search.baths}
                      onChange={(event) => updateSearchField("baths", event.target.value)}
                    >
                      <option value="">Any</option>
                      {[1, 2, 3, 4].map((value) => (
                        <option key={value} value={value}>{value}+</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <button
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-ink text-sm font-black text-white transition hover:bg-slate-800"
              type="submit"
            >
              <RefreshCw size={17} />
              Refresh region
            </button>
          </form>

          <div className="mt-5 rounded-lg border border-slate-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-black text-ink">Saved regions</p>
              <button
                className="rounded-lg border border-slate-200 p-2 text-ocean transition hover:bg-ocean/10"
                onClick={() => toggleSavedRegion(search.regionId)}
                type="button"
                aria-label="Save current region"
              >
                <Bookmark size={16} fill={savedRegions.includes(search.regionId) ? "currentColor" : "none"} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedRegions.length ? (
                savedRegions.map((region) => (
                  <button
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700 hover:border-ocean hover:text-ocean"
                    key={region}
                    onClick={() => {
                      setDraftRegion(region);
                      setSearch((current) => ({ ...current, regionId: region }));
                    }}
                    type="button"
                  >
                    {region}
                  </button>
                ))
              ) : (
                <p className="text-sm text-slate-500">No saved regions yet.</p>
              )}
            </div>
          </div>
        </aside>

        <section className="space-y-4">
          <div className="overflow-hidden rounded-lg bg-ink text-white shadow-lift">
            <div className="grid gap-6 bg-[linear-gradient(90deg,rgba(23,32,51,.95),rgba(23,32,51,.55)),url('https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-normal text-gold">
                  <Sparkles size={16} />
                  Frontend to Express to Anakin Zillow
                </p>
                <h2 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
                  Find live listings by region, then narrow the search without losing context.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80">
                  Current region {search.regionId}. Filters are sent to the backend, while keyword, saved, and sorting controls stay instant in the browser.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
                {[
                  ["Listings", properties.length],
                  ["Saved", savedCount],
                  ["Average", averagePrice ? formatCurrency(averagePrice) : "N/A"],
                ].map(([label, value]) => (
                  <div className="rounded-lg border border-white/20 bg-white/10 p-3 backdrop-blur" key={label}>
                    <p className="text-xs font-bold text-white/65">{label}</p>
                    <p className="mt-1 text-lg font-black">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
            <div className="space-y-4">
              <div className="rounded-lg border border-white/70 bg-white/90 p-4 shadow-lg backdrop-blur">
                <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-end">
                  <label className="grid gap-2 text-sm font-bold text-slate-600">
                    Search within loaded listings
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm font-semibold outline-none transition focus:border-ocean focus:ring-4 focus:ring-ocean/15"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Address, broker, home type..."
                      />
                    </div>
                  </label>

                  <label className="grid gap-2 text-sm font-bold text-slate-600">
                    Sort
                    <select
                      className="h-11 min-w-[180px] rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold outline-none focus:border-ocean focus:ring-4 focus:ring-ocean/15"
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                    >
                      <option value="recommended">Largest homes</option>
                      <option value="newest">Newest</option>
                      <option value="price-low">Price low</option>
                      <option value="price-high">Price high</option>
                      <option value="beds">Most beds</option>
                    </select>
                  </label>

                  <button
                    className={`flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-black transition ${
                      showSavedOnly
                        ? "border-coral bg-coral text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-coral hover:text-coral"
                    }`}
                    onClick={() => setShowSavedOnly((value) => !value)}
                    type="button"
                  >
                    <Heart size={17} fill={showSavedOnly ? "currentColor" : "none"} />
                    Saved only
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="grid min-h-[420px] place-items-center rounded-lg border border-white/70 bg-white/90 p-8 text-center shadow-lg">
                  <div>
                    <Loader2 className="mx-auto mb-4 animate-spin text-ocean" size={40} />
                    <h3 className="text-xl font-black text-ink">Loading live Zillow listings</h3>
                    <p className="mt-2 text-sm text-slate-500">Anakin is fetching region {search.regionId}.</p>
                  </div>
                </div>
              ) : error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-800 shadow-lg">
                  <div className="flex items-start gap-3">
                    <X className="mt-1 shrink-0" size={20} />
                    <div>
                      <h3 className="font-black">Unable to load this region</h3>
                      <p className="mt-1 text-sm leading-6">{error}</p>
                      <button
                        className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-black text-white hover:bg-red-800"
                        onClick={() => setSearch((current) => ({ ...current }))}
                        type="button"
                      >
                        <RefreshCw size={16} />
                        Retry
                      </button>
                    </div>
                  </div>
                </div>
              ) : visibleProperties.length ? (
                <div className="grid gap-3">
                  {visibleProperties.map((property) => (
                    <article
                      className={`grid cursor-pointer gap-4 rounded-lg border bg-white/95 p-3 shadow-lg transition hover:-translate-y-0.5 hover:border-ocean hover:shadow-lift md:grid-cols-[230px_minmax(0,1fr)] ${
                        selectedProperty?.zpid === property.zpid ? "border-ocean ring-4 ring-ocean/15" : "border-white/70"
                      }`}
                      key={property.zpid}
                      onClick={() => setSelectedId(property.zpid)}
                    >
                      <div className="relative min-h-[190px] overflow-hidden rounded-lg bg-slate-200">
                        <img
                          alt={property.address || "Zillow listing"}
                          className="h-full w-full object-cover"
                          src={listingImage(property)}
                        />
                        <div className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-xs font-black text-white">
                          {property.status_text || "Active"}
                        </div>
                        <button
                          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-coral shadow-lg"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleFavorite(property.zpid);
                          }}
                          type="button"
                          aria-label="Save listing"
                        >
                          <Heart size={18} fill={favorites.includes(property.zpid) ? "currentColor" : "none"} />
                        </button>
                      </div>

                      <div className="grid content-start gap-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-lg font-black text-ink">{compactAddress(property.address)}</h3>
                            <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-500">
                              <MapPin size={15} />
                              ZPID {property.zpid}
                            </p>
                          </div>
                          <p className="text-xl font-black text-ocean">{formatCurrency(property.price)}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {[
                            [BedDouble, `${property.beds || "N/A"} beds`],
                            [Bath, `${property.baths || "N/A"} baths`],
                            [Square, `${property.area || "N/A"} sq ft`],
                            [HomeIcon, property.home_type || "Home"],
                          ].map(([Icon, label]) => (
                            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700" key={label}>
                              <Icon size={16} className="text-ocean" />
                              {label}
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {property.broker_name && (
                            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                              {property.broker_name}
                            </span>
                          )}
                          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                            {property.days_on_zillow ?? "New"} days on Zillow
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {property.detail_url && (
                            <a
                              className="inline-flex h-10 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-black text-white hover:bg-slate-800"
                              href={property.detail_url}
                              onClick={(event) => event.stopPropagation()}
                              rel="noreferrer"
                              target="_blank"
                            >
                              View on Zillow
                              <ExternalLink size={16} />
                            </a>
                          )}
                          <button
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 hover:border-ocean hover:text-ocean"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedId(property.zpid);
                            }}
                            type="button"
                          >
                            Details
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="grid min-h-[320px] place-items-center rounded-lg border border-white/70 bg-white/90 p-8 text-center shadow-lg">
                  <div>
                    <Filter className="mx-auto mb-4 text-slate-400" size={38} />
                    <h3 className="text-xl font-black text-ink">No listings match these controls</h3>
                    <p className="mt-2 text-sm text-slate-500">Clear saved-only mode, keyword search, or backend filters.</p>
                  </div>
                </div>
              )}
            </div>

            <aside className="rounded-lg border border-white/70 bg-white/95 p-4 shadow-lift xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto">
              {selectedProperty ? (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-lg bg-slate-200">
                    <img
                      alt={selectedProperty.address || "Selected listing"}
                      className="h-64 w-full object-cover"
                      src={listingImage(selectedProperty)}
                    />
                  </div>
                  <div>
                    <p className="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-normal text-coral">
                      <Star size={15} fill="currentColor" />
                      Selected listing
                    </p>
                    <h3 className="text-2xl font-black text-ink">{compactAddress(selectedProperty.address)}</h3>
                    <p className="mt-2 text-sm font-semibold text-slate-500">{selectedProperty.address}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      [DollarSign, formatCurrency(selectedProperty.price)],
                      [BedDouble, `${selectedProperty.beds || "N/A"} beds`],
                      [Bath, `${selectedProperty.baths || "N/A"} baths`],
                      [Square, `${selectedProperty.area || "N/A"} sq ft`],
                    ].map(([Icon, label]) => (
                      <div className="rounded-lg bg-slate-100 p-3" key={label}>
                        <Icon className="mb-2 text-ocean" size={18} />
                        <p className="text-sm font-black text-ink">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-sm font-black text-ink">Market notes</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <p>Status: <strong>{selectedProperty.status_text || "N/A"}</strong></p>
                      <p>Type: <strong>{selectedProperty.home_type || "N/A"}</strong></p>
                      <p>Broker: <strong>{selectedProperty.broker_name || "N/A"}</strong></p>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <button
                      className="flex h-11 items-center justify-center gap-2 rounded-lg bg-coral text-sm font-black text-white transition hover:bg-red-600"
                      onClick={() => toggleFavorite(selectedProperty.zpid)}
                      type="button"
                    >
                      <Heart size={17} fill={favorites.includes(selectedProperty.zpid) ? "currentColor" : "none"} />
                      {favorites.includes(selectedProperty.zpid) ? "Saved" : "Save listing"}
                    </button>
                    {selectedProperty.detail_url && (
                      <a
                        className="flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white text-sm font-black text-slate-700 hover:border-ocean hover:text-ocean"
                        href={selectedProperty.detail_url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open Zillow
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid min-h-[420px] place-items-center text-center">
                  <div>
                    <HomeIcon className="mx-auto mb-4 text-slate-400" size={40} />
                    <h3 className="text-xl font-black text-ink">Select a listing</h3>
                    <p className="mt-2 text-sm text-slate-500">Listing details will appear here.</p>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </section>
      </section>
    </main>
  );
}
