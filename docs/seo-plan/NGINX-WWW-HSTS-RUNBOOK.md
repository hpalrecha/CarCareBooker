# Runbook: add HSTS to the www host in nginx (prepared, not applied)

Date: 20 November 2026. Approved decision: resolve the `www` HSTS warning **through nginx**. Do **not** enable `includeSubDomains` or `preload`.

**Status: not applied.** nginx lives on the Lightsail host (`p91-apps`, nginx 1.24.0 on Ubuntu). This machine has no SSH key to it, and no change is made without your explicit go-ahead. The runbook follows the same pattern as `p91-admin-redirect-lightsail.md`: find the file, back it up, edit one block, test, reload, verify, roll back if needed.

## What was verified (20 Nov)

| Host | Served by | Response | HSTS header |
|---|---|---|---|
| `https://p91carcare.com/` | Cloudflare | 200 | `strict-transport-security: max-age=15552000` (180 days, no `includeSubDomains`, no `preload`) |
| `https://www.p91carcare.com/` | **nginx on the origin** (`Server: nginx/1.24.0 (Ubuntu)`) | 301 to `https://p91carcare.com/` | **none** |
| `http://www.p91carcare.com/` | nginx on the origin | 301 to `https://p91carcare.com/` | n/a (a browser ignores HSTS on plain HTTP) |
| `https://booking.p91carcare.com/` | Cloudflare | 301 to the apex | not examined, not part of this change |

So the `www` name is answered directly by nginx, not proxied by Cloudflare. The header only matters on the **HTTPS** `www` response.

## The change

Add one line inside the `server { ... }` block that listens on 443 for `www.p91carcare.com`, matching the apex value exactly:

```nginx
add_header Strict-Transport-Security "max-age=15552000" always;
```

- `always` makes nginx send it on the 301 as well (without it, nginx only adds headers to 2xx and 3xx codes it lists, and the redirect would be skipped in some setups).
- `max-age=15552000` is the value Cloudflare already sends on the apex, so the two hosts agree.
- **No `includeSubDomains`, no `preload`.** Both stay off until you approve them (the `booking.` host and any mail or other subdomains would be affected).

## Steps (on the host, as a user with sudo)

```bash
# 1. Find the file that holds the www server block
sudo grep -rn "www.p91carcare.com" /etc/nginx/ 2>/dev/null
#    Note the file with `server_name www.p91carcare.com;` inside a `listen 443` block. Call it $VHOST.
VHOST=/etc/nginx/sites-available/<the file you found>

# 2. Back it up (dated copy next to it)
sudo cp -a "$VHOST" "$VHOST.bak-$(date +%Y%m%d-%H%M%S)"

# 3. Check whether the header is already there, and whether other add_header lines exist in that block
sudo grep -n "Strict-Transport-Security\|add_header" "$VHOST"

# 4. Edit: add the add_header line shown above inside the 443 www server block (not in the port-80 block)
sudo nano "$VHOST"

# 5. Test the configuration; it must print "syntax is ok" and "test is successful"
sudo nginx -t

# 6. Reload (no downtime)
sudo systemctl reload nginx
```

If the www block and the apex share one `server { ... }` with several `server_name` values, stop and tell me: adding the header there would also affect the other names, and the change would need to be scoped with a separate block or `if`-free `map`.

## Verify (from any machine; read-only)

```bash
curl -sI https://www.p91carcare.com/ | grep -iE "^HTTP|^location|strict-transport"
#   expect: HTTP/1.1 301 Moved Permanently
#           Location: https://p91carcare.com/
#           strict-transport-security: max-age=15552000
curl -sI https://p91carcare.com/ | grep -i strict-transport       # unchanged: max-age=15552000
curl -sI http://www.p91carcare.com/ | grep -iE "^HTTP|^location"   # still a 301 to the apex
node scripts/post-deploy-smoke.mjs                                  # the three www checks must PASS
```

Then ask the manager to re-crawl: the Semrush flag "No HSTS support" on `https://www.p91carcare.com/` should clear.

## Rollback

```bash
sudo cp -a "$VHOST.bak-<timestamp>" "$VHOST"
sudo nginx -t && sudo systemctl reload nginx
curl -sI https://www.p91carcare.com/ | grep -iE "^HTTP|^location"    # 301 to the apex, as before
```

Nothing else depends on this header, no data is involved, and the application and Cloudflare are untouched, so the rollback is complete after the reload.

## Not part of this change

`includeSubDomains`, `preload`, proxying `www` through Cloudflare (a DNS change), and the HSTS header on `booking.`. Each needs a separate decision.
