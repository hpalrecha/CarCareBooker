// Run with:  node --import tsx --test server/services/chatbot.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import type OpenAI from "openai";
import { runChat, evaluateProposedSlot, type ChatbotStorageDeps } from "./chatbot";

const SERVICE = {
  id: "svc-1",
  slug: "ceramic-coating-bangalore",
  title: "Ceramic Coating",
  isActive: true,
  maxBookingsPerSlot: 3,
};

function makeDeps(over: Partial<{
  service: typeof SERVICE | undefined;
  blackouts: Array<{ date: string; reason: string }>;
  hours: { isOpen: boolean; openTime: string; cutoffTime: string; dayName: string } | undefined;
  count: number;
  services: Array<{ id: string; slug: string; title: string; price: string }>;
}> = {}): ChatbotStorageDeps {
  return {
    getAllServices: async () => (over.services ?? [SERVICE]) as any,
    getAllBusinessHours: async () => [] as any,
    getAllBlackoutDates: async () => over.blackouts ?? [],
    getActiveChatbotKnowledge: async () => [],
    getBusinessHoursForDay: async () =>
      over.hours ?? { isOpen: true, openTime: "10:30", cutoffTime: "16:30", dayName: "Test" },
    getBookingCountForSlot: async () => over.count ?? 0,
    getService: async (id: string) =>
      (over.service === undefined ? SERVICE : over.service)?.id === id
        ? ((over.service === undefined ? SERVICE : over.service) as any)
        : undefined,
  };
}

// ---------------------------------------------------------------------------------------
// evaluateProposedSlot — the one path that can produce a customer-visible booking link.
// Mirrors booking-validation.test.ts's fixtures: whatever the model claims, a full,
// blacked-out, closed or past slot must never reach a bookingUrl.
// ---------------------------------------------------------------------------------------

test("evaluateProposedSlot accepts a genuinely open slot and returns a real bookingUrl", async () => {
  const result = await evaluateProposedSlot(makeDeps(), {
    serviceId: "svc-1",
    date: "2099-01-02",
    time: "12:00",
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.slot.bookingUrl, "/service/ceramic-coating-bangalore?date=2099-01-02&time=12%3A00");
    assert.equal(result.slot.serviceTitle, "Ceramic Coating");
  }
});

test("evaluateProposedSlot rejects a full slot — never returns a bookingUrl", async () => {
  const result = await evaluateProposedSlot(makeDeps({ count: 3 }), {
    serviceId: "svc-1",
    date: "2099-01-02",
    time: "12:00",
  });
  assert.equal(result.ok, false);
  assert.equal((result as any).slot, undefined);
});

test("evaluateProposedSlot rejects a blackout date regardless of what the model claims", async () => {
  const result = await evaluateProposedSlot(
    makeDeps({ blackouts: [{ date: "2099-01-02", reason: "Holiday" }] }),
    { serviceId: "svc-1", date: "2099-01-02", time: "12:00" },
  );
  assert.equal(result.ok, false);
});

test("evaluateProposedSlot rejects an unknown/inactive service id", async () => {
  const result = await evaluateProposedSlot(makeDeps({ service: undefined }), {
    serviceId: "does-not-exist",
    date: "2099-01-02",
    time: "12:00",
  });
  assert.equal(result.ok, false);
});

test("evaluateProposedSlot rejects a slot outside business hours", async () => {
  const result = await evaluateProposedSlot(makeDeps(), {
    serviceId: "svc-1",
    date: "2099-01-02",
    time: "20:00",
  });
  assert.equal(result.ok, false);
});

// ---------------------------------------------------------------------------------------
// runChat — the Responses API tool-call loop, with a fake OpenAI client (no network call).
// ---------------------------------------------------------------------------------------

function fakeOpenAI(createImpl: (call: number, body: any) => any): OpenAI {
  let call = 0;
  return {
    responses: {
      create: async (body: any) => {
        call += 1;
        return createImpl(call, body);
      },
    },
  } as unknown as OpenAI;
}

function textResponse(text: string) {
  return { id: "resp_1", output: [], output_text: text };
}

test("runChat: plain question, no tool calls, returns the model's text", async () => {
  const client = fakeOpenAI(() => textResponse("We're open 10:30-16:30 daily."));
  const result = await runChat([{ role: "user", content: "What are your hours?" }], {
    deps: makeDeps(),
    client,
  });
  assert.equal(result.reply, "We're open 10:30-16:30 daily.");
  assert.equal(result.proposedSlot, null);
});

test("runChat: a tool call is executed against real data, then the model answers", async () => {
  const client = fakeOpenAI((call) => {
    if (call === 1) {
      return {
        id: "resp_1",
        output_text: "",
        output: [{ type: "function_call", call_id: "call_1", name: "get_services", arguments: "{}" }],
      };
    }
    return textResponse("We offer Ceramic Coating.");
  });
  const result = await runChat([{ role: "user", content: "What services do you have?" }], {
    deps: makeDeps(),
    client,
  });
  assert.equal(result.reply, "We offer Ceramic Coating.");
});

test("runChat: propose_slot for a genuinely open slot surfaces a real bookingUrl", async () => {
  const client = fakeOpenAI((call) => {
    if (call === 1) {
      return {
        id: "resp_1",
        output_text: "",
        output: [
          {
            type: "function_call",
            call_id: "call_1",
            name: "propose_slot",
            arguments: JSON.stringify({ serviceId: "svc-1", date: "2099-01-02", time: "12:00" }),
          },
        ],
      };
    }
    return textResponse("How about Ceramic Coating on Jan 2 at 12:00?");
  });
  const result = await runChat([{ role: "user", content: "Book me ceramic coating" }], {
    deps: makeDeps(),
    client,
  });
  assert.ok(result.proposedSlot);
  assert.equal(result.proposedSlot?.bookingUrl, "/service/ceramic-coating-bangalore?date=2099-01-02&time=12%3A00");
});

test("runChat: propose_slot for a slot that's actually full never surfaces a bookingUrl", async () => {
  const client = fakeOpenAI((call) => {
    if (call === 1) {
      return {
        id: "resp_1",
        output_text: "",
        output: [
          {
            type: "function_call",
            call_id: "call_1",
            name: "propose_slot",
            arguments: JSON.stringify({ serviceId: "svc-1", date: "2099-01-02", time: "12:00" }),
          },
        ],
      };
    }
    return textResponse("That time's no longer available — here's what else is open.");
  });
  const result = await runChat([{ role: "user", content: "Book me ceramic coating" }], {
    deps: makeDeps({ count: 3 }), // slot is full
    client,
  });
  assert.equal(result.proposedSlot, null);
});

test("runChat: a model stuck in a tool-call loop falls back after the round cap, never spins forever", async () => {
  let calls = 0;
  const client = fakeOpenAI(() => {
    calls += 1;
    return {
      id: `resp_${calls}`,
      output_text: "",
      output: [{ type: "function_call", call_id: `call_${calls}`, name: "get_services", arguments: "{}" }],
    };
  });
  const result = await runChat([{ role: "user", content: "hello" }], { deps: makeDeps(), client });
  assert.match(result.reply, /call or WhatsApp/i);
  // 1 initial call + maxToolRounds retries, never unbounded.
  assert.ok(calls <= 6, `expected a bounded number of calls, got ${calls}`);
});
