/**
 * Chairside — instant alerts on Telegram and WhatsApp
 * ---------------------------------------------------
 * Email alerts stay exactly as before (sendComplaintEmail in index.js).
 * This module adds extra channels per clinic, stored in the alert_targets table.
 *
 * Secrets / vars (all optional — a missing one just switches that channel off):
 *   TELEGRAM_BOT_TOKEN   token from @BotFather
 *   WA_TOKEN             WhatsApp Cloud API permanent access token (System User)
 *   WA_PHONE_ID          WhatsApp Cloud API phone-number ID
 *   WA_TEMPLATE          approved template name (default "chairside_new_note")
 *   TELEGRAM_API_BASE / WA_API_BASE   override API hosts (local testing only)
 *
 * Plan limits on messenger recipients: standard 1, pro 5.
 */

export const PLAN_TARGET_LIMIT = { standard: 1, pro: 5 };

const tgBase = (env) => (env.TELEGRAM_API_BASE || "https://api.telegram.org");
const waBase = (env) => (env.WA_API_BASE || "https://graph.facebook.com/v21.0");

// Webhook secret derived from the bot token, so there's no second secret to manage.
export async function telegramWebhookSecret(env) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("chairside-tg:" + env.TELEGRAM_BOT_TOKEN));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 48);
}

async function tg(env, method, payload) {
  const res = await fetch(`${tgBase(env)}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok || data.ok === false) throw new Error(`telegram ${method} ${res.status}: ${data.description || ""}`);
  return data.result;
}

// Make sure Telegram is pointed at our webhook; returns the bot's @username.
export async function ensureTelegramWebhook(env, origin) {
  const me = await tg(env, "getMe");
  const url = `${origin}/api/telegram/webhook`;
  // Always (re)register: the webhook secret is derived from the bot token, so after a
  // token is revoked/rotated the old registration would be rejected by our own check.
  await tg(env, "setWebhook", {
    url,
    secret_token: await telegramWebhookSecret(env),
    allowed_updates: ["message"],
  });
  return me.username;
}

// ---- message text ----
function clip(s, n) { s = String(s || ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; }

export function alertText(dentist, c, market) {
  const name = c.name || null, contact = c.contact || null;
  const en =
    `New private note — ${dentist.practice_name}\n\n` +
    `"${clip(c.message, 3000)}"\n\n` +
    `From: ${name || "(anonymous)"}\nContact: ${contact || "—"}\n\n` +
    `A quick, personal reply within 24 hours is what turns an unhappy visit around.`;
  if (market !== "ge") return "🦷 " + en;
  const ka =
    `ახალი პირადი შეტყობინება — ${dentist.practice_name}\n\n` +
    `„${clip(c.message, 3000)}“\n\n` +
    `ვინ: ${name || "(ანონიმური)"}\nკონტაქტი: ${contact || "—"}\n\n` +
    `სწრაფი, პირადი პასუხი 24 საათში ცუდ ვიზიტს ერთგულ პაციენტად აქცევს.`;
  return "🦷 " + ka;
}

// WhatsApp template params can't contain newlines/tabs or 4+ spaces in a row.
function waParam(s, n) {
  return clip(String(s || "").replace(/[\r\n\t]+/g, " ").replace(/ {4,}/g, "   ").trim() || "—", n);
}

async function sendTelegram(env, chatId, text) {
  await tg(env, "sendMessage", { chat_id: chatId, text, disable_web_page_preview: true });
}

async function sendWhatsApp(env, to, dentist, c, market) {
  const res = await fetch(`${waBase(env)}/${env.WA_PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: String(to).replace(/[^\d]/g, ""),
      type: "template",
      template: {
        name: env.WA_TEMPLATE || "chairside_new_note",
        language: { code: market === "ge" ? "ka" : "en" },
        components: [{
          type: "body",
          parameters: [
            { type: "text", text: waParam(dentist.practice_name, 120) },
            { type: "text", text: waParam(c.message, 900) },
            { type: "text", text: waParam(c.name || (market === "ge" ? "ანონიმური" : "anonymous"), 120) },
            { type: "text", text: waParam(c.contact, 200) },
          ],
        }],
      },
    }),
  });
  if (!res.ok) throw new Error(`whatsapp ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

// Send the alert to every active messenger target of the clinic. Never throws.
export async function fanOutAlerts(env, dentist, c, market) {
  const rows = await env.DB.prepare(
    "SELECT id, channel, target FROM alert_targets WHERE slug = ? AND active = 1 ORDER BY id"
  ).bind(dentist.slug).all();
  const results = [];
  for (const t of rows.results || []) {
    try {
      if (t.channel === "telegram") {
        if (!env.TELEGRAM_BOT_TOKEN) { results.push({ id: t.id, skipped: "no telegram token" }); continue; }
        await sendTelegram(env, t.target, alertText(dentist, c, market));
      } else if (t.channel === "whatsapp") {
        if (!env.WA_TOKEN || !env.WA_PHONE_ID) { results.push({ id: t.id, skipped: "whatsapp not configured" }); continue; }
        await sendWhatsApp(env, t.target, dentist, c, market);
      }
      results.push({ id: t.id, ok: true });
    } catch (e) {
      console.error("alert failed", dentist.slug, t.channel, t.id, String(e && e.message || e));
      results.push({ id: t.id, error: true });
    }
  }
  return results;
}

export async function countTargets(env, slug) {
  const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM alert_targets WHERE slug = ? AND active = 1").bind(slug).first();
  return r ? r.n : 0;
}

// ---- Telegram webhook: "/start <code>" connects a chat to a clinic, "/stop" disconnects ----
export async function handleTelegramUpdate(env, update) {
  const msg = update && update.message;
  if (!msg || !msg.chat || typeof msg.text !== "string") return;
  const chatId = String(msg.chat.id);
  const text = msg.text.trim();

  const reply = (t) => sendTelegram(env, chatId, t).catch(() => {});

  if (text === "/stop") {
    const r = await env.DB.prepare(
      "UPDATE alert_targets SET active = 0 WHERE channel = 'telegram' AND target = ? AND active = 1"
    ).bind(chatId).run();
    return reply(r.meta && r.meta.changes
      ? "გამორთულია. ამ ჩატში შეტყობინებები აღარ მოვა.\nTurned off. This chat won't receive alerts any more."
      : "ეს ჩატი არცერთ კლინიკასთან არ არის დაკავშირებული.\nThis chat isn't connected to any clinic.");
  }

  const m = text.match(/^\/start(?:\s+([A-Za-z0-9_-]{8,64}))?$/);
  if (!m) return reply("Chairside: ამ ჩატში მიიღებთ პაციენტების პირად შეტყობინებებს.\nYou'll receive patients' private notes in this chat. Send /stop to turn them off.");
  if (!m[1]) return reply("დასაკავშირებლად გამოიყენეთ Chairside-ის მიერ გამოგზავნილი ბმული.\nTo connect, please open the link Chairside sent you.");

  const code = await env.DB.prepare(
    "SELECT * FROM link_codes WHERE code = ? AND used_at IS NULL AND expires_at > datetime('now')"
  ).bind(m[1]).first();
  if (!code) return reply("ბმულს ვადა გაუვიდა ან უკვე გამოყენებულია. სთხოვეთ Chairside-ს ახალი.\nThis link has expired or was already used. Please ask Chairside for a new one.");

  const dentist = await env.DB.prepare("SELECT * FROM dentists WHERE slug = ?").bind(code.slug).first();
  if (!dentist) return reply("Clinic not found.");

  const existing = await env.DB.prepare(
    "SELECT id, active FROM alert_targets WHERE slug = ? AND channel = 'telegram' AND target = ?"
  ).bind(code.slug, chatId).first();
  if (!(existing && existing.active === 1)) {
    const plan = (dentist.plan === "pro") ? "pro" : "standard";
    if ((await countTargets(env, code.slug)) >= PLAN_TARGET_LIMIT[plan]) {
      return reply("ამ გეგმაზე შეტყობინებების მიმღებთა ლიმიტი ამოწურულია.\nThis plan's alert recipient limit has been reached. Please contact Chairside.");
    }
  }
  if (existing) {
    await env.DB.prepare("UPDATE alert_targets SET active = 1, label = COALESCE(?, label) WHERE id = ?").bind(code.label, existing.id).run();
  } else {
    await env.DB.prepare(
      "INSERT INTO alert_targets (slug, channel, target, label) VALUES (?, 'telegram', ?, ?)"
    ).bind(code.slug, chatId, code.label || (msg.from && msg.from.first_name) || null).run();
  }
  await env.DB.prepare("UPDATE link_codes SET used_at = datetime('now') WHERE code = ?").bind(m[1]).run();
  return reply(
    `✅ დაკავშირებულია: ${dentist.practice_name}. პაციენტების პირადი შეტყობინებები ამ ჩატში მოვა. გამოსართავად გამოგზავნეთ /stop.\n` +
    `✅ Connected to ${dentist.practice_name}. Patients' private notes will arrive in this chat. Send /stop to turn them off.`
  );
}
