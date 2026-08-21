# Reputation Watch

Review **routing** and **monitoring** for dental practices, bundled as one product.

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

## Next steps (to make it a working product)

The pages are the front end. To go live you add three pieces, all free-tier:

1. **Hosting** — GitHub Pages (this repo) or Netlify / Cloudflare Pages.
2. **Complaint email** — a small serverless function (e.g. a Netlify/Cloudflare Function)
   that takes the unhappy-patient form POST and sends it to the dentist via **Resend**.
3. **Storage** — a free database (e.g. Supabase / Cloudflare D1) for dentist records,
   scan events, and complaints, so the dashboard shows real numbers instead of samples.

Then replace, in `scan.html`, the `submitComplaint()` console log with a `fetch()` POST to
the function, and in `dashboard.html` swap the simulated login and the sample `COMPLAINTS`
array for real auth and a data fetch.

## Safe review-gating (important)

The patient flow deliberately keeps gating **soft**: it makes the happy path easy but never
hides the public option (the unhappy screen still links to Google), and it never pre-writes
or scripts the review text. This keeps the practice compliant with Google's policies and the
FTC's rule against suppressing honest reviews.
