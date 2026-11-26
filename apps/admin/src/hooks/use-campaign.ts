import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { clockOffset } from "@/lib/countdown";

/**
 * The campaign running on a landing page, plus this device's clock error.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * THIS HOOK DOES NOT TICK, ON PURPOSE.
 *
 * It returns static data: the campaign, and a fixed millisecond offset. The per-second
 * tick lives inside <CampaignCountdown> alone.
 *
 * If the countdown lived here, every component consuming this hook would re-render once
 * per second for the life of the page — the hero, the price block, the vehicle selector,
 * the FAQ. On a mid-range Android phone arriving from an ad, that is a measurable cost
 * for something only four digits on screen actually need. Keeping the clock in the leaf
 * that displays it means the rest of the page renders once.
 * ─────────────────────────────────────────────────────────────────────────────────────
 *
 * FAILS CLOSED, like every other offer surface. While loading, on network error, or if
 * the endpoint is unreachable, `campaign` is null — the page shows normal pricing rather
 * than an offer the server may not honour. Promising a free booking and then charging is
 * far worse than briefly not advertising one that is running.
 *
 * The legacy free_booking_until path is untouched and still available through
 * useBookingOffer(). See the fallback note on `CampaignOffer` below.
 */

export interface ActiveCampaign {
  identifier: string;
  name: string;
  serviceSlug: string;
  vehicleType: "car" | "bike" | "both";
  landingPage: string;
  /** ISO instant. */
  startsAt: string;
  /** ISO instant, EXCLUSIVE — the offer is over at this moment, not after it. */
  endsAt: string;
  offerType: "free_booking" | "none";
  offerTitle: string;
  offerDescription: string | null;
  ctaText: string;
}

interface CampaignResponse {
  serverNow: string;
  campaign: ActiveCampaign | null;
}

export interface UseCampaignResult {
  campaign: ActiveCampaign | null;
  /**
   * serverNow - Date.now(), sampled once when the response arrived.
   *
   * Add this to Date.now() to get server time. Zero when unknown, which degrades to
   * trusting the device clock — no worse than having no correction at all.
   */
  serverOffsetMs: number;
  isLoading: boolean;
  /** True when this campaign waives the booking fee. Presentation-only campaigns are
   *  offerType "none" and must not be described as free. */
  isFreeBooking: boolean;
}

export function useCampaign(landingPage: string | null | undefined): UseCampaignResult {
  const { data, isLoading } = useQuery<CampaignResponse>({
    queryKey: ["/api/campaigns/active", landingPage ?? ""],
    queryFn: async () => {
      const res = await fetch(
        `/api/campaigns/active?landingPage=${encodeURIComponent(landingPage ?? "")}`,
        { credentials: "same-origin" },
      );
      if (!res.ok) throw new Error(`campaign lookup failed: ${res.status}`);
      const body = (await res.json()) as CampaignResponse;

      // Sample the client clock HERE, as close to the response as possible. Computing the
      // offset later — at render, or in a useMemo that runs after a slow paint — would
      // fold the intervening time into it and skew every tick by that amount.
      return { ...body, __clientNow: Date.now() } as CampaignResponse & { __clientNow: number };
    },
    enabled: Boolean(landingPage),
    retry: false,
    /**
     * The offer ends at a fixed instant, so a long cache would keep advertising it after
     * it closed. One minute matches useBookingOffer, and the countdown itself reaches
     * zero locally well before a stale cache could matter.
     */
    staleTime: 60_000,
  });

  const serverOffsetMs = useMemo(() => {
    if (!data) return 0;
    const clientNow = (data as CampaignResponse & { __clientNow?: number }).__clientNow;
    return clockOffset(data.serverNow, typeof clientNow === "number" ? clientNow : Date.now());
  }, [data]);

  const campaign = data?.campaign ?? null;

  return {
    campaign,
    serverOffsetMs,
    isLoading,
    isFreeBooking: campaign?.offerType === "free_booking",
  };
}
