import net from "node:net";
import type { Request } from "express";

/**
 * The real visitor address, behind Cloudflare AND nginx.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────
 * WHY req.ip WAS WRONG. Production is  visitor → Cloudflare → nginx → app.  Express's
 * `trust proxy` is set to 1 (routes.ts), which means "believe ONE proxy hop". With nginx
 * appending the address it saw to X-Forwarded-For, that hop is nginx, and what nginx saw as the
 * client is the Cloudflare EDGE, not the visitor. So req.ip was a Cloudflare address, shared by
 * every visitor that reaches us through that edge, and any per-client quota (rate limits) was one
 * bucket for thousands of people: a busy hour would have shown real customers "Too many attempts".
 *
 * THE FIX, WITHOUT TRUSTING A SPOOFABLE HEADER. Cloudflare sets CF-Connecting-IP to the visitor's
 * address (overwriting anything the visitor sent). That header is only believable when the request
 * really did arrive from Cloudflare, and the proof is the hop nginx recorded: the LAST entry of
 * X-Forwarded-For, which nginx appends and a visitor cannot write. So:
 *
 *   last X-Forwarded-For entry is a Cloudflare address  →  use CF-Connecting-IP
 *   anything else (direct hit on the origin, no header) →  fall back to req.ip, exactly as before
 *
 * Someone hitting the origin directly with a forged CF-Connecting-IP is therefore keyed by their
 * own address, not the forged one.
 *
 * KNOWN LIMIT. If nginx did not forward X-Forwarded-For at all, this cannot see the edge and falls
 * back to req.ip (which then is what nginx recorded). The lasting fix for both cases is at the
 * proxy: nginx `real_ip_header CF-Connecting-IP` with `set_real_ip_from` for the ranges below, and
 * a firewall so the origin only accepts Cloudflare.
 * ─────────────────────────────────────────────────────────────────────────────────────
 *
 * Cloudflare's published ranges, https://www.cloudflare.com/ips-v4 and /ips-v6, checked 2026-09-26.
 * They change rarely; if this list goes stale the effect is the safe fallback (req.ip), never a
 * wrong or spoofable answer.
 */
const CLOUDFLARE_V4 = [
  "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22", "141.101.64.0/18",
  "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20", "197.234.240.0/22", "198.41.128.0/17",
  "162.158.0.0/15", "104.16.0.0/13", "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
];
const CLOUDFLARE_V6 = [
  "2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32", "2405:8100::/32",
  "2a06:98c0::/29", "2c0f:f248::/32",
];

const cloudflare = new net.BlockList();
for (const cidr of CLOUDFLARE_V4) {
  const [addr, prefix] = cidr.split("/");
  cloudflare.addSubnet(addr, Number(prefix), "ipv4");
}
for (const cidr of CLOUDFLARE_V6) {
  const [addr, prefix] = cidr.split("/");
  cloudflare.addSubnet(addr, Number(prefix), "ipv6");
}

/** True when `ip` is one of Cloudflare's published edge addresses. */
export function isCloudflareAddress(ip: string | undefined | null): boolean {
  if (!ip) return false;
  // IPv4-mapped IPv6 ("::ffff:172.71.1.1") is how Node sometimes prints an IPv4 peer.
  const bare = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
  const family = net.isIP(bare);
  if (!family) return false;
  return cloudflare.check(bare, family === 4 ? "ipv4" : "ipv6");
}

const headerValue = (req: Request, name: string): string | undefined => {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v;
};

/** The address to key per-client quotas on. Never throws. */
export function clientIp(req: Request): string {
  try {
    const forwarded = (headerValue(req, "x-forwarded-for") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const lastHop = forwarded[forwarded.length - 1];
    const claimed = headerValue(req, "cf-connecting-ip")?.trim();
    if (claimed && net.isIP(claimed) && isCloudflareAddress(lastHop)) return claimed;
  } catch {
    // fall through to the default
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}
