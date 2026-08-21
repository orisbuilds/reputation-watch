# Reputation Watch — Backend Setup

This turns the static prototype into a working product: the patient scan page
records scans and sends complaint emails, and the dentist dashboard shows real
numbers and a real complaints inbox.

**Stack (all free tier):** Cloudflare Worker (API) + Cloudflare D1 (database) + Resend (email).
Your pages stay on GitHub Pages; they just call the Worker.

You'll need, all free:
- A **Cloudflare** account — https://dash.cloudflare.com/sign-up
- A **Resend** account + API key — https://resend.com
- **Node.js** installed locally — https://nodejs.org (LTS)

Everything below is run from the `api/` folder of your repo.

---

## 1. Install the Cloudflare CLI and log in

```bash
cd api
npm install                 # installs wrangler (from package.json)
npx wrangler login          # opens your browser to authorize Cloudflare
```

## 2. Create the database

```bash
npx wrangler d1 create reputation-watch
```

This prints a `database_id`. Open **`wrangler.toml`** and paste it in, replacing
`PASTE_YOUR_D1_DATABASE_ID_HERE`.

Then create the tables:

```bash
npm run db:init             # applies schema.sql to the remote D1 database
```

## 3. Add your secrets

```bash
# Your Resend API key (from the Resend dashboard → API Keys)
npx wrangler secret put RESEND_API_KEY

# Any long random string — this protects creating new dentists.
# Generate one, save it somewhere safe, and paste it when prompted:
#   node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
npx wrangler secret put ADMIN_TOKEN
```

Optional, in `wrangler.toml` under `[vars]`:
- `FROM_EMAIL` — keep `onboarding@resend.dev` for testing. To send from your own
  address (e.g. `alerts@yourdomain.com`) you must verify that domain in Resend first.
- `DASHBOARD_URL` — the link shown inside complaint emails (already set to your Pages URL).

## 4. Deploy the API

```bash
npm run deploy
```

Wrangler prints your Worker URL, e.g.
`https://reputation-watch-api.YOURNAME.workers.dev`. **Copy it.**

Quick check:

```bash
curl https://reputation-watch-api.YOURNAME.workers.dev/api/health
# -> {"ok":true,"service":"reputation-watch"}
```

## 5. Point the front-end at the API

Edit two files in the repo root and set `API_BASE` to your Worker URL:

- **`scan.html`** — near the bottom, in the CONFIG block:
  ```js
  const API_BASE = "https://reputation-watch-api.YOURNAME.workers.dev";
  ```
- **`dashboard.html`** — same idea in its CONFIG block. Also confirm
  `SCAN_PAGE_URL` points at your live scan page
  (`https://orisbuilds.github.io/reputation-watch/scan.html`).

Commit and push both files (GitHub Pages redeploys automatically). While
`API_BASE` is `""`, both pages stay in demo mode — so you can flip them live only
when you're ready.

## 6. Add your first dentist

Dentists are created with one authenticated call (using the `ADMIN_TOKEN` from step 3):

```bash
curl -X POST https://reputation-watch-api.YOURNAME.workers.dev/api/dentist \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "practice_name": "Austin Family Dentistry",
    "doctor_name": "Dr. Diemer",
    "email": "front-desk@austinfamilydds.com",
    "google_url": "https://maps.app.goo.gl/GPyNaVBRgWNgP6ht5"
  }'
```

The response includes:
- `slug` — the practice's id (e.g. `austin-family-dentistry`)
- `access_token` — **the dentist's dashboard password. Give it to them; store it safely. It is shown only once.**

Their pages are then:
- Patient QR target → `https://orisbuilds.github.io/reputation-watch/scan.html?p=SLUG`
- Dashboard login → the dashboard page, signing in with their **email + access key**

Generate the printable QR from inside the dashboard (it encodes the `?p=SLUG` URL).

---

## How the pieces connect

```
Patient phone ── scan QR ──> scan.html?p=slug
      │  taps "good"  ─────────────────────────► POST /api/track {happy}  ──► D1 events
      │  taps "not right" → form → submit ─────► POST /api/complaint      ──► D1 complaints
      │                                                     └── Resend ──► dentist's inbox
Dentist ── dashboard.html ── login (email+key) ─► POST /api/login
                              stats  ───────────► GET  /api/stats?slug   (Bearer key)
                              inbox  ───────────► GET  /api/complaints    (Bearer key)
                              save   ───────────► PUT  /api/dentist       (Bearer key)
```

## Endpoint reference

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET  | `/api/health` | — | health check |
| POST | `/api/track` | — | record `scan` / `happy` / `unhappy` |
| POST | `/api/complaint` | — | store complaint + email the dentist |
| POST | `/api/login` | — | validate email + access key |
| GET  | `/api/stats?slug=` | Bearer key | scan/happy/unhappy/complaint counts |
| GET  | `/api/complaints?slug=` | Bearer key | complaint list |
| PUT  | `/api/dentist` | Bearer key | update own doctor/email/Google link |
| POST | `/api/dentist` | Bearer **ADMIN_TOKEN** | create a dentist |

## Notes & limits

- **Free tiers** cover far more than a few dental practices need (D1: millions of
  reads/month; Resend: thousands of emails/month; Workers: 100k requests/day).
- **Access key = password.** This is a deliberately simple v1 auth. A natural
  upgrade later is emailed magic-link login instead of a stored key.
- **CORS is open** (`*`) so the static site can call the API. Fine for this design;
  tighten to your Pages origin if you prefer.
- **Local testing:** `npm run dev` runs the Worker locally; `npm run db:init-local`
  seeds a local copy of the database.
