// Run with:  node --import tsx --test server/lib/chatbot-knowledge.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildChatbotInstructions, type ChatbotKnowledgeDeps } from "./chatbot-knowledge";

const makeDeps = (over: Partial<{
  services: Array<{ title: string; slug: string; price: string }>;
  businessHours: Array<{ dayOfWeek: number; dayName: string; isOpen: boolean; openTime: string; cutoffTime: string }>;
  blackoutDates: Array<{ date: string; reason: string }>;
}> = {}): ChatbotKnowledgeDeps => ({
  getAllServices: async () => (over.services ?? []) as any,
  getAllBusinessHours: async () => (over.businessHours ?? []) as any,
  getAllBlackoutDates: async () => (over.blackoutDates ?? []) as any,
});

test("live service titles and prices appear in the instructions", async () => {
  const instructions = await buildChatbotInstructions(
    makeDeps({ services: [{ title: "Ceramic Coating", slug: "ceramic-coating-bangalore", price: "12000" }] }),
  );
  assert.match(instructions, /Ceramic Coating/);
  assert.match(instructions, /ceramic-coating-bangalore/);
});

test("blackout dates are listed and flagged not to propose", async () => {
  const instructions = await buildChatbotInstructions(
    makeDeps({ blackoutDates: [{ date: "2026-10-15", reason: "Diwali" }] }),
  );
  assert.match(instructions, /2026-10-15/);
  assert.match(instructions, /Diwali/);
  assert.match(instructions, /never propose/i);
});

test("no blackout dates still produces a clear (not empty) section", async () => {
  const instructions = await buildChatbotInstructions(makeDeps());
  assert.match(instructions, /None scheduled/i);
});

test("never-invent guardrail and propose_slot tool instruction are present", async () => {
  const instructions = await buildChatbotInstructions(makeDeps());
  assert.match(instructions, /never invent/i);
  assert.match(instructions, /propose_slot/);
  assert.match(instructions, /never tell a customer their booking is confirmed/i);
});

test("bike PPF is stated as offered (quote on request), never as unavailable", async () => {
  const instructions = await buildChatbotInstructions(makeDeps());
  assert.match(instructions, /Bike PPF.*P91 DOES offer this/i);
  assert.match(instructions, /never state or estimate a number/i);
});

test("phone/WhatsApp fallback is present for out-of-scope questions", async () => {
  const instructions = await buildChatbotInstructions(makeDeps());
  assert.match(instructions, /\+917406619191/);
  assert.match(instructions, /wa\.me\/917406619191/);
});
