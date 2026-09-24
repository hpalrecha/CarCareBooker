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
    <div className="sv-filters">
      {/* ---- vehicle ---- */}
      {availableVehicles.length > 1 && (
        <div className="sv-vehicle">
          <span className="sv-label">Your vehicle</span>
          <div className="sv-chips" role="group" aria-label="Filter by vehicle">
            {availableVehicles.map((v) => {
              const active = vehicle === v.key;
              return (
                <button
                  key={v.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setVehicle(v.key)}
                  data-testid={`filter-vehicle-${v.key}`}
                  className={"sv-chip inline-flex items-center justify-center min-h-[40px]" + (active ? " is-active" : "")}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ---- category tabs + search ---- */}
      <div className="sv-tabbar">
        <div className="sv-tabs" role="group" aria-label="Filter by category">
          {(["All", ...availableCategories] as (ServiceCategory | "All")[]).map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(c)}
                data-testid={`filter-category-${c}`}
                className={"sv-tab inline-flex items-center justify-center min-h-[40px]" + (active ? " is-active" : "")}
              >
                {c}
              </button>
            );
          })}
        </div>

        <label className="sv-search">
          <Search className="w-[15px] h-[15px] flex-none" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services…"
            aria-label="Search services"
            data-testid="filter-search"
          />
        </label>
      </div>

      {/* Vehicle and category combine; one quiet line says so. */}
      <p className="sv-hint">
        Vehicle and category apply <b>together</b> — choosing SUV then PPF shows only the SUV paint
        protection packages.
      </p>

      {/* ---- result count ---- */}
      <p className="sv-count" data-testid="filter-count" aria-live="polite">
        <b>{filtered.length}</b>
        {filtered.length === 1 ? " service" : " services"}
        {isFiltered && (
          <>
            {" "}
            of {services.length}
            <button
              type="button"
              onClick={clearAll}
              data-testid="filter-clear"
              className="sv-clear inline-flex items-center min-h-[40px] gap-1"
            >
              <X className="w-3 h-3" aria-hidden="true" />
              Clear filters
            </button>
          </>
        )}
      </p>

      {filtered.length === 0 ? (
        <div className="sv-empty" data-testid="filter-empty">
          <b>Nothing matches that</b>
          <p>
            Try another category, or{" "}
            <button type="button" onClick={clearAll} className="sv-clear inline-flex items-center min-h-[40px]">
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
