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
      res.on("end", () => resolve({ status: res.statusCode, location: res.headers.location }));
    });
    req.on("error", reject);
    req.end();
  });
}

test("trailing slash is redirected to the no-slash URL", async () => {
  const { server, port } = await start();
  try {
    assert.deepEqual(await request(port, "/services/"), { status: 301, location: "/services" });
    assert.deepEqual(await request(port, "/services/ceramic-coating-bangalore/"), {
      status: 301,
      location: "/services/ceramic-coating-bangalore",
    });
    assert.deepEqual(await request(port, "/blog/?page=2"), { status: 301, location: "/blog?page=2" });
    assert.deepEqual(await request(port, "/blog//"), { status: 301, location: "/blog" });
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
