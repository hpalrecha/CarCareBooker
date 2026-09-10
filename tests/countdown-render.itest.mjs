/**
 * Phase 2C — what the offer block actually renders.
 *
 *   npm run test:integration
 *
 * Rendered with react-dom/server rather than a browser: no headless browser is installed,
 * and adding one for this would be a heavy dependency for assertions that are really
 * about markup. The countdown seeds its state synchronously in a useState initialiser
 * precisely so the FIRST paint is already correct, which means server rendering shows the
 * same thing a browser shows on frame one.
 *
 * What this cannot cover, and is covered elsewhere:
 *   ticking and cleanup   -> tests/countdown-timer.itest.mjs (deterministic fake clock)
 *   the arithmetic        -> tests/countdown.itest.mjs
 *
 * The wording assertions here are the ones that matter commercially. The offer is that
 * BOOKING is free; the ₹45,000 PPF job is not. A regression that renders "FREE" without a
 * price beside it is a customer arriving at the studio expecting free work.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import CampaignCountdown from "../client/src/components/campaign-countdown.tsx";
import CampaignOffer from "../client/src/components/campaign-offer.tsx";

const HOUR = 3_600_000, DAY = 86_400_000;

const futureIso = (ms) => new Date(Date.now() + ms).toISOString();

/** Render a tree with a query cache pre-seeded, so no network is involved. */
function renderWithData(element, seed = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  for (const [key, value] of Object.entries(seed)) {
    qc.setQueryData(JSON.parse(key), value);
  }
  return renderToStaticMarkup(
    React.createElement(QueryClientProvider, { client: qc }, element),
  );
}

const campaignKey = (landingPage) => JSON.stringify(["/api/campaigns/active", landingPage]);
const offerKey = JSON.stringify(["/api/booking-offer"]);

const activeCampaign = (over = {}) => ({
  serverNow: new Date().toISOString(),
  __clientNow: Date.now(),
  campaign: {
    identifier: "ceramic_car_sep",
    name: "September Ceramic Car",
    serviceSlug: "1-year-ceramic-coating",
    vehicleType: "car",
    landingPage: "/ceramic-coating/car",
    startsAt: new Date(Date.now() - DAY).toISOString(),
    endsAt: futureIso(4 * DAY + 12 * HOUR),
    offerType: "free_booking",
    offerTitle: "Booking Is Free This Week",
    offerDescription: "Reserve your slot at no cost.",
    ctaText: "Book Free Appointment",
    ...over,
  },
});

// ===========================================================================
describe("CampaignCountdown markup", () => {
  const render = (props) =>
    renderToStaticMarkup(
      React.createElement(CampaignCountdown, {
        endsAt: futureIso(4 * DAY + 12 * HOUR),
        serverOffsetMs: 0,
        ...props,
      }),
    );

  test("renders all four units with visible text labels", () => {
    const html = render({});
    for (const label of ["Days", "Hours", "Minutes", "Seconds"]) {
      assert.ok(html.includes(label), `${label} is labelled in visible text`);
    }
  });

  test("the unit is never conveyed by position or colour alone", () => {
    // Each number is followed by its own label element, so the row is readable without
    // knowing the conventional order.
    const html = render({});
    const labelCount = (html.match(/cd-unit-label/g) ?? []).length;
    assert.equal(labelCount, 4, "one text label per unit");
  });

  test("shows the real remaining time on the first paint", () => {
    // No placeholder flash: initialising to zero and correcting on the first tick would
    // render "00 00 00 00", which reads as an offer that has already ended.
    const html = render({ endsAt: futureIso(4 * DAY + 12 * HOUR) });
    assert.match(html, />4</, "4 days is already rendered");
    assert.ok(!/>00<[\s\S]*>00<[\s\S]*>00<[\s\S]*>00</.test(html), "not all-zeroes");
  });

  test("carries timer semantics without per-second announcements", () => {
    const html = render({});
    assert.match(html, /role="timer"/);
    assert.match(html, /aria-live="off"/, "digits do not interrupt a screen reader each second");
    assert.match(html, /aria-live="polite"/, "a minute-granularity summary does the announcing");
  });

  test("the spoken summary omits seconds", () => {
    const html = render({ endsAt: futureIso(4 * DAY + 12 * HOUR) });
    assert.match(html, /remaining/);
    assert.ok(!/\d+ seconds remaining/.test(html), "seconds are never announced");
  });

  test("an EXPIRED countdown renders nothing at all", () => {
    const html = render({ endsAt: new Date(Date.now() - DAY).toISOString() });
    assert.equal(html, "", "no zeroes, no negative timer, no empty shell");
  });

  test("a malformed deadline renders nothing rather than a broken timer", () => {
    assert.equal(render({ endsAt: "not-a-date" }), "");
  });

  test("the label is overridable but defaults to offer-safe wording", () => {
    assert.match(render({}), /Free booking offer ends in/);
    assert.match(render({ label: "Ends in" }), /Ends in/);
  });
});

// ===========================================================================
describe("CampaignOffer — wording and price are inseparable", () => {
  const noop = () => {};

  test("an active campaign shows the offer, the countdown and the real price", () => {
    const html = renderWithData(
      React.createElement(CampaignOffer, {
        landingPage: "/ceramic-coating/car",
        servicePrice: "5999.00",
        serviceTitle: "1 Year Ceramic Coating",
        onBook: noop,
      }),
      { [campaignKey("/ceramic-coating/car")]: activeCampaign() },
    );

    assert.match(html, /Booking Is Free This Week/, "campaign title from the database");
    assert.match(html, /Days/, "countdown present");
    assert.match(html, /₹5,999/, "the REAL catalogue price is shown");
    assert.match(html, /Book Free Appointment/, "campaign CTA text");
  });

  test("the price cannot be rendered without the free-booking claim, or vice versa", () => {
    const html = renderWithData(
      React.createElement(CampaignOffer, {
        landingPage: "/ppf",
        servicePrice: "45000.00",
        serviceTitle: "P91 PPF - Hatchback",
        onBook: noop,
      }),
      { [campaignKey("/ppf")]: activeCampaign({ landingPage: "/ppf" }) },
    );

    assert.match(html, /Book free/, "the claim");
    assert.match(html, /₹45,000 at the studio/, "and the amount, in the same sentence");
    assert.match(html, /charged as normal at the studio/, "explicit clarifier");
  });

  test("NEVER says the service itself is free", () => {
    const html = renderWithData(
      React.createElement(CampaignOffer, {
        landingPage: "/ppf",
        servicePrice: "45000.00",
        serviceTitle: "P91 PPF - Hatchback",
        onBook: noop,
      }),
      { [campaignKey("/ppf")]: activeCampaign({ landingPage: "/ppf" }) },
    );

    const forbidden = [
      /free ceramic coating/i,
      /free ppf/i,
      /free paint protection/i,
      /free detailing/i,
      /free car wash/i,
      /ceramic coating (is )?free/i,
      /pay nothing/i,
      /pay remainder/i,
      /100% free/i,
    ];
    for (const pattern of forbidden) {
      assert.ok(!pattern.test(html), `must not render ${pattern}`);
    }
  });

  test("an offerType 'none' campaign is not described as free booking", () => {
    // Presentation-only campaigns do not waive the fee, so the free-booking block must
    // not claim they do. With no legacy offer either, nothing renders.
    const html = renderWithData(
      React.createElement(CampaignOffer, {
        landingPage: "/ceramic-coating/car",
        servicePrice: "5999.00",
        onBook: noop,
      }),
      {
        [campaignKey("/ceramic-coating/car")]: activeCampaign({ offerType: "none" }),
        [offerKey]: { free: false, until: null },
      },
    );
    assert.equal(html, "");
  });
});

// ===========================================================================
describe("CampaignOffer — fallback behaviour", () => {
  const noop = () => {};

  test("no campaign but the LEGACY offer is live: legacy wording, no fabricated countdown", () => {
    const html = renderWithData(
      React.createElement(CampaignOffer, {
        landingPage: "/ceramic-coating/car",
        servicePrice: "5999.00",
        serviceTitle: "1 Year Ceramic Coating",
        onBook: noop,
      }),
      {
        [campaignKey("/ceramic-coating/car")]: { serverNow: new Date().toISOString(), campaign: null },
        [offerKey]: { free: true, until: "2026-09-16" },
      },
    );

    assert.match(html, /Booking Is Free/, "the offer still shows");
    assert.match(html, /Free booking until 16 September 2026/, "states the date it actually has");
    assert.ok(!html.includes("Seconds"), "no countdown invented for a date-only setting");
    assert.match(html, /₹5,999/, "and the price is still shown");
  });

  test("no campaign and no legacy offer: renders nothing", () => {
    const html = renderWithData(
      React.createElement(CampaignOffer, {
        landingPage: "/ceramic-coating/car",
        servicePrice: "5999.00",
        onBook: noop,
      }),
      {
        [campaignKey("/ceramic-coating/car")]: { serverNow: new Date().toISOString(), campaign: null },
        [offerKey]: { free: false, until: null },
      },
    );
    assert.equal(html, "", "a page with no offer looks like a page with no offer");
  });

  test("an EXPIRED campaign does not show a positive countdown", () => {
    const html = renderWithData(
      React.createElement(CampaignOffer, {
        landingPage: "/ceramic-coating/car",
        servicePrice: "5999.00",
        onBook: noop,
      }),
      {
        [campaignKey("/ceramic-coating/car")]: activeCampaign({
          endsAt: new Date(Date.now() - DAY).toISOString(),
        }),
        [offerKey]: { free: false, until: null },
      },
    );
    assert.ok(!html.includes("Seconds"), "no timer for a finished campaign");
    assert.ok(!/-\d/.test(html), "and certainly no negative digits");
  });

  test("while the API is still loading, no offer is claimed", () => {
    // Fails closed: promising a free booking and then charging is far worse than briefly
    // not advertising one that is running.
    const html = renderWithData(
      React.createElement(CampaignOffer, {
        landingPage: "/ceramic-coating/car",
        servicePrice: "5999.00",
        onBook: noop,
      }),
      {},
    );
    assert.equal(html, "");
  });

  test("a missing price does not produce an unpriced free-booking claim", () => {
    const html = renderWithData(
      React.createElement(CampaignOffer, {
        landingPage: "/ceramic-coating/car",
        servicePrice: undefined,
        onBook: noop,
      }),
      { [campaignKey("/ceramic-coating/car")]: activeCampaign() },
    );
    // The catalogue not having loaded yet must not leave "FREE" on screen alone.
    assert.ok(!html.includes("Book free"), "no claim without an amount beside it");
  });
});
