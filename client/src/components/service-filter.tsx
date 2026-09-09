import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import {
  CATEGORY_ORDER,
  VEHICLE_FILTERS,
  deriveCategory,
  fitsVehicle,
  matchesQuery,
  type ServiceCategory,
  type ServiceVehicle,
} from "@/lib/service-taxonomy";

/**
 * Category tabs + vehicle filter + search over the live service catalogue.
 *
 * This is audit finding UX-1: the services grid was one flat list of 17 items with no
 * category, no search and no way to compare like with like, so someone who wanted their
 * interior cleaned scrolled past ceramic coating and PPF to find it.
 *
 * The filtering is entirely client-side over the records `GET /api/services` already
 * returns. That is deliberate — the catalogue is 17 rows, it is already fetched and
 * cached by react-query for the grid, and adding query parameters would mean new server
 * routes and a second source of truth for what "Glass" means. Categories are derived at
 * render time by lib/service-taxonomy.
 *
 * The component owns only filter STATE. It never owns service data, never reorders the
 * catalogue, and renders whatever its parent passes through `children` — so prices,
 * discounts and availability continue to come straight from the API record.
 */

interface ServiceLike {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
}

interface ServiceFilterProps<T extends ServiceLike> {
  services: T[];
  /** Rendered with the filtered subset. The parent decides how a card looks. */
  children: (filtered: T[]) => React.ReactNode;
}

export default function ServiceFilter<T extends ServiceLike>({ services, children }: ServiceFilterProps<T>) {
  const [category, setCategory] = useState<ServiceCategory | "All">("All");
  const [vehicle, setVehicle] = useState<ServiceVehicle | "all">("all");
  const [query, setQuery] = useState("");

  // Only offer tabs that actually have services behind them. A tab that always yields
  // "nothing matches" is worse than no tab, and "Other" in particular should stay
  // invisible unless an unclassified service really exists.
  const availableCategories = useMemo(() => {
    const present = new Set(services.map((s) => deriveCategory(s)));
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, [services]);

  // Same rule for the vehicle chips: hide Bike when there is no bike work on offer.
  const availableVehicles = useMemo(
    () =>
      VEHICLE_FILTERS.filter(
        (v) => v.key === "all" || services.some((s) => fitsVehicle(s, v.key)),
      ),
    [services],
  );

  const filtered = useMemo(
    () =>
      services.filter(
        (s) =>
          (category === "All" || deriveCategory(s) === category) &&
          fitsVehicle(s, vehicle) &&
          matchesQuery(s, query),
      ),
    [services, category, vehicle, query],
  );

  const isFiltered = category !== "All" || vehicle !== "all" || query.trim() !== "";

  const clearAll = () => {
    setCategory("All");
    setVehicle("all");
    setQuery("");
  };

  return (
    <div>
      {/* ---- vehicle bar ---- */}
      {availableVehicles.length > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-3 sm:gap-4 rounded-xl border border-[var(--medium-gray)] bg-[var(--dark-gray)] px-4 py-4 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[var(--txt-3)] whitespace-nowrap">
            Your vehicle
          </span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by vehicle">
            {availableVehicles.map((v) => {
              const active = vehicle === v.key;
              return (
                <button
                  key={v.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setVehicle(v.key)}
                  data-testid={`filter-vehicle-${v.key}`}
                  className={
                    "rounded-full border px-4 py-1.5 text-[13px] whitespace-nowrap transition-colors " +
                    (active
                      ? "border-[var(--neon-green)] text-[var(--neon-green)] font-bold shadow-[inset_0_0_0_1px_var(--neon-green)] bg-transparent"
                      : "border-[var(--medium-gray)] bg-[var(--deep-black)] text-[var(--txt-2)] hover:border-[var(--neon-line)] hover:text-[var(--txt)]")
                  }
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-[13px] text-[var(--txt-3)] mb-5">
        Vehicle and category apply <b className="text-[var(--txt-2)]">together</b> — choosing SUV then PPF
        shows only the SUV paint protection packages.
      </p>

      {/* ---- category tabs + search ---- */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
        <div className="flex flex-wrap gap-2 order-1" role="group" aria-label="Filter by category">
          {(["All", ...availableCategories] as (ServiceCategory | "All")[]).map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(c)}
                data-testid={`filter-category-${c}`}
                className={
                  "rounded-full border px-3.5 py-1.5 text-[13px] whitespace-nowrap transition-colors " +
                  (active
                    ? "bg-[var(--neon-green)] border-[var(--neon-green)] text-[#04120A] font-bold"
                    : "border-[var(--medium-gray)] text-[var(--txt-2)] hover:border-[var(--neon-line)] hover:text-[var(--txt)]")
                }
              >
                {c}
              </button>
            );
          })}
        </div>

        <label className="order-2 lg:ml-auto flex items-center gap-2.5 rounded-[10px] border border-[var(--medium-gray)] px-3.5 py-2 lg:min-w-[230px] focus-within:border-[var(--neon-line)]">
          <Search className="w-[15px] h-[15px] flex-none text-[var(--txt-3)]" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services…"
            aria-label="Search services"
            data-testid="filter-search"
            className="w-full bg-transparent border-0 outline-none text-sm text-[var(--txt)] placeholder:text-[var(--txt-3)]"
          />
        </label>
      </div>

      {/* ---- result count ---- */}
      <p className="text-[13px] text-[var(--txt-3)] mb-6" data-testid="filter-count" aria-live="polite">
        <b className="text-[var(--txt)]">{filtered.length}</b>
        {filtered.length === 1 ? " service" : " services"}
        {isFiltered && (
          <>
            {" "}
            of {services.length}
            <button
              type="button"
              onClick={clearAll}
              data-testid="filter-clear"
              className="ml-3 inline-flex items-center gap-1 text-[var(--neon-green)] hover:underline"
            >
              <X className="w-3 h-3" aria-hidden="true" />
              Clear filters
            </button>
          </>
        )}
      </p>

      {filtered.length === 0 ? (
        <div
          className="rounded-2xl border border-[var(--medium-gray)] bg-[var(--dark-gray)] px-6 py-12 text-center"
          data-testid="filter-empty"
        >
          <b className="block text-lg text-[var(--txt)] mb-2">Nothing matches that</b>
          <p className="text-[var(--txt-2)]">
            Try another category, or{" "}
            <button type="button" onClick={clearAll} className="text-[var(--neon-green)] hover:underline">
              clear the filters
            </button>{" "}
            to see all {services.length} services.
          </p>
        </div>
      ) : (
        children(filtered)
      )}
    </div>
  );
}
