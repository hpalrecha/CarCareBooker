import { test, before } from "node:test";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import esbuild from "esbuild";
import assert from "node:assert/strict";
import fs from "node:fs";
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let withholdUnverifiedClaims, withholdUnverifiedFromProse, isUnverifiedClaim, displayableIncludes, displayableFaqs;
before(async () => {
  const dir = path.join(repoRoot, "node_modules", ".cache");
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, "unverified-claims-t.mjs");
  await esbuild.build({ entryPoints: [path.join(repoRoot, "client/src/lib/withheld-claims.ts")], bundle: true, format: "esm", platform: "node", outfile: out, logLevel: "silent" });
  ({ withholdUnverifiedClaims, withholdUnverifiedFromProse, isUnverifiedClaim, displayableIncludes, displayableFaqs } = await import(pathToFileURL(out).href + "?t=" + Date.now()));
});

const ceramic = {
  slug: "1-year-ceramic-coating",
  description: "Transform your car. Our professional-grade 9H hardness ceramic coating creates a hydrophobic layer. It is applied in the studio.",
  whyChoose: "Long protection. The 9H hardness rating means superior scratch resistance. Less maintenance.",
  heroSubtitle: "Professional Ceramic Coating with 9H Hardness & Hydrophobic Technology",
  metaDescription: "Book our 1-Year Ceramic Coating (9H hardness) today. Hydrophobic finish.",
  whatIncluded: ["Professional-grade 9H hardness ceramic coating application", "Complete paint correction and decontamination before coating", "UV protection"],
  process: [
    { step: 1, title: "Decontamination", description: "Foam wash and clay bar." },
    { step: 2, title: "Application", description: "Our certified technicians carefully apply the coating. It is done panel by panel." },
  ],
  faq: [
    { question: "How long does the ceramic coating last?", answer: "About 12 months with proper care." },
    { question: "How is this different from regular wax?", answer: "Wax lasts weeks. Ceramic coating creates a permanent bond with your paint." },
    { question: "Is the coating safe for my car paint?", answer: "Absolutely! Our ceramic coating is 100% safe and enhances protection." },
    { question: "Will it prevent all scratches?", answer: "While our 9H hardness coating helps with swirl marks, it cannot stop deep scratches." },
  ],
};

test("every claim the owner asked to hide is recognised", () => {
  for (const t of ["100% safe", "100 % safe", "permanent bond", "Permanent  Bond", "certified technicians", "Certified technician", "9H hardness", "a 9H coating"]) assert.equal(isUnverifiedClaim(t), true, t);
  for (const t of ["9 hours", "98H", "safe for your paint", "technicians", "bonded", "certified manufacturer"]) assert.equal(isUnverifiedClaim(t), false, t);
});

test("the record loses the claims and keeps everything else", () => {
  const r = withholdUnverifiedClaims(ceramic);
  const all = JSON.stringify(r);
  assert.equal(/9H|100\s*%\s*safe|permanent\s+bond|certified\s+technician/i.test(all), false, all);
  assert.equal(r.description, "Transform your car. It is applied in the studio.");
  assert.equal(r.whyChoose, "Long protection. Less maintenance.");
  assert.equal(r.heroSubtitle, "");
  assert.equal(r.metaDescription, "Book our 1-Year Ceramic Coating today. Hydrophobic finish.");
  assert.deepEqual(r.whatIncluded, ["Complete paint correction and decontamination before coating", "UV protection"]);
  assert.equal(r.process.length, 2);
  assert.equal(r.process[1].description, "It is done panel by panel.");
  assert.deepEqual(r.faq.map((f) => f.question), ["How long does the ceramic coating last?"]);
});

test("nothing is added: every remaining sentence existed before", () => {
  const r = withholdUnverifiedClaims(ceramic);
  const before = JSON.stringify(ceramic);
  for (const s of r.description.split(". ")) assert.ok(before.includes(s.replace(/\.$/, "")), s);
});

test("the original object is not mutated, and a clean record is returned as is", () => {
  const copy = JSON.parse(JSON.stringify(ceramic));
  withholdUnverifiedClaims(ceramic);
  assert.deepEqual(ceramic, copy);
  const clean = { slug: "x", description: "Nothing to see.", whatIncluded: ["a"], faq: [] };
  assert.equal(withholdUnverifiedClaims(clean), clean);
  assert.equal(withholdUnverifiedClaims(null), null);
  assert.equal(withholdUnverifiedFromProse("Clean sentence."), "Clean sentence.");
});

test("the landing-page filters drop the same claims", () => {
  assert.deepEqual(displayableIncludes(ceramic.whatIncluded), ["Complete paint correction and decontamination before coating", "UV protection"]);
  assert.deepEqual(displayableFaqs(ceramic.faq).map((f) => f.question), ["How long does the ceramic coating last?"]);
});

test("the public service endpoints and the server HTML go through the filter; the admin endpoint does not", () => {
  const routes = fs.readFileSync(new URL("../server/routes.ts", import.meta.url), "utf8");
  const pub = routes.slice(routes.indexOf('app.get("/api/services", async'), routes.indexOf('app.get("/api/admin/services"'));
  assert.match(pub, /withholdUnverifiedClaims/);
  const one = routes.slice(routes.indexOf('app.get("/api/services/:id"'), routes.indexOf('app.post("/api/services", authenticateAdmin'));
  assert.match(one, /withholdUnverifiedClaims/);
  const admin = routes.slice(routes.indexOf('app.get("/api/admin/services"'), routes.indexOf('app.get("/api/services/:id"'));
  assert.doesNotMatch(admin, /withholdUnverifiedClaims/, "the admin list must stay raw so editing never saves a filtered copy");
  const vite = fs.readFileSync(new URL("../server/vite.ts", import.meta.url), "utf8");
  assert.match(vite, /withholdUnverifiedClaims/);
});
