# Chairside

Patient feedback for dental practices — review **routing** and **monitoring**, bundled as one product.

> **Two names, two jobs.** **Chairside** is the vendor/product name — what dentists (the paying
> customers) see on the dashboard, landing page, and invoices. **"How'd we do?"** is the warm,
> patient-facing label on the scan page only; it's not a company name. On the patient page the
> **dentist's own brand stays dominant** — "How'd we do?" is the friendly question underneath, and
> Chairside appears only as a tiny "powered by" credit.

- **Routing** — a patient scans a QR code, says whether their visit went well, and is
  routed: happy patients to Google to leave a review, unhappy patients to a private form
  that reaches the office. It generates its own data (scans, clicks, complaints), so it
  needs no paid review API.
- **Monitoring** — a branded dashboard that aggregates existing reviews across Google,
  Yelp, Healthgrades and Facebook, scores sentiment, and drafts responses to negatives.

> ⚠️ **These are front-end prototypes with sample data.** Login is simulated and the
> complaint form logs to the browser console instead of emailing. See
> [Next steps](#next-steps) to make it live.

## What's in here

| Path | What it is |
|------|-----------|
| `index.html` | Landing page linking to the pages below. |
| `scan.html` | **Patient scan page** (public). Happy → Google review link; unhappy → private complaint form. |
| `dashboard.html` | **Dentist dashboard** (private). Simulated login, setup fields, a live scannable QR code (QR library inlined — no external scripts), scan stats, complaints inbox. |
| `demo/reputation-dashboard.html` | **Review-monitoring dashboard** (demo). The companion product. |
| `docs/build-playbook.md` | How a dashboard is built for a new practice. |
| `docs/new-dentist-intake.md` | The intake questions per practice; each maps to a `{{variable}}`. |
| `docs/weekly-digest-email.md` | The weekly digest email template. |
| `api/` | **Backend** — a Cloudflare Worker + D1 + Resend that powers real scans, complaint emails, and dashboard data. See `api/BACKEND-SETUP.md`. |

Every HTML file is fully self-contained — all CSS and JavaScript are inline, so they work
opened directly from disk or served statically. There is no build step.

## Run locally

Open any `.html` file in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy on GitHub Pages

1. Push this folder to the `reputation-watch` repository (root of the default branch).
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Branch: your default branch, folder: `/ (root)`. Save.
4. The site publishes at `https://<your-username>.github.io/reputation-watch/`.
   - Patient page: `.../reputation-watch/scan.html`
   - Dashboard: `.../reputation-watch/dashboard.html`

(GitHub Pages serves static files only — the "Next steps" backend below runs elsewhere.)

## Making it live

The backend is written and lives in **`api/`** (Cloudflare Worker + D1 database +
Resend email, all free tier). Follow **`api/BACKEND-SETUP.md`** to deploy it, then set
`API_BASE` in `scan.html` and `dashboard.html` to your Worker URL and push.

Until `API_BASE` is set, both pages stay in **demo mode** (simulated login, sample data,
no network), so the public site keeps working as a showcase while you wire up the backend.
Once it's set, the scan page records real scans and emails complaints, and the dashboard
logs in real dentists and shows their real numbers.

## Safe review-gating (important)

The patient flow deliberately keeps gating **soft**: it makes the happy path easy but never
hides the public option (the unhappy screen still links to Google), and it never pre-writes
or scripts the review text. This keeps the practice compliant with Google's policies and the
FTC's rule against suppressing honest reviews.
