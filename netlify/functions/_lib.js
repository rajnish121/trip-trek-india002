// Shared helpers for Trip Trek India booking functions (Node 18+, no dependencies).
const crypto = require('crypto');
const DATA = require('./trek-data.json');

const ADVANCE_PER_PERSON = 2000; // INR, fixed

const env = (k) => {
  const v = process.env[k];
  if (!v) throw new Error('Missing environment variable: ' + k);
  return v;
};

const json = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// ---- Supabase (REST, service role: server only) ----
async function sb(path, { method = 'GET', body, prefer } = {}) {
  const url = env('SUPABASE_URL').replace(/\/$/, '') + '/rest/v1/' + path;
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  const res = await fetch(url, {
    method,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      Prefer: prefer || 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error('Supabase ' + res.status + ': ' + text);
  return text ? JSON.parse(text) : null;
}

// ---- Razorpay ----
function rzAuth() {
  return 'Basic ' + Buffer.from(env('RAZORPAY_KEY_ID') + ':' + env('RAZORPAY_KEY_SECRET')).toString('base64');
}

async function rzCreateOrder(amountPaise, receipt, notes) {
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: rzAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt, notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Razorpay order failed: ' + JSON.stringify(data));
  return data;
}

function timingSafeEqualHex(a, b) {
  const ba = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function verifyCheckoutSignature(orderId, paymentId, signature) {
  const expected = crypto
    .createHmac('sha256', env('RAZORPAY_KEY_SECRET'))
    .update(orderId + '|' + paymentId)
    .digest('hex');
  return timingSafeEqualHex(expected, signature);
}

// ---- Email (Resend) ----
const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function sendConfirmationEmail(b) {
  if (!process.env.RESEND_API_KEY) return { skipped: true };
  const from = process.env.EMAIL_FROM || 'Trip Trek India <bookings@triptrekindia.in>';
  const site = process.env.SITE_URL || 'https://triptrekindia.in';
  const html = `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#13243C">
  <div style="background:#043C87;color:#fff;padding:20px 24px;border-radius:10px 10px 0 0">
    <div style="font-size:20px;font-weight:700">Booking Confirmed ✅</div>
    <div style="opacity:.85;font-size:14px">Trip Trek India</div>
  </div>
  <div style="border:1px solid #e3e8ef;border-top:0;padding:24px;border-radius:0 0 10px 10px">
    <p>Hi ${esc(b.name)},</p>
    <p>We've received your advance payment and your seat is confirmed.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:8px 0;color:#5A6B80">Trip</td><td style="text-align:right"><b>${esc(b.trek_name)}</b></td></tr>
      <tr><td style="padding:8px 0;color:#5A6B80">Sharing</td><td style="text-align:right">${esc(b.sharing)}</td></tr>
      <tr><td style="padding:8px 0;color:#5A6B80">Travellers</td><td style="text-align:right">${esc(b.travellers)}</td></tr>
      <tr><td style="padding:8px 0;color:#5A6B80">Preferred date</td><td style="text-align:right">${esc(b.travel_date || 'To be confirmed')}</td></tr>
      <tr><td style="padding:8px 0;color:#5A6B80">Advance paid</td><td style="text-align:right"><b>${inr(b.advance_paid)}</b></td></tr>
      <tr><td style="padding:8px 0;color:#5A6B80">Balance due at onboarding</td><td style="text-align:right"><b>${inr(b.balance_due)}</b></td></tr>
      <tr><td style="padding:8px 0;color:#5A6B80">Payment ID</td><td style="text-align:right">${esc(b.razorpay_payment_id)}</td></tr>
    </table>
    <p style="margin-top:20px"><a href="${site}/account/" style="background:#EF3006;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700">View my booking</a></p>
    <p style="font-size:13px;color:#5A6B80">Log in with this email address (${esc(b.email)}) using a one-time code. We'll share the pre-departure checklist and reporting details closer to your date.</p>
    <p style="font-size:13px;color:#5A6B80">Questions? Call +91 93109 65771 or +91 88105 55416, or reply to this email.</p>
  </div>
</div>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env('RESEND_API_KEY'), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [b.email],
      bcc: process.env.EMAIL_BCC ? [process.env.EMAIL_BCC] : undefined,
      subject: 'Booking confirmed — ' + b.trek_name + ' | Trip Trek India',
      html,
    }),
  });
  if (!res.ok) console.error('Resend error', res.status, await res.text());
  return { ok: res.ok };
}


// ---- Team notifications: Google Sheet row + internal email (both optional) ----
async function appendToSheet(b) {
  if (!process.env.SHEET_WEBHOOK_URL) return;
  const res = await fetch(process.env.SHEET_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      secret: process.env.SHEET_SECRET || '',
      row: [
        new Date(b.confirmed_at || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        b.name, b.phone, b.email, b.trek_name, b.sharing, b.travellers,
        b.travel_date || '', b.total_amount, b.advance_paid, b.balance_due,
        b.razorpay_payment_id, b.razorpay_order_id, b.status,
      ],
    }),
  });
  if (!res.ok) console.error('Sheet webhook error', res.status);
}

async function notifyTeam(b) {
  if (!process.env.RESEND_API_KEY || !process.env.TEAM_EMAIL) return;
  const from = process.env.EMAIL_FROM || 'Trip Trek India <bookings@triptrekindia.in>';
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#13243C">
    <h3 style="color:#043C87">New booking — ${esc(b.trek_name)}</h3>
    <p><b>${esc(b.name)}</b> · ${esc(b.phone)} · ${esc(b.email)}</p>
    <p>${esc(b.travellers)} traveller(s), ${esc(b.sharing)} sharing<br>
    Preferred date: ${esc(b.travel_date || 'not given')}<br>
    Total ${inr(b.total_amount)} · Advance paid <b>${inr(b.advance_paid)}</b> · Balance ${inr(b.balance_due)}<br>
    Payment ID: ${esc(b.razorpay_payment_id)}</p></div>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env('RESEND_API_KEY'), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from, to: process.env.TEAM_EMAIL.split(',').map((x) => x.trim()),
      reply_to: b.email,
      subject: 'New booking: ' + b.name + ' — ' + b.trek_name + ' (' + inr(b.advance_paid) + ' paid)',
      html,
    }),
  });
  if (!res.ok) console.error('Team email error', res.status, await res.text());
}

// ---- Generic email ----
async function sendMail({ to, subject, html, bcc, reply_to }) {
  if (!process.env.RESEND_API_KEY) return { skipped: true };
  const from = process.env.EMAIL_FROM || 'Trip Trek India <bookings@triptrekindia.in>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env('RESEND_API_KEY'), 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: Array.isArray(to) ? to : [to], bcc, reply_to, subject, html }),
  });
  if (!res.ok) console.error('Resend error', res.status, await res.text());
  return { ok: res.ok };
}
const teamList = () => (process.env.TEAM_EMAIL || '').split(',').map((x) => x.trim()).filter(Boolean);
const wrapMail = (title, inner) => `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#13243C">
  <div style="background:#043C87;color:#fff;padding:18px 24px;border-radius:10px 10px 0 0"><div style="font-size:19px;font-weight:700">${title}</div><div style="opacity:.85;font-size:13px">Trip Trek India</div></div>
  <div style="border:1px solid #e3e8ef;border-top:0;padding:22px 24px;border-radius:0 0 10px 10px;font-size:14px;line-height:1.6">${inner}</div></div>`;

// ---- Auth helpers (Supabase JWT from the browser) ----
async function getUser(event) {
  const h = event.headers.authorization || event.headers.Authorization || '';
  const jwt = h.replace(/^Bearer\s+/i, '');
  if (!jwt) return null;
  const res = await fetch(env('SUPABASE_URL').replace(/\/$/, '') + '/auth/v1/user', {
    headers: { apikey: env('SUPABASE_ANON_KEY'), Authorization: 'Bearer ' + jwt },
  });
  if (!res.ok) return null;
  const u = await res.json();
  return u && u.email ? { email: String(u.email).toLowerCase(), id: u.id } : null;
}
async function requireAdmin(event) {
  const u = await getUser(event);
  const admins = (process.env.ADMIN_EMAILS || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean);
  return u && admins.includes(u.email) ? u : null;
}

// Mark the balance paid (idempotent). Used by verify-balance-payment AND the webhook.
async function confirmBalance(orderId, paymentId) {
  const rows = await sb('bookings?balance_order_id=eq.' + encodeURIComponent(orderId) + '&select=*');
  if (!rows || !rows.length) return null;
  let b = rows[0];
  if (b.balance_paid_at) return { booking: b, already: true };
  const amount = b.balance_due;
  const upd = await sb('bookings?id=eq.' + b.id + '&balance_paid_at=is.null', {
    method: 'PATCH',
    body: { balance_paid_at: new Date().toISOString(), balance_paid_amount: amount, balance_payment_id: paymentId, balance_due: 0 },
  });
  if (!upd || !upd.length) return { booking: (await sb('bookings?id=eq.' + b.id + '&select=*'))[0], already: true };
  b = upd[0];
  try {
    await sendMail({
      to: b.email, bcc: process.env.EMAIL_BCC ? [process.env.EMAIL_BCC] : undefined,
      subject: 'Payment received — ' + b.trek_name + ' | Trip Trek India',
      html: wrapMail('Full payment received ✅', `<p>Hi ${esc(b.name)},</p><p>We've received your balance payment of <b>${inr(amount)}</b> for <b>${esc(b.trek_name)}</b>. Your trip is now fully paid — nothing more to pay at onboarding.</p><p>Download your receipt anytime from <a href="${process.env.SITE_URL || 'https://triptrekindia.in'}/account/">My Account</a>.</p>`),
    });
  } catch (e) { console.error('balance email failed', e); }
  try {
    if (teamList().length) await sendMail({ to: teamList(), reply_to: b.email, subject: 'Balance paid: ' + b.name + ' — ' + b.trek_name + ' (' + inr(amount) + ')', html: wrapMail('Balance received', `<p><b>${esc(b.name)}</b> · ${esc(b.phone)}<br>${esc(b.trek_name)} · ${inr(amount)} paid online. Payment ID ${esc(paymentId)}</p>`) });
  } catch (e) { console.error('team balance email failed', e); }
  return { booking: b, already: false };
}

// Mark a booking paid (idempotent). Used by verify-payment AND the webhook.
async function confirmBooking(orderId, paymentId) {
  const rows = await sb('bookings?razorpay_order_id=eq.' + encodeURIComponent(orderId) + '&select=*');
  if (!rows || !rows.length) throw new Error('Booking not found for order ' + orderId);
  let b = rows[0];
  if (b.status === 'confirmed') return { booking: b, alreadyConfirmed: true };

  // Only flip pending -> confirmed once, so concurrent verify + webhook can't double-send mail.
  const updated = await sb(
    'bookings?id=eq.' + b.id + '&status=eq.pending',
    {
      method: 'PATCH',
      body: {
        status: 'confirmed',
        advance_paid: b.advance_due,
        razorpay_payment_id: paymentId,
        confirmed_at: new Date().toISOString(),
      },
    }
  );
  if (!updated || !updated.length) {
    const again = await sb('bookings?id=eq.' + b.id + '&select=*');
    return { booking: again[0], alreadyConfirmed: true };
  }
  b = updated[0];
  // If this booking came from a team payment link, mark the link used.
  try { await sb('payment_links?razorpay_order_id=eq.' + encodeURIComponent(orderId) + '&used_at=is.null', { method: 'PATCH', body: { used_at: new Date().toISOString() }, prefer: 'return=minimal' }); } catch (e) { console.error('link mark failed', e); }
  // Each step is isolated: a failure in one never blocks the booking or the others.
  for (const step of [sendConfirmationEmail, appendToSheet, notifyTeam]) {
    try { await step(b); } catch (e) { console.error(step.name + ' failed', e); }
  }
  return { booking: b, alreadyConfirmed: false };
}

module.exports = {
  DATA, ADVANCE_PER_PERSON, env, json, sb, rzCreateOrder, verifyCheckoutSignature,
  timingSafeEqualHex, confirmBooking, sendConfirmationEmail, crypto,
  sendMail, wrapMail, esc, inr, teamList, getUser, requireAdmin, confirmBalance,
};
