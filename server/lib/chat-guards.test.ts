// Run with:  node --import tsx --test server/lib/chat-guards.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateChatRequestBody, CHAT_LIMITS } from "./chat-guards";

test("valid single-turn request passes", () => {
  const r = validateChatRequestBody({ messages: [{ role: "user", content: "Hi, what services do you offer?" }] });
  assert.equal(r.ok, true);
});

test("valid multi-turn conversation passes", () => {
  const r = validateChatRequestBody({
    messages: [
      { role: "user", content: "Hi" },
      { role: "assistant", content: "Hello! How can I help?" },
      { role: "user", content: "What's your address?" },
    ],
  });
  assert.equal(r.ok, true);
});

test("non-object body rejected", () => {
  const r = validateChatRequestBody("nope");
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.status, 400);
});

test("missing messages array rejected", () => {
  const r = validateChatRequestBody({});
  assert.equal(r.ok, false);
});

test("empty conversation rejected", () => {
  const r = validateChatRequestBody({ messages: [] });
  assert.equal(r.ok, false);
});

test("conversation over the length cap rejected — never reaches OpenAI", () => {
  const messages = Array.from({ length: CHAT_LIMITS.maxMessages + 1 }, (_, i) => ({
    role: i % 2 === 0 ? "user" : "assistant",
    content: `message ${i}`,
  }));
  const r = validateChatRequestBody({ messages });
  assert.equal(r.ok, false);
});

test("message over the length cap rejected", () => {
  const r = validateChatRequestBody({
    messages: [{ role: "user", content: "a".repeat(CHAT_LIMITS.maxMessageLength + 1) }],
  });
  assert.equal(r.ok, false);
});

test("empty message content rejected", () => {
  const r = validateChatRequestBody({ messages: [{ role: "user", content: "   " }] });
  assert.equal(r.ok, false);
});

test("malformed message (missing role) rejected", () => {
  const r = validateChatRequestBody({ messages: [{ content: "hi" }] });
  assert.equal(r.ok, false);
});

test("invalid role rejected", () => {
  const r = validateChatRequestBody({ messages: [{ role: "system", content: "hi" }] });
  assert.equal(r.ok, false);
});

test("last message must be from the user, not the assistant", () => {
  const r = validateChatRequestBody({
    messages: [
      { role: "user", content: "Hi" },
      { role: "assistant", content: "Hello!" },
    ],
  });
  assert.equal(r.ok, false);
});

test("content is trimmed", () => {
  const r = validateChatRequestBody({ messages: [{ role: "user", content: "  hi there  " }] });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.messages[0].content, "hi there");
});
