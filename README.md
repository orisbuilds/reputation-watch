# Chairside

Patient feedback for dental practices — a QR-based **review routing** system.

> **Two names, two jobs.** **Chairside** is the vendor/product name — what dentists (the paying
> customers) see on the dashboard, landing page, and invoices. **"How'd we do?"** is the warm,
> patient-facing label on the scan page only; it's not a company name. On the patient page the
> **dentist's own brand stays dominant** — "How'd we do?" is the friendly question underneath, and
> Chairside appears only as a tiny "powered by" credit.

## What it does

A patient scans a QR code at the front desk and taps whether their visit went well:

- **Happy** → sent to the practice's Google review page to leave a public review.
- **Unhappy** → shown a private feedback form that emails the practice directly, so the
  complaint reaches the office instead of the internet.

It generates its own data (scans, clicks, complaints), so it needs no paid review API. The
gating is deliberately **soft** — it makes the happy path easy but never hides the public
option, and never scripts the review text (see *Safe review-gating* below).

**Status: live.** The backend is deployed (Cloudflare Worker + D1 + Resend). Adding a clinic
is one command; the patient scan page, complaint emails, and the dentist dashboard all run on
real data.

> **Roadmap (not built):** a *review-monitoring* dashboard that reads a practice's existing
> Google reviews, scores sentiment, and drafts responses. A mockup lives in `demo/` but is not
> a live feature and is not linked from the site. Only Google reviews are realistically
> pullable; Yelp/Healthgrades/Facebook block automated access.

## What's in here

| Path | What it is |
|------|-----------|
| `index.html` | Landing / dev hub linking to the pages below. Not sent to clients. |
| `scan.html` | **Patient scan page** (public). Reads `?p=<clinic-code>`, shows that clinic's branding, routes happy → Google / unhappy → private form. |
| `dashboard.html` | **Dentist dashboard** (private). Login, setup fields, a live scannable QR code (QR library inlined — no external scripts), scan stats, complaints inbox. |
| `api/` | **Backend** — Cloudflare Worker + D1 + Resend. Powers scans, complaint emails, logins, and the active/paused switch. See `api/BACKEND-SETUP.md`. |
| `brand/` | Logos (`chairside-logo.svg`, `howd-we-do-logo.svg`, `favicon.svg`). |
| `docs/` | Playbook, intake questions, and weekly-digest template (from the earlier monitoring concept). |
| `demo/reputation-dashboard.html` | Parked monitoring mockup — sample data, not a live feature, not linked. |

Every HTML file is fully self-contained — all CSS and JavaScript are inline, so they work
served statically. There is no build step.

## How a clinic is onboarded

One clinic = one account (one code, one QR, one dashboard login, one office inbox), regardless
of how many dentists work there. Pricing is per clinic.

1. Create the clinic with one authenticated command (returns its **code/slug** and an
   **access key** = dashboard password). See `api/BACKEND-SETUP.md`.
2. Give the clinic: the **dashboard link** (`dashboard.html`), their **email + access key**,
   and their **QR code** (downloaded from the dashboard, for them to print).
3. To pause a non-paying clinic (blocks its login, scan page, and complaint emails):
   `UPDATE dentists SET active=0 WHERE slug='<code>'`; set `active=1` to reactivate.

## Deploy (static site on GitHub Pages)

1. Push this folder to the `reputation-watch` repo (root of the default branch).
2. Repo **Settings → Pages → Deploy from a branch → `main` / `/ (root)`**.
3. Publishes at `https://<username>.github.io/reputation-watch/` (patient page at
   `/scan.html?p=<code>`, dashboard at `/dashboard.html`).

The backend runs separately on Cloudflare — see `api/BACKEND-SETUP.md`. `API_BASE` in
`scan.html` and `dashboard.html` points the pages at the deployed Worker.

## Safe review-gating (important)

The patient flow keeps gating **soft**: it makes the happy path easy but never hides the public
option (the unhappy screen still links to Google), and it never pre-writes or scripts the review
text. This keeps the practice compliant with Google's policies and the FTC's rule against
suppressing honest reviews.
