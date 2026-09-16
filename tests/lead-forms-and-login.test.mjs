/**
 * Every form on this site that a person actually types into: the staff login, and the
 * quote form on the service pages.
 *
 * The rule these tests exist to defend was learned the expensive way. A form that spells
 * `type="email"` inside a `<form>` WITHOUT `noValidate` never submits when the value is
 * malformed: the browser's own constraint check cancels the submit event before
 * react-hook-form sees it, so zod never runs and none of the messages below the fields
 * ever render. It looks exactly like a dead button. Both forms here carry `noValidate`
 * and both were confirmed in a real browser to show their messages.
 *
 * The second rule is about colour. `text-deep-black`, `text-neon-green` and
 * `border-medium-gray` emit NO CSS in this project — tailwind.config.ts explains why at
 * length. The login button used to spell `text-deep-black` on `bg-neon-green` and so
 * rendered near-white on bright green, about 1.4:1. Nothing here may name those classes.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(repoRoot, p), 'utf8');
/** Comments stripped, so "must not contain X" matches code and not the prose explaining X. */
const code = (p) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const login = code('client/src/pages/admin-login.tsx');
const quote = code('client/src/components/quote-form.tsx');
const schema = read('shared/schema.ts');

/** Classes Tailwind is not configured to generate here. Naming one is a silent no-op. */
const DEAD_CLASSES = ['text-deep-black', 'text-neon-green', 'border-neon-green', 'border-medium-gray', 'hover:border-neon-green'];

describe('forms submit at all', () => {
  for (const [name, src] of [['the staff login', login], ['the service-page quote form', quote]]) {
    test(`${name} disables native validation, so zod's messages are the ones shown`, () => {
      assert.match(src, /<form[\s\S]{0,400}noValidate/, 'without noValidate a bad email silently blocks submit');
      // And it must still actually be wired to a resolver, or noValidate would leave it unvalidated.
      assert.match(src, /zodResolver\(/);
    });

    test(`${name} renders a message slot for every field it validates`, () => {
      const fields = (src.match(/name="(\w+)"/g) || []).length;
      const messages = (src.match(/<FormMessage \/>/g) || []).length;
      assert.ok(messages > 0, 'no FormMessage means errors are invisible');
      assert.ok(messages <= fields, 'more message slots than fields suggests a copy/paste stray');
    });
  }
});

describe('the staff login screen', () => {
  test('lets you see the password you typed', () => {
    assert.match(login, /data-testid="button-toggle-password"/);
    assert.match(login, /type=\{revealed \? "text" : "password"\}/);
    assert.match(login, /useState\(false\)/, 'the password must start hidden');
  });

  test('the reveal control is a button, not a submit', () => {
    // A bare <button> inside a <form> submits it. Revealing a password must not log you in.
    const toggle = login.slice(login.indexOf('data-testid="button-toggle-password"') - 800, login.indexOf('data-testid="button-toggle-password"'));
    assert.match(toggle, /type="button"/);
  });

  test('the reveal control says what it does, and what state it is in', () => {
    assert.match(login, /aria-label=\{revealed \? "Hide password" : "Show password"\}/);
    assert.match(login, /aria-pressed=\{revealed\}/);
  });

  test('warns about Caps Lock, the commonest cause of a rejected correct password', () => {
    assert.match(login, /getModifierState\("CapsLock"\)/);
    assert.match(login, /aria-live="polite"/);
  });

  test('a failed attempt clears the password but keeps the email', () => {
    assert.match(login, /form\.setValue\("password", ""\)/);
    assert.doesNotMatch(login, /form\.setValue\("email", ""\)/);
  });

  test('never names a Tailwind class this project does not generate', () => {
    for (const dead of DEAD_CLASSES) {
      assert.ok(!login.includes(dead), `${dead} emits no CSS — see tailwind.config.ts`);
    }
    // The submit label must be dark on the bright green fill.
    assert.match(login, /bg-\[var\(--neon-green\)\][^"]*text-black|text-black[^"]*bg-\[var\(--neon-green\)\]/);
  });

  test('offers one heading, not two saying the same thing', () => {
    assert.equal((login.match(/<h1\b/g) || []).length, 1);
    assert.equal((login.match(/<h2\b/g) || []).length, 0);
    assert.ok(!login.includes('Access Dashboard'), 'the old second heading');
  });

  test('every control is at least 44px tall', () => {
    const inputs = login.split('<Input').slice(1).map((chunk) => chunk.slice(0, chunk.indexOf('/>')));
    assert.equal(inputs.length, 2, 'email and password');
    for (const i of inputs) assert.match(i, /min-h-\[44px\]/);
    assert.match(login, /data-testid="button-login"/);
    assert.match(login.slice(0, login.indexOf('data-testid="button-login"')).slice(-500), /min-h-\[44px\]/);
    // The reveal button is h-11 = 44px.
    assert.match(login, /h-11 w-11/);
  });

  test('password managers can fill it', () => {
    assert.match(login, /autoComplete="username"/);
    assert.match(login, /autoComplete="current-password"/);
  });

  test('nothing about the attempt is logged in the browser', () => {
    assert.doesNotMatch(login, /console\.(log|info|warn|debug)/);
  });

  test('client and server reject the same input with the same words', () => {
    // One schema, imported by the page and parsed by the route.
    assert.match(login, /import \{ adminLoginSchema \} from "@shared\/schema"/);
    assert.match(schema, /email: z\.string\(\)\.email\("Enter a valid email address"\)/);
    assert.match(schema, /password: z\.string\(\)\.min\(6, "Password must be at least 6 characters"\)/);
  });
});

describe('the free-booking offer never reads as a free service', () => {
  /**
   * The studio waives the BOOKING FEE during an offer window. The service still costs
   * what the catalogue says. Any user-facing string that says "free" therefore has to say
   * what is free, or a customer skimming a ₹45,000 PPF page can reasonably conclude the
   * job is. The sticky bar used to read "Free this week — no payment" directly under
   * "Book Your Service", which is exactly that failure.
   */
  const pages = ['client/src/pages/service-landing.tsx', 'client/src/pages/home.tsx'];

  for (const page of pages) {
    test(`${page.split('/').pop()} qualifies every "free"`, () => {
      const src = code(page);
      // JSX string literals only: '...' and "..." on a line, plus template chunks.
      const literals = src.match(/'[^'\n]*'|"[^"\n]*"|`[^`]*`/g) || [];
      // Every way the site has promised "no money", not just the word "free" — an earlier
      // version of this copy said "Pay Nothing Now", which carries exactly the same risk.
      const PROMISES_NO_MONEY = /free|pay nothing|no payment|no cost|complimentary|on the house/i;
      // Naming what is covered — the booking, the reservation, the slot, the second-visit
      // voucher — makes the promise honest. "Free this week" names nothing.
      const NAMES_WHAT = /book|voucher|reserve|slot/i;
      const offenders = literals
        .filter((s) => PROMISES_NO_MONEY.test(s))
        .filter((s) => !NAMES_WHAT.test(s))
        // Not prose: class names, keys and props are not read by customers.
        .filter((s) => !/^['"`][\w-]*$/.test(s) && !/[-_]free|free[-_]/i.test(s));
      assert.deepEqual(offenders, [], 'these say "free" without saying what is free');
    });
  }
});

describe('the service-page quote form', () => {
  test('quotes no prices — the catalogue is the only source of those', () => {
    assert.doesNotMatch(quote, /₹\s?[\d,]+/);
    assert.doesNotMatch(quote, /\b\d{4,}\b/);
  });

  test('reports the lead only once the server has accepted it', () => {
    const onSuccess = quote.slice(quote.indexOf('onSuccess:'), quote.indexOf('onError:'));
    assert.match(onSuccess, /trackLead\(/);
    // Not on button press, and never as a purchase.
    assert.doesNotMatch(quote.replace(onSuccess, ''), /trackLead\(/);
    assert.doesNotMatch(quote, /Purchase/);
  });

  test('carries first-touch attribution rather than rewriting it', () => {
    assert.match(quote, /\.\.\.attributionPayload\(\)/);
  });

  test('says which service page produced the enquiry', () => {
    assert.match(quote, /message: serviceTitle/);
    assert.match(quote, /source: "landing_page"/);
  });

  test('keeps the honeypot hidden from people but present for bots', () => {
    assert.match(quote, /name="website"/);
    assert.match(quote, /className="sr-only"/);
    assert.match(quote, /tabIndex=\{-1\}/);
  });

  test('never implies the service itself is free', () => {
    assert.match(quote, /Booking is free\. Service charges apply at the studio\./);
  });

  test('accepts exactly a ten digit mobile, using the shared check', () => {
    assert.match(quote, /import \{ isValidMobile \} from "@\/lib\/protection-challenge"/);
    assert.match(quote, /\.refine\(isValidMobile/);
  });
});
