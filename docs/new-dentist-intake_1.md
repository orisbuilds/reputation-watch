# Chairside — "New Dentist" Onboarding

The questions to answer when onboarding a new clinic to Chairside (the QR feedback product).
Each maps to a field in the create-clinic command; answer them and the clinic is live.

> One clinic = one account, regardless of how many dentists work there. Pricing is per clinic.

## Required

1. **Clinic name** — e.g. *Bright Dental*.
   Becomes the practice name on the scan page and generates the clinic's code (slug).

2. **Email for complaint alerts** — the office/owner inbox where unhappy-patient feedback is sent.

3. **Google review link — the direct "write a review" link, not the profile page.**
   - **Method B (standard):** the clinic gives you the short link from their Google Business
     Profile → *Ask for reviews / Get more reviews*. Looks like `https://g.page/r/XXXXXXXX/review`.
   - **Method A (fallback):** build it from the practice's Place ID —
     `https://search.google.com/local/writereview?placeid=PLACE_ID`
     (get the Place ID from Google's Place ID Finder).
   - Why it must be the direct link: the happy path's whole value is a two-tap jump straight to
     the review box. A plain Maps/profile URL adds friction and fewer patients finish.

## Recommended

4. **Doctor's name** — e.g. *Dr. Chen*. Used in the "feel free to mention Dr. ___" nudge on the
   happy screen. Multi-dentist clinic → use the lead dentist or leave generic.

## After answering

1. Create the clinic (one authenticated `curl` — see `../api/BACKEND-SETUP.md`). It returns the
   clinic's **code (slug)** and **access key** (dashboard password).
2. Record the code, login email, and access key in the Chairside clinics tracker.
3. Hand the client: the **dashboard link**, their **email + access key**, and their **printed QR**
   (downloaded from the dashboard).

If the Google link isn't available at signup, create the clinic anyway and add it later via the
dashboard setup fields — but the happy path won't route to Google until it's set.
