import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import { canonicalHost, canonicalHostRedirect } from "../server/middleware/canonical-host.ts";

function start() {
  const app = express();
  app.use(canonicalHost);
  app.all("*", (_req, res) => res.status(200).send("ok"));
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve({ server, port: server.address().port }));
  });
}

function request(port, host, path, method = "GET") {
  return new Promise((resolve, reject) => {
    const req = http.request({ port, path, method, headers: { host } }, (res) => {
      res.resume();
      res.on("end", () => resolve({ status: res.statusCode, location: res.headers.location }));
    });
    req.on("error", reject);
    req.end();
  });
}

test("www redirects every request to the canonical origin", async () => {
  const { server, port } = await start();
  try {
    assert.deepEqual(await request(port, "www.p91carcare.com", "/services?x=1"), {
      status: 301,
      location: "https://p91carcare.com/services?x=1",
    });
    // Unchanged www behaviour: POST and /api are redirected too.
    assert.equal((await request(port, "www.p91carcare.com", "/api/x", "POST")).status, 301);
  } finally {
    server.close();
  }
});

test("booking GET/HEAD redirect, preserving path and query", async () => {
  const { server, port } = await start();
  try {
    assert.deepEqual(
      await request(port, "booking.p91carcare.com", "/services/paint-protection-film-bangalore?utm_source=g"),
      { status: 301, location: "https://p91carcare.com/services/paint-protection-film-bangalore?utm_source=g" },
    );
    assert.deepEqual(await request(port, "booking.p91carcare.com", "/", "HEAD"), {
      status: 301,
      location: "https://p91carcare.com/",
    });
  } finally {
    server.close();
  }
});

test("booking POST and booking /api/* are left alone", async () => {
  const { server, port } = await start();
  try {
    assert.equal((await request(port, "booking.p91carcare.com", "/api/razorpay-webhook", "POST")).status, 200);
    assert.equal((await request(port, "booking.p91carcare.com", "/book", "POST")).status, 200);
    assert.equal((await request(port, "booking.p91carcare.com", "/api/x")).status, 200);
    assert.equal((await request(port, "booking.p91carcare.com", "/api/x", "HEAD")).status, 200);
  } finally {
    server.close();
  }
});

test("canonical host and local dev are left alone", async () => {
  const { server, port } = await start();
  try {
    assert.equal((await request(port, "p91carcare.com", "/services")).status, 200);
    assert.equal((await request(port, "localhost:5000", "/services")).status, 200);
  } finally {
    server.close();
  }
});

test("host match is case-insensitive and ignores a port", async () => {
  const { server, port } = await start();
  try {
    assert.deepEqual(await request(port, "Booking.P91CarCare.com:443", "/blog?page=2"), {
      status: 301,
      location: "https://p91carcare.com/blog?page=2",
    });
    assert.equal((await request(port, "WWW.p91carcare.COM:8080", "/")).status, 301);
    assert.equal((await request(port, "BOOKING.p91carcare.com:443", "/api/x", "POST")).status, 200);
  } finally {
    server.close();
  }
});

test("pure function", () => {
  assert.equal(canonicalHostRedirect("GET", undefined, "/"), null);
  assert.equal(canonicalHostRedirect("GET", "p91carcare.com", "/"), null);
  assert.equal(canonicalHostRedirect("GET", "booking.p91carcare.com", "/api"), null);
  assert.equal(canonicalHostRedirect("GET", "booking.p91carcare.com", "/api?x=1"), null);
  assert.equal(canonicalHostRedirect("GET", "booking.p91carcare.com", "/apixyz"), "https://p91carcare.com/apixyz");
  assert.equal(canonicalHostRedirect("PUT", "booking.p91carcare.com", "/x"), null);
  assert.equal(canonicalHostRedirect("POST", "www.p91carcare.com", "/api/x"), "https://p91carcare.com/api/x");
  assert.equal(canonicalHostRedirect("GET", "evil.p91carcare.com.attacker.net", "/"), null);
});

test("trailing slash is stripped in the same hop (GET/HEAD only)", () => {
  assert.equal(canonicalHostRedirect("GET", "booking.p91carcare.com", "/services/?x=1"), "https://p91carcare.com/services?x=1");
  assert.equal(canonicalHostRedirect("HEAD", "www.p91carcare.com", "/services//"), "https://p91carcare.com/services");
  assert.equal(canonicalHostRedirect("GET", "booking.p91carcare.com", "/"), "https://p91carcare.com/");
  assert.equal(canonicalHostRedirect("GET", "booking.p91carcare.com", "//evil.com/"), "https://p91carcare.com/evil.com");
  assert.equal(canonicalHostRedirect("POST", "www.p91carcare.com", "/api/x/"), "https://p91carcare.com/api/x/");
});
