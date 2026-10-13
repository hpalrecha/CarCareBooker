#!/usr/bin/env node
/**
 * Tell IndexNow search engines (Bing, Yandex, Naver, Seznam; not Google) which URLs exist or changed.
 *
 *   node scripts/indexnow.mjs            # all URLs in the live sitemap
 *   node scripts/indexnow.mjs /blog/x    # only these paths
 *
 * The key is the file name of the .txt in client/public/ (its content is the same key). The file must
 * be live at https://p91carcare.com/<key>.txt before this runs, so deploy first.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HOST = "p91carcare.com";
const ORIGIN = `https://${HOST}`;
const pub = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "client", "public");
const keyFile = fs.readdirSync(pub).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) throw new Error("no IndexNow key file (32 hex chars .txt) in client/public");
const key = keyFile.replace(/\.txt$/, "");

let urls = process.argv.slice(2).map((p) => (p.startsWith("http") ? p : ORIGIN + p));
if (!urls.length) {
  const xml = await (await fetch(`${ORIGIN}/sitemap.xml`)).text();
  urls = [...xml.matchAll(/<loc>([^<]+)/g)].map((m) => m[1]);
}
const live = await fetch(`${ORIGIN}/${keyFile}`);
if (!live.ok || (await live.text()).trim() !== key) {
  throw new Error(`${ORIGIN}/${keyFile} is not live yet. Deploy first.`);
}
const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key, keyLocation: `${ORIGIN}/${keyFile}`, urlList: urls }),
});
console.log(`IndexNow: ${urls.length} URLs -> HTTP ${res.status} ${res.statusText}`);
if (res.status >= 300) process.exit(1);
