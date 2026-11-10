import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import { stripTrailingSlash } from "../server/middleware/trailing-slash.ts";

function start() {
  const app = express();
  app.use(stripTrailingSlash);
  app.all("*", (_req, res) => res.status(200).send("ok"));
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve({ server, port: server.address().port }));
  });
}

function request(port, path, method = "GET") {
  return new Promise((resolve, reject) => {
    const req = http.request({ port, path, method }, (res) => {
      res.resume();
      res.on("end", () => resolve({ status: res.statusCode, location: res.headers.location, type: res.headers["content-type"] }));
    });
    req.on("error", reject);
    req.end();
  });
}

test("trailing slash is redirected to the no-slash URL", async () => {
  const { server, port } = await start();
  try {
    const pick = async (p) => { const r = await request(port, p); return { status: r.status, location: r.location }; };
    assert.deepEqual(await pick("/services/"), { status: 301, location: "/services" });
    assert.deepEqual(await pick("/services/ceramic-coating-bangalore/"), {
      status: 301,
      location: "/services/ceramic-coating-bangalore",
    });
    assert.deepEqual(await pick("/blog/?page=2"), { status: 301, location: "/blog?page=2" });
    assert.deepEqual(await pick("/blog//"), { status: 301, location: "/blog" });
  } finally {
    server.close();
  }
});

test("no-slash URLs, the root and non-GET requests are left alone", async () => {
  const { server, port } = await start();
  try {
    assert.equal((await request(port, "/services")).status, 200);
    assert.equal((await request(port, "/")).status, 200);
    assert.equal((await request(port, "/api/razorpay-webhook/", "POST")).status, 200);
  } finally {
    server.close();
  }
});

test("a leading double slash cannot redirect off-site", async () => {
  const { server, port } = await start();
  try {
    const res = await request(port, "//evil.com/");
    assert.equal(res.status, 301);
    assert.equal(res.location, "/evil.com");
  } finally {
    server.close();
  }
});

test("foreign spam slugs with a trailing slash answer 410 directly, not a 301", async () => {
  const { server, port } = await start();
  try {
    for (const p of [
      "/PIZARRA-DE-DIBUJO-12-quot-KOOME-692765/",
      "/Pared-Paneles-Laterales-Para-Cenador-Outsunny-2-Piezas-3x3m-3x6m-125889/",
      "/PABLOSKY-Baby-022820-K-Navy-Mau-Feitio-767381/",
    ]) {
      assert.equal((await request(port, p)).status, 410, p);
    }
    assert.equal((await request(port, "/ppf/")).status, 301);
    assert.equal((await request(port, "/some-page-12345/")).status, 301);
  } finally {
    server.close();
  }
});

test("a path that begins with extra slashes is redirected to the single-slash page, never off-site", async () => {
  const { server, port } = await start();
  try {
    const pick = async (p) => { const r = await request(port, p); return { status: r.status, location: r.location }; };
    // //services used to answer 200 as a second live URL for /services.
    assert.deepEqual(await pick("//services"), { status: 301, location: "/services" });
    assert.deepEqual(await pick("///services/ppf"), { status: 301, location: "/services/ppf" });
    assert.deepEqual(await pick("//services?utm_source=x"), { status: 301, location: "/services?utm_source=x" });
    // The collapsed Location is always a single-slash path on the same host.
    assert.deepEqual(await pick("//evil.com"), { status: 301, location: "/evil.com" });
    assert.deepEqual(await pick("//"), { status: 301, location: "/" });
    // Clean URLs, the root and non-GET requests are untouched.
    assert.equal((await request(port, "/services")).status, 200);
    assert.equal((await request(port, "/")).status, 200);
    assert.equal((await request(port, "//services", "POST")).status, 200);
  } finally {
    server.close();
  }
});

test("spam slugs answer 410 as text/html, as the technical-SEO brief specifies", async () => {
  const { server, port } = await start();
  try {
    const r = await request(port, "/PIZARRA-DE-DIBUJO-12-quot-KOOME-692765/");
    assert.equal(r.status, 410);
    assert.match(r.type, /^text\/html/);
  } finally {
    server.close();
  }
});
