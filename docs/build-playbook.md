# Reputation Watch Dashboard — Build Playbook

A step-by-step, repeatable recipe for producing a branded "Reputation Watch"
dashboard **and** setting up the recurring weekly digest for any dental practice.
Anyone can follow this. Every step that uses information specific to a dentist
points to a variable in `new-dentist-intake.md` (shown like `{{practice_name}}`).

This playbook, `new-dentist-intake.md`, and `weekly-digest-email.md` are the fixed
system — they don't change per client. Only the intake answers change.

Budget about 20–30 minutes per dentist once the intake answers are in hand.

---

## Phase 0 — Data mode & ground rules (read first)

- **Responses are drafted, never posted for the client.** The dashboard and digest
  produce a ready-to-send reply for each flagged review; the dentist posts it
  themselves. Never post on their behalf.
- **In Real mode, the clean source for review data is the client's own Google
  Business Profile.** The dentist grants access through Google's own screen — never
  accept or type their password. Treat Yelp / Healthgrades / Facebook as
  best-effort (automated pulling runs against their terms); show what's reliably
  available and don't promise full coverage of those three in writing.
- **Two different contacts, never merged:** `{{contact_email}}` is the public-facing
  address a drafted reply invites an unhappy reviewer to reach. `{{digest_recipients}}`
  is who at the practice receives the weekly email. Keep them separate.

---

## Phase 1 — Get the intake answers

1. **Collect the intake form.** Have the client fill out `new-dentist-intake.md`.
   Do not start building until every **required** field is answered. Requiredness
   depends on data mode (Step 4): Real mode requires the Google review link and the
   digest recipient(s); Demo mode does not.

2. **Confirm the brand basics.** From the practice website note `{{dentist_name}}`
   and credentials, `{{address}}`, `{{phone}}`, `{{contact_email}}`, `{{tagline}}`,
   and the dominant brand color `{{brand_color}}` (header/buttons; pick the main
   accent hex). Set a 2–4 letter logo monogram `{{logo_monogram}}` (default: the
   practice's initials) or use a supplied logo image.

3. **Find/verify the review pages.** Any `(auto)` link left blank: search
   `"{{practice_name}}" {{city}} dentist reviews` and read the links from the
   practice website footer. Record `{{google_url}}`, `{{yelp_url}}`,
   `{{healthgrades_url}}`, `{{facebook_url}}`.
   **Real mode gate:** the Google link is required, and every supplied link must be
   confirmed to open the correct business for THIS practice before you build.

---

## Phase 2 — Gather the review data

4. **Pull current ratings per platform.**
   - *Real:* pull from the Google Business Profile as the clean source; add
     Yelp / Healthgrades / Facebook on a best-effort basis. Record each platform's
     star rating and review count, plus the blended `{{overall_rating}}` and
     `{{total_reviews}}`.
   - *Demo:* use realistic illustrative figures and **add a visible banner stating
     the review content is illustrative** so sample data is never mistaken for real.

5. **Collect the review content.**
   - *Real:* capture recent reviews (name initial, star count, date, text), and
     **every review at or below `{{negative_threshold}}`** (see Step 6).
   - *Demo:* write 4–6 realistic reviews spanning the range (glowing, solid, one
     mixed, two negative) so the dashboard shows its full behavior.

6. **Score sentiment and apply the threshold.** Tag each review Positive /
   Mixed / Negative (rule of thumb: 4–5★ = Positive, 3★ = Mixed, 1–2★ = Negative).
   Compute the split `{{pct_positive}}` / `{{pct_neutral}}` / `{{pct_negative}}`.
   **The alert trigger is `{{negative_threshold}}` from the intake (default 1–2★),
   not a fixed rule** — flag every review at or below it as "needs a response."

---

## Phase 3 — Draft responses to the flagged reviews

7. **Write one response per review at/below `{{negative_threshold}}`.** Formula
   every time: (a) greet by first name and thank them; (b) apologize for the
   specific problem without excuses; (c) name one concrete thing being done about
   it; (d) move it offline via `{{contact_email}}` and `{{phone}}`, asking for the
   office manager; (e) sign per `{{signoff}}` (default: lead dentist, then practice),
   shaped by any `{{tone_notes}}`. Keep it 3–5 sentences, warm, never defensive,
   and never disclose private health details (HIPAA). Mark every draft
   "review before posting."

---

## Phase 4 — Build the dashboard

8. **Start from the template.** Copy the previous `reputation-watch-dashboard.html`
   — a single self-contained file (all CSS and content inline, no external files).
   Reuse the layout unchanged; only swap variables.

9. **Set the brand.** In the `<style>` block set `--brand` to `{{brand_color}}` and
   `--brand-dark` to a slightly darker shade. Set `{{logo_monogram}}` in the `.logo` div.

10. **Fill the header** — practice name, `{{dentist_name}}`, `{{city}}`,
    `{{reporting_period}}`, and the "updated" date.

11. **Fill the sentiment summary** — `{{overall_rating}}`, star glyphs,
    `{{total_reviews}}`, sentiment-bar widths (`{{pct_positive}}` /
    `{{pct_neutral}}` / `{{pct_negative}}`), and the "This period" stat card (new
    reviews, period average, needs-a-response count). Note: sentiment-over-time
    trends need a few weeks of runs to populate — the first build shows a starting
    snapshot, not a trend line.

12. **Fill the four platform tiles** — rating, count, and the `href` to each
    review URL from Step 3.

13. **Fill the alerts section** — one `.alert` block per review at/below
    `{{negative_threshold}}`: star badge, platform + date, reviewer, the review
    text, and the drafted response from Step 7 in the `.response` block.

14. **Fill the recent-reviews list** — 4–6 `.rev` cards across platforms with the
    correct sentiment chip on each.

15. **Update the footer** with `{{address}}`, `{{phone}}`, `{{contact_email}}`.
    Keep the sample-data banner for Demo; remove it for a Real deployment.

---

## Phase 5 — Set up the weekly digest (Real deployments)

16. **Deploy/host the dashboard** and record the live link as `{{dashboard_url}}`
    (used in the digest footer). For a demo, skip this.

17. **Build the digest from `weekly-digest-email.md`.** Render it as branded HTML
    matching the dashboard (`{{brand_color}}`, `{{logo_monogram}}`). Follow that
    template's rules: scannable in 60 seconds, lead with what needs action, skip
    empty sections, never omit the drafted responses. Choose the subject line by
    whether anything sits at/below `{{negative_threshold}}`.

18. **Schedule the recurring run.** Set up a weekly scheduled task on the
    `{{send_schedule}}` (default: Mondays 8:00 AM local) that re-pulls data at the
    `{{refresh_cadence}}` (default: weekly), refreshes the dashboard, and emails the
    digest to `{{digest_recipients}}`. Use the scheduled-task tools, not an
    in-process timer, so it survives across sessions.

---

## Phase 6 — Verify and deliver

19. **Eyeball the rendered page.** Brand color applied everywhere, no leftover text
    from the previous dentist, sentiment-bar widths sum to 100%, every platform
    link opens the right page, every flagged review has a response.

20. **Cross-check the variables.** Search the file for the *previous* dentist's
    practice name, phone, and email to make sure nothing survived. In Real mode,
    re-confirm the Google link resolves to the correct business.

21. **Deliver.** Send the finished `reputation-watch-dashboard.html` to the client
    and persist it so they can reopen it. For Real deployments, confirm the weekly
    digest is scheduled and state the day/time and recipients.

---

## Reusing this next time

Next dentist = fill in `new-dentist-intake.md`, then run Steps 1–21 with those
answers. Nothing about the layout, response formula, sentiment rules, or digest
structure changes — only the variables do.
