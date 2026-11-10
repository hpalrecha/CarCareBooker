import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import { goneForSpamPaths } from "../server/middleware/gone-paths.ts";
import { stripTrailingSlash } from "../server/middleware/trailing-slash.ts";

// Same order as server/index.ts.
function start() {
  const app = express();
  app.use(goneForSpamPaths);
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
      res.on("end", () =>
        resolve({ status: res.statusCode, robots: res.headers["x-robots-tag"], location: res.headers.location }),
      );
    });
    req.on("error", reject);
    req.end();
  });
}

test("spam URLs answer 410 + X-Robots-Tag: noindex with or without a trailing slash", async () => {
  const { server, port } = await start();
  try {
    for (const p of [
      "/Para-Trompeta-Negro-Guatemala-341053",
      "/Para-Trompeta-Negro-Guatemala-341053/",
      "/Fascitis-Plantar-Alivio-Y-Comodidad-Para-Tus-Pies-685443",
      "/Proscenic-P15-Aspirateur-Balai-Sans-Fil-580W-50Kpa-70Min-341199?utm=x",
      "/Plegable-Y-Tablero-Werzalit-Malibu00fa-Garden-859029",
      "/Tirador-De-Puerta-De-Armario-Tipo-T-Plateado-Herraj-Para-Muebl-884439",
      "/le48",
      "/le48/",
    ]) {
      for (const method of ["GET", "HEAD"]) {
        const r = await request(port, p, method);
        assert.equal(r.status, 410, `${method} ${p}`);
        assert.equal(r.robots, "noindex", `${method} ${p}`);
      }
    }
  } finally {
    server.close();
  }
});

test("real routes, typos and non-GET requests are left alone", async () => {
  const { server, port } = await start();
  try {
    assert.equal((await request(port, "/services")).status, 200);
    assert.equal((await request(port, "/service/ppf-suv")).status, 200);
    assert.equal((await request(port, "/some-page-12345")).status, 200);
    assert.equal((await request(port, "/Para-Trompeta-Negro-Guatemala-341053", "POST")).status, 200);
    assert.deepEqual(await request(port, "/ppf/"), { status: 301, robots: undefined, location: "/ppf" });
  } finally {
    server.close();
  }
});

function fetchRaw(port, path) {
  return new Promise((resolve, reject) => {
    http
      .get({ port, path }, (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
      })
      .on("error", reject);
  });
}

test("the 410 is a minimal text/html page with noindex, no redirect and no app shell", async () => {
  const { server, port } = await start();
  try {
    for (const p of ["/Para-Trompeta-Negro-Guatemala-341053", "/Para-Trompeta-Negro-Guatemala-341053/", "/le48"]) {
      const r = await fetchRaw(port, p);
      assert.equal(r.status, 410, p);
      assert.match(r.headers["content-type"], /^text\/html/, p);
      assert.equal(r.headers["x-robots-tag"], "noindex", p);
      assert.equal(r.headers.location, undefined, p);
      assert.match(r.body, /<h1>410 Gone<\/h1>/, p);
      assert.doesNotMatch(r.body, /<script|<a |<link|id="root"/i, p);
    }
  } finally {
    server.close();
  }
});
