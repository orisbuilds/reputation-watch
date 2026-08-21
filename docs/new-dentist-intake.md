# New Dentist Intake — Reputation Watch Dashboard

Answer these once for each new practice. Hand the answers back and the dashboard
gets rebuilt from the playbook with zero further explanation. Each question maps to
a `{{variable}}` used in `build-playbook.md`.

Fields marked **(required)** must be filled. Fields marked *(auto — I can find it)*
can be left blank and I'll look them up from the practice website —
**except the review links, whose rules depend on the data mode (see Section 5).**

---

## 0. Before you start — data & permissions  *(read once)*

- **Responses are drafted, never posted for the client.** The dashboard writes a
  ready-to-send reply for each negative review; the dentist posts it themselves.
  Keep it this way — don't post on their behalf.
- **For "Real" data, the clean source is the client's own Google Business Profile.**
  Ask the dentist to grant access through Google's own screen. Never accept or type
  their password — they authorize it on Google's side and access flows to you.
- **Treat Yelp / Healthgrades / Facebook as best-effort.** Automated pulling from
  these runs against their terms, so display what's reliably available and don't
  promise full coverage of those three in writing.

---

## 1. Practice identity

1. **Practice name** `{{practice_name}}` — **(required)**
   > e.g. Austin Family Dentistry

2. **Lead dentist name + credentials** `{{dentist_name}}` — **(required)**
   > e.g. Dr. Kara Diemer, DDS

3. **Logo monogram** `{{logo_monogram}}` — 2–4 letters for the logo box, or attach a logo image
   > e.g. AFD

4. **Tagline / slogan** `{{tagline}}` — *(auto)*
   > e.g. Private, comprehensive dental care in North Austin

## 2. Location & contact

5. **City / area label** `{{city}}` — **(required)**
   > e.g. North Austin, TX

6. **Full street address** `{{address}}` — *(auto)*
   > e.g. 13915 N Mopac Expy #110, Austin, TX 78728

7. **Public phone number** `{{phone}}` — **(required)**
   > e.g. 512-218-1130

8. **Public-facing contact for unhappy reviewers** `{{contact_email}}` — **(required)**
   > The address a drafted response can invite a reviewer to reach.
   > e.g. admin@austinfamilydds.com
   > (This is NOT who receives the weekly digest — that's Section 6.)

## 3. Branding

9. **Primary brand color (hex)** `{{brand_color}}` — *(auto — I'll read it off your site)*
   > e.g. #0f766e (teal). Give a hex or just say "match my website."

## 4. Review page links

> Requiredness depends on Section 5. **In "Real" mode these are REQUIRED and must be
> the confirmed, correct page for THIS practice** — verify each link opens the right
> business before building. In "Demo" mode, leave blank and I'll locate them.

10. **Google review page** `{{google_url}}` — **(required in Real mode)**
11. **Yelp business page** `{{yelp_url}}` — *(auto)*
12. **Healthgrades profile** `{{healthgrades_url}}` — *(auto)*
13. **Facebook page** `{{facebook_url}}` — *(auto)*

## 5. Data mode

14. **Real reviews or demo?** `{{data_mode}}` — **(required)**
    > "Real" = pull and display the practice's actual current reviews and ratings.
    >   Review links in Section 4 become required and must be verified.
    > "Demo" = realistic sample reviews, clearly labeled as illustrative
    >   (good for a sales example or template preview).

15. **Reporting period** `{{reporting_period}}` — default: Last 30 days
    > Note: sentiment-over-time trends need a few weeks of runs to populate; the
    > first build shows a starting snapshot, not a trend line.

## 6. Ongoing service settings  *(the recurring product)*

16. **Digest recipient(s)** `{{digest_recipients}}` — **(required in Real mode)**
    > Who at the practice receives the weekly report. e.g. dr.diemer@practice.com

17. **Send schedule** `{{send_schedule}}` — default: every Monday, 8:00 AM local
    > Day + time the digest email goes out and the dashboard refreshes.

18. **Refresh cadence** `{{refresh_cadence}}` — default: weekly
    > How often the underlying data is re-pulled (weekly / daily).

19. **Negative-review threshold** `{{negative_threshold}}` — default: 1–2 stars
    > What triggers an alert + drafted response. e.g. "3 stars and below."

20. **Dashboard hosting / login link** `{{dashboard_url}}` — *(auto — set at build)*
    > Where the live dashboard is hosted for the client to open. Filled when deployed.

## 7. Response style (optional)

21. **Who signs the responses?** `{{signoff}}` — default: the lead dentist, then practice name
    > e.g. "Dr. Diemer" or "The Austin Family Dentistry team"

22. **Any tone notes or off-limits phrases?** `{{tone_notes}}`
    > e.g. "warm but concise," "never offer refunds in writing," "always invite them to call"

---

### What gets produced from these answers
A branded, self-contained `reputation-watch-dashboard.html` — header, overall
sentiment summary, four platform tiles (Google / Yelp / Healthgrades / Facebook),
an alerts section listing every review at or below the negative threshold with a
ready-to-send drafted response, and a recent-reviews feed — plus a scheduled weekly
task that refreshes it and emails the digest to the Section 6 recipients. Same
layout every time; only your answers above change.
