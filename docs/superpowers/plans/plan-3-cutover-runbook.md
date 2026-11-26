# Plan 3 cutover runbook: the new site on p91carcare.com

For the owner, in the Lightsail browser SSH session (`p91-apps`, Ubuntu, nginx 1.24). Every step lists:
the command, what you should see, how to check it, and how to undo it. Paste the output to Claude
whenever something does not look like the "expect" line, and stop there.

What changes: nginx sends every page to the new site's container (`carcarebooker-web`, 127.0.0.1:8085),
except the API, admin, uploads, images and the old online booking pages (`/service/*`), which stay on
the existing container (`carcarebooker`, 127.0.0.1:8084). The routing is in
`deploy/nginx/p91carcare.locations.conf`. The API container itself is not touched by this runbook.

---

## Before the cutover: merge and push (Claude or the owner, on a dev machine)

The branch `feat/cutover` holds the new site's redirects, booking buttons, analytics, its image build,
and the API change that makes `/service/*` pages `noindex` with a canonical to the new pages.

1. Merge `feat/cutover` into `main` and push `main`. That starts two GitHub Actions builds:
   - `build-image` (API image, ~20 min). The host's auto-deploy then deploys it on its own. From that
     moment the old `/service/*` pages say `noindex` and point their canonical at `/services/...` URLs
     that only exist once step 4 below is done. **So do the cutover the same day, as soon as the web
     image exists.** (The pages keep working for customers either way; only Google sees the gap.)
   - `build-web-image` (new site image, ~5-10 min): `ghcr.io/hpalrecha/carcarebooker-web:<sha>`.
2. Wait for both to be green in the repository's Actions tab, and for the API auto-deploy to finish
   (`sudo tail -n 20 /var/log/p91-auto-deploy.log` on the host shows `deployed <sha>`).
3. Pick a time **not between 19:45 and 20:15 IST** (the API sends WhatsApp reminders at 20:00 IST).

---

## Step 0. Time check

```bash
TZ=Asia/Kolkata date '+%H:%M IST'
```
- Expect: a time outside 19:45-20:15. If inside, wait. (`deploy-web.sh` also refuses that window.)
- Rollback: nothing changed.

## Step 1. Find the vhost and back it up

```bash
sudo grep -rln "p91carcare.com" /etc/nginx/sites-enabled/
```
- Expect: one file (for example `/etc/nginx/sites-enabled/p91carcare`). If several, paste the list to
  Claude and stop. Then set it (use the REAL path the symlink points to):
```bash
VHOST="$(readlink -f /etc/nginx/sites-enabled/<the file you found>)"; echo "$VHOST"
sudo cp -a "$VHOST" "$VHOST.bak-$(date +%Y%m%d-%H%M%S)"
ls -l "$VHOST"*
```
- Verify: the `.bak-<date>` copy is listed next to the file, same size.
- Rollback: nothing changed yet. Keep the backup name; step 6 uses it.

## Step 2. Start the new site's container (no traffic yet)

The host checkout (`/home/ubuntu/CarCareBooker`, the one `deploy-manual.sh` uses) may sit on an old
branch (see `scripts/auto-deploy.sh`), so take the script from `origin/main` instead of `git pull`:

```bash
cd /home/ubuntu/CarCareBooker
git fetch origin main
git show origin/main:scripts/deploy-web.sh > /tmp/deploy-web.sh
sudo bash /tmp/deploy-web.sh                 # dry-run: prints the plan, changes nothing
```
- Expect: `MODE: DRY-RUN`, the commit it picked, `would pull ghcr.io/hpalrecha/carcarebooker-web:<sha>`,
  a candidate on `127.0.0.1:18085`, then `carcarebooker-web` on `127.0.0.1:8085`, `DRY-RUN COMPLETE`.
  An `ABORT` line: paste it to Claude and stop.
```bash
sudo bash /tmp/deploy-web.sh --execute
```
- Expect: `ok` for `/` (title with P91), `/services/paint-protection-film` and `/sitemap.xml`, twice
  (candidate, then production), then `DEPLOYED web <sha> on 127.0.0.1:8085`.
  Exit 75 with "not in the registry yet": the image build is still running; retry in 10 minutes.
- Verify:
```bash
curl -s 127.0.0.1:8085/ | grep -o "<title>[^<]*"
curl -s -o /dev/null -w "%{http_code}\n" 127.0.0.1:8085/services/paint-protection-film    # 200
sudo docker ps --filter name=carcarebooker --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
  Expect the new title, 200, and both `carcarebooker` (8084) and `carcarebooker-web` (8085) Up.
- Rollback: the public site is unchanged (nginx still sends everything to 8084). To remove the
  container: `sudo docker rm -f carcarebooker-web`.

## Step 3. Show the current `location /` block (paste it to Claude before step 4)

```bash
sudo grep -n "server_name\|listen\|location" "$VHOST"
sudo awk '/location \/ *\{/,/^[[:space:]]*\}/' "$VHOST"
```
- Expect: the apex HTTPS server (`listen 443`, `server_name p91carcare.com`) has one `location / { ... }`
  with `proxy_pass http://127.0.0.1:8084;` and some `proxy_set_header` lines.
- **Paste both outputs to Claude.** If that block has anything besides `proxy_pass`, `proxy_http_version`
  and `proxy_set_header` (for example `client_max_body_size`, `proxy_read_timeout`, `Upgrade` headers),
  Claude adds the same lines to every 8084 location of the snippet first; the step 4 script refuses
  to continue while such lines exist, so nothing is lost by accident.
- Rollback: read-only.

## Step 4. Install the routing and reload nginx

Copy the snippet from `origin/main`:
```bash
git -C /home/ubuntu/CarCareBooker show origin/main:deploy/nginx/p91carcare.locations.conf | sudo tee /etc/nginx/snippets/p91carcare.locations.conf >/dev/null
sudo head -3 /etc/nginx/snippets/p91carcare.locations.conf
```
- Expect: the first lines read `# p91carcare.com routing after the Plan 3 cutover.`

Replace the apex `location / { ... }` with one `include` line. This script edits only that block, and
refuses (changing nothing) if it cannot find exactly one apex HTTPS server with exactly one
`location /`, if the block has directives beyond proxy_pass / proxy_http_version / proxy_set_header,
or if the server already has a location the snippet defines:

```bash
sudo VHOST="$VHOST" python3 - <<'PY'
import os, re, sys
path = os.environ["VHOST"]; text = open(path).read()
def block_end(s, open_brace):
    depth = 0
    for i in range(open_brace, len(s)):
        if s[i] == "{": depth += 1
        elif s[i] == "}":
            depth -= 1
            if depth == 0: return i
    sys.exit("ABORT: unbalanced braces")
servers = []
for m in re.finditer(r"(?m)^\s*server\s*\{", text):
    end = block_end(text, m.end() - 1); body = text[m.end():end]
    names = re.findall(r"server_name\s+([^;]+);", body)
    if re.search(r"listen\s+[^;]*443", body) and any("p91carcare.com" in n.split() for n in names):
        servers.append((m.end(), end))
if len(servers) != 1: sys.exit(f"ABORT: found {len(servers)} apex HTTPS server blocks, expected 1; nothing changed")
start, end = servers[0]; body = text[start:end]
locs = list(re.finditer(r"(?m)^[ \t]*location\s+/\s*\{", body))
if len(locs) != 1: sys.exit(f"ABORT: found {len(locs)} 'location /' blocks, expected 1; nothing changed")
ls = start + locs[0].start(); le = block_end(text, start + locs[0].end() - 1)
inner = text[start + locs[0].end():le]
extra = [l.strip() for l in inner.splitlines() if l.strip() and not l.strip().startswith("#")
         and not re.match(r"(proxy_pass|proxy_http_version|proxy_set_header)\s", l.strip())]
if extra: sys.exit("ABORT: location / has extra directives; send these to Claude first:\n  " + "\n  ".join(extra))
snippet = open("/etc/nginx/snippets/p91carcare.locations.conf").read()
mine = set(re.findall(r"(?m)^location\s+(.+?)\s*\{", snippet))
theirs = set(m.strip() for m in re.findall(r"(?m)^\s*location\s+(.+?)\s*\{", body)) - {"/"}
if mine & theirs: sys.exit(f"ABORT: the server already has {sorted(mine & theirs)}; send the vhost to Claude")
indent = re.match(r"[ \t]*", text[ls:]).group(0)
new = text[:ls] + indent + "include snippets/p91carcare.locations.conf;" + text[le + 1:]
open(path, "w").write(new)
print("OK: replaced the apex 'location /' block with the include. Removed block was:\n" + text[ls:le + 1])
PY
sudo nginx -t
```
- Expect: `OK: replaced ...` (it prints the block it removed), then `syntax is ok` and
  `test is successful`. Any `ABORT` line: nothing was changed; paste it to Claude.
  If `nginx -t` fails: do NOT reload; run the rollback below.
```bash
sudo systemctl reload nginx
```
- Verify: `sudo grep -n "include snippets/p91carcare.locations.conf" "$VHOST"` shows one line.
- Rollback (one command):
```bash
sudo cp -a "$(ls -t "$VHOST".bak-* | head -1)" "$VHOST" && sudo nginx -t && sudo systemctl reload nginx
```

## Step 5. Verify from outside

Run on the host (or any machine). Each line says what to expect.

```bash
curl -s https://p91carcare.com/ | grep -o "<title>[^<]*"                       # PPF and Ceramic Coating in Bangalore | P91 Car Care
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://p91carcare.com/ppf   # 308 https://p91carcare.com/services/paint-protection-film
curl -s -o /dev/null -w "%{http_code}\n" https://p91carcare.com/services/paint-protection-film   # 200
curl -s https://p91carcare.com/service/ppf-hatchback | grep -o '<meta name="robots"[^>]*>\|<link rel="canonical"[^>]*>'
#   200 page with: <meta name="robots" content="noindex,follow" /> and canonical https://p91carcare.com/services/paint-protection-film
curl -s -o /dev/null -w "%{http_code}\n" https://p91carcare.com/api/services       # 200
curl -s -o /dev/null -w "%{http_code}\n" https://p91carcare.com/admin              # 200 (then log in at /admin/login in a browser)
curl -s https://p91carcare.com/sitemap.xml | grep -c "/services/"                  # a number above 10 (new URLs)
curl -s https://p91carcare.com/sitemap.xml | grep -c "/service/"                   # 0 (no old booking pages)
curl -s -o /dev/null -w "%{http_code}\n" https://p91carcare.com/le48               # 410
curl -s -o /dev/null -w "%{http_code}\n" https://p91carcare.com/favicon.ico        # 200
curl -s -o /dev/null -w "%{http_code}\n" https://p91carcare.com/73e676a76120792878e9f414cf8dc6b9.txt   # 200 (IndexNow key)
```
In a browser: open the home page, click "Book online" on the PPF page, and make sure the old booking
page loads with its vehicle selector and the payment button (do not pay).

If the home page still shows the old site: Cloudflare may hold a cached copy. Purge the cache for
`https://p91carcare.com/` in Cloudflare (Caching, Purge, Custom purge), then re-check.

- Rollback: step 6.

## Step 6. Full rollback

```bash
# nginx back to "everything to 8084" (the backup from step 1)
sudo cp -a "$(ls -t "$VHOST".bak-* | head -1)" "$VHOST" && sudo nginx -t && sudo systemctl reload nginx
curl -s https://p91carcare.com/ | grep -o "<title>[^<]*"        # the old home page title again
# optional: stop the new site's container (harmless to leave running; nothing routes to it)
sudo docker rm -f carcarebooker-web
```
The API container and its data were not touched by this runbook, so nothing else needs undoing.
The `/service/*` noindex change is part of the API image; to undo it, revert that commit on `main`
(auto-deploy redeploys the API).

## Later web deploys (until auto-deploy covers the web image, Plan 3b)

After each push that changes `apps/web`, `packages/content` or `packages/domain`, once
`build-web-image` is green:
```bash
cd /home/ubuntu/CarCareBooker && git fetch origin main && git show origin/main:scripts/deploy-web.sh > /tmp/deploy-web.sh
sudo bash /tmp/deploy-web.sh --execute
```
It prints its own rollback line at the end:
`sudo docker rm -f carcarebooker-web && sudo docker rename carcarebooker-web-previous carcarebooker-web && sudo docker start carcarebooker-web`.

## Notes

- The web container needs no env file and no volumes. `API_ORIGIN=https://p91carcare.com` is set in
  the image; its 5-minute page refreshes read the public API (GET only) through Cloudflare and nginx.
  Pointing it at `http://127.0.0.1:8084` is not possible from inside the container without host
  networking, and the public URL keeps the same path the browser uses, so it stays as is.
- API deploys (`deploy-manual.sh`) verify the public site through `/service/ppf-hatchback` and `/api/*`,
  which stay on the API container, so they keep passing after the cutover.
- The favicon, manifest, Bing verification file and IndexNow key stay on the API container for both sites.
