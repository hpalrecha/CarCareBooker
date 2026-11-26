import type { CatalogueRow } from "@p91/domain/price-ranges";

/** Read-only client for the existing Express API. Build and ISR only; never POST from here. */
const API_ORIGIN = process.env.API_ORIGIN ?? "https://p91carcare.com";

export type BusinessHour = { dayOfWeek: number; dayName: string; isOpen: boolean; openTime: string; cutoffTime: string };

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_ORIGIN}${path}`, { next: { revalidate: 300 }, headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

/** A catalogue row with the fields marketing pages read: price for ranges, whatIncluded for the PPF warranty years. */
export type ServiceRow = CatalogueRow & { title: string; whatIncluded?: unknown; duration?: number | string; durationText?: string | null };

export async function getServices(): Promise<ServiceRow[]> {
  const data = await get<unknown>("/api/services");
  const rows = Array.isArray(data) ? data : ((data as { services?: unknown[] }).services ?? []);
  return (rows as Array<{ slug: string; price: string; isActive?: boolean; title?: string; whatIncluded?: unknown; duration?: number | string; durationText?: string | null }>).map((r) => ({
    slug: r.slug,
    price: r.price,
    isActive: r.isActive,
    title: r.title ?? "",
    whatIncluded: r.whatIncluded,
    duration: r.duration,
    durationText: r.durationText ?? null,
  }));
}

export const getBusinessHours = () => get<BusinessHour[]>("/api/business-hours");
