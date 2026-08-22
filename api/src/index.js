/**
 * Chairside — API (Cloudflare Worker)
 * -------------------------------------------------------------
 * A tiny, free-tier backend for the Chairside prototype.
 *
 * Storage : Cloudflare D1 (SQLite)   -> binding env.DB
 * Email   : Resend                   -> secret  env.RESEND_API_KEY
 * Secrets : env.ADMIN_TOKEN  (protects dentist provisioning)
 *           env.FROM_EMAIL   (verified Resend sender, e.g. alerts@yourdomain.com;
 *                             use onboarding@resend.dev while testing)
 *
 * Endpoints
 *   GET  /api/health                         -> {ok:true}
 *   POST /api/track      {slug, action}       (public)  action = scan|happy|unhappy
 *   POST /api/complaint  {slug, message, name?, contact?} (public) -> store + email dentist
 *   POST /api/login      {email, token}       -> validates, returns dentist profile
 *   GET  /api/stats?slug=...   (Bearer token) -> {scans, happy, unhappy, complaints}
 *   GET  /api/complaints?slug=...(Bearer)     -> [ {message,name,contact,created_at}, ... ]
 *   PUT  /api/dentist    {doctor_name?, email?, google_url?} (Bearer) -> update own profile
 *   POST /api/dentist    {slug, practice_name, doctor_name, email, google_url}
 *                                             (Bearer ADMIN_TOKEN) -> create dentist, returns access token
 *
 * All responses are JSON. CORS is open (*) so the static GitHub Pages site can call it.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function bearer(request) {
  const h = request.headers.get("Authorization") || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : "";
}

// random URL-safe token
function newToken(bytes = 24) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return btoa(String.fromCharCode(...a)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function slugify(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}

// look up a dentist and verify the caller's bearer token matches its access_token
async function authDentist(env, request, slug) {
  if (!slug) return { error: json({ error: "missing slug" }, 400) };
  const token = bearer(request);
  if (!token) return { error: json({ error: "missing token" }, 401) };
  const row = await env.DB.prepare("SELECT * FROM dentists WHERE slug = ?").bind(slug).first();
  if (!row) return { error: json({ error: "unknown practice" }, 404) };
  if (row.access_token !== token) return { error: json({ error: "invalid token" }, 401) };
  return { dentist: row };
}

async function sendComplaintEmail(env, dentist, c) {
  if (!env.RESEND_API_KEY) return { skipped: "no RESEND_API_KEY set" };
  const dash = env.DASHBOARD_URL || "";
  const html = `
    <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#10201e">
      <div style="background:#0f766e;color:#fff;padding:18px 22px;border-radius:12px 12px 0 0">
        <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:.85">Chairside</div>
        <div style="font-size:18px;font-weight:600;margin-top:4px">New patient feedback needs your attention</div>
      </div>
      <div style="border:1px solid #e3e9e8;border-top:none;border-radius:0 0 12px 12px;padding:22px">
        <p style="margin:0 0 14px">A patient at <strong>${esc(dentist.practice_name)}</strong> left private feedback.</p>
        <div style="background:#fbe6e6;border-left:4px solid #d03b3b;border-radius:8px;padding:14px 16px;margin:0 0 16px">
          <div style="font-size:14px;line-height:1.5">${esc(c.message)}</div>
        </div>
        <table style="font-size:14px;border-collapse:collapse">
          <tr><td style="color:#7d8b88;padding:2px 12px 2px 0">From</td><td>${esc(c.name) || "(left anonymous)"}</td></tr>
          <tr><td style="color:#7d8b88;padding:2px 12px 2px 0">Contact</td><td>${esc(c.contact) || "—"}</td></tr>
          <tr><td style="color:#7d8b88;padding:2px 12px 2px 0">Received</td><td>${esc(new Date().toUTCString())}</td></tr>
        </table>
        <p style="margin:18px 0 0;font-size:14px">A quick, personal reply within 24 hours is what turns an unhappy visit around.</p>
        ${dash ? `<p style="margin:16px 0 0"><a href="${esc(dash)}" style="background:#0f766e;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;font-size:14px">Open your dashboard</a></p>` : ""}
      </div>
      <p style="color:#9aa5a3;font-size:11px;text-align:center;margin:14px 0 0">Chairside · sent because a patient used your feedback QR code</p>
    </div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.FROM_EMAIL || "onboarding@resend.dev",
      to: [dentist.email],
      subject: `New patient feedback needs your attention — ${dentist.practice_name}`,
      html,
    }),
  });
  if (!res.ok) return { error: `resend ${res.status}: ${await res.text()}` };
  return { ok: true };
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "");
    let body = {};
    if (request.method === "POST" || request.method === "PUT") {
      try { body = await request.json(); } catch { body = {}; }
    }

    try {
      // ---- health ----
      if (path === "/api/health") return json({ ok: true, service: "chairside" });

      // ---- public: track a scan / routing event ----
      if (path === "/api/track" && request.method === "POST") {
        const slug = slugify(body.slug);
        const action = String(body.action || "").toLowerCase();
        if (!slug || !["scan", "happy", "unhappy"].includes(action))
          return json({ error: "slug and valid action required" }, 400);
        await env.DB.prepare("INSERT INTO events (slug, action) VALUES (?, ?)").bind(slug, action).run();
        return json({ ok: true });
      }

      // ---- public: submit a complaint ----
      if (path === "/api/complaint" && request.method === "POST") {
        const slug = slugify(body.slug);
        const message = String(body.message || "").trim();
        if (!slug || !message) return json({ error: "slug and message required" }, 400);
        const dentist = await env.DB.prepare("SELECT * FROM dentists WHERE slug = ?").bind(slug).first();
        if (!dentist) return json({ error: "unknown practice" }, 404);
        const name = (body.name || "").toString().slice(0, 120) || null;
        const contact = (body.contact || "").toString().slice(0, 200) || null;
        await env.DB.prepare(
          "INSERT INTO complaints (slug, message, name, contact) VALUES (?, ?, ?, ?)"
        ).bind(slug, message.slice(0, 4000), name, contact).run();
        await env.DB.prepare("INSERT INTO events (slug, action) VALUES (?, 'unhappy')").bind(slug).run();
        const mail = await sendComplaintEmail(env, dentist, { message, name, contact });
        return json({ ok: true, emailed: mail.ok === true, mail });
      }

      // ---- login: email + access token ----
      if (path === "/api/login" && request.method === "POST") {
        const email = String(body.email || "").trim().toLowerCase();
        const token = String(body.token || "").trim();
        if (!email || !token) return json({ error: "email and access token required" }, 401);
        const row = await env.DB.prepare(
          "SELECT slug, practice_name, doctor_name, email, google_url FROM dentists WHERE lower(email) = ? AND access_token = ?"
        ).bind(email, token).first();
        if (!row) return json({ error: "invalid email or access token" }, 401);
        return json({ ok: true, dentist: row });
      }

      // ---- stats (auth) ----
      if (path === "/api/stats" && request.method === "GET") {
        const slug = slugify(url.searchParams.get("slug"));
        const a = await authDentist(env, request, slug);
        if (a.error) return a.error;
        const rows = await env.DB.prepare(
          "SELECT action, COUNT(*) AS n FROM events WHERE slug = ? GROUP BY action"
        ).bind(slug).all();
        const counts = { scan: 0, happy: 0, unhappy: 0 };
        for (const r of rows.results || []) counts[r.action] = r.n;
        const comp = await env.DB.prepare("SELECT COUNT(*) AS n FROM complaints WHERE slug = ?").bind(slug).first();
        return json({
          scans: counts.scan,
          happy: counts.happy,
          unhappy: counts.unhappy,
          complaints: comp ? comp.n : 0,
        });
      }

      // ---- complaints list (auth) ----
      if (path === "/api/complaints" && request.method === "GET") {
        const slug = slugify(url.searchParams.get("slug"));
        const a = await authDentist(env, request, slug);
        if (a.error) return a.error;
        const rows = await env.DB.prepare(
          "SELECT message, name, contact, created_at FROM complaints WHERE slug = ? ORDER BY id DESC LIMIT 100"
        ).bind(slug).all();
        return json({ complaints: rows.results || [] });
      }

      // ---- update own profile (auth) ----
      if (path === "/api/dentist" && request.method === "PUT") {
        const slug = slugify(body.slug);
        const a = await authDentist(env, request, slug);
        if (a.error) return a.error;
        const doctor = body.doctor_name != null ? String(body.doctor_name).slice(0, 160) : a.dentist.doctor_name;
        const email = body.email != null ? String(body.email).slice(0, 200) : a.dentist.email;
        const google = body.google_url != null ? String(body.google_url).slice(0, 500) : a.dentist.google_url;
        await env.DB.prepare(
          "UPDATE dentists SET doctor_name = ?, email = ?, google_url = ? WHERE slug = ?"
        ).bind(doctor, email, google, slug).run();
        return json({ ok: true });
      }

      // ---- provision a dentist (admin only) ----
      if (path === "/api/dentist" && request.method === "POST") {
        if (!env.ADMIN_TOKEN || bearer(request) !== env.ADMIN_TOKEN)
          return json({ error: "admin token required" }, 401);
        const practice = String(body.practice_name || "").trim();
        const email = String(body.email || "").trim();
        if (!practice || !email) return json({ error: "practice_name and email required" }, 400);
        const slug = slugify(body.slug || practice);
        if (!slug) return json({ error: "could not derive slug" }, 400);
        const exists = await env.DB.prepare("SELECT slug FROM dentists WHERE slug = ?").bind(slug).first();
        if (exists) return json({ error: `slug '${slug}' already exists` }, 409);
        const token = newToken();
        await env.DB.prepare(
          "INSERT INTO dentists (slug, practice_name, doctor_name, email, google_url, access_token) VALUES (?,?,?,?,?,?)"
        ).bind(slug, practice, body.doctor_name || null, email, body.google_url || null, token).run();
        return json({ ok: true, slug, access_token: token, scan_url: `/scan.html?p=${slug}` });
      }

      return json({ error: "not found", path }, 404);
    } catch (err) {
      return json({ error: "server error", detail: String(err && err.message || err) }, 500);
    }
  },
};
