# Weekly Digest Email — Reputation Watch

The recurring deliverable. Cowork regenerates this each week from fresh review data
and emails it to `{{digest_recipients}}` on the `{{send_schedule}}`. Rendered as
branded HTML matching the dashboard (`{{brand_color}}`, `{{logo_monogram}}`).

Design rules:
- **Scannable in 60 seconds.** A dentist skims on their phone between patients.
- **Lead with what needs action.** Negatives and their drafted responses go near the top.
- **Skip empty sections.** No new negatives? Drop that block entirely — don't show "0."
- **The drafted responses are the proof of work.** Never omit them.

---

## Subject line (choose by content)

- If any review is at/below `{{negative_threshold}}`:
  `Action needed: {{negative_count}} review to respond to — {{practice_name}}`
- Otherwise:
  `{{practice_name}}: {{overall_rating}}★ · {{new_count}} new reviews this week`

---

## Body structure

**1. Header**
> {{logo_monogram}} · {{practice_name}}
> Weekly Reputation Watch — {{reporting_period}}

**2. Snapshot (always)**
> Overall rating, the change vs. last week (▲ / ▼ / —), and the count of new reviews
> broken into positive / negative. One plain-language line on the week's mood.

**3. ⚠ Needs your response (only if negatives exist)**
> For each review at/below `{{negative_threshold}}`: platform, star rating, date,
> reviewer name, the review text (trimmed), and a ready-to-post drafted reply signed
> per `{{signoff}}` and shaped by `{{tone_notes}}`. Clear instruction: copy → post on
> that platform.

**4. ✓ New praise (only if positive reviews exist)**
> Each new positive review in one line. Flag any patient worth inviting to refer, and
> offer a short "thank you" reply to build goodwill.

**5. 📊 What patients are talking about (only with enough volume)**
> 1–3 recurring themes this period ("wait times came up twice," "hygienist praised
> in 3 reviews"). This is the insight layer — skip it if there aren't enough reviews
> to see a pattern.

**6. This week's actions**
> A short checklist of exactly what to do: post the drafted response(s), reply to the
> new 5★ reviews, anything else. Keep it to what's real this week.

**7. Footer**
> "See everything live → {{dashboard_url}}" · sign-off · small branding line.

---

# WORKED EXAMPLE

*(Austin Family Dentistry · Dr. Kara Diemer, DDS · last 7 days · demo content)*

**Subject:** Action needed: 1 review to respond to — Austin Family Dentistry

---

**AFD · Austin Family Dentistry**
Weekly Reputation Watch — Last 7 days

**This week at a glance**
Overall: **4.8 ★** ▲ (up from 4.7) · **4 new reviews** — 3 positive, 1 needs a reply.
A strong week overall, with one unhappy patient worth a quick, warm response.

---

**⚠ Needs your response — 1 review**

**Google · ★★ · Aug 14 · Marcus L.**
> "Front desk was friendly but I waited almost 40 minutes past my appointment time.
> The cleaning itself was fine, just didn't expect to lose my whole lunch break."

*Drafted reply (copy → post on Google):*
> "Marcus, thank you for the honest feedback, and I'm sorry your visit ran long —
> that's not the experience we want to give you. I'd genuinely like to make it right;
> please call us at 512-218-1130 and ask for me directly. — Dr. Diemer, Austin Family Dentistry"

---

**✓ New praise — 3 reviews**

- **Google · ★★★★★ · Aug 16 · Priya R.** — "Dr. Diemer explained everything clearly, no upselling. Rare."
- **Healthgrades · ★★★★★ · Aug 13 · James T.** — "Best hygienist I've had. Gentle and thorough."
- **Google · ★★★★★ · Aug 12 · Dana W.** — "Got my whole family switched over. Painless."
  *→ Dana referred her family — a good candidate to ask for a Google referral or testimonial.*

---

**📊 What patients are talking about**
- **Wait times** surfaced again (Marcus's review) — the one recurring soft spot this month.
- **Your hygienist** was praised by name in 2 of this week's reviews — a genuine strength worth leaning on.

---

**This week's actions**
- ☐ Post the drafted reply to Marcus's Google review.
- ☐ Send a one-line thank-you on the 3 five-star reviews.
- ☐ Consider asking Dana for a short testimonial.

---

See everything live → dashboard.austinfamilydds-reputationwatch.com
The Austin Family Dentistry team · powered by Reputation Watch
