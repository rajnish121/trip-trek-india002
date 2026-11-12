const { json, sb, env, crypto, sendMail, wrapMail, esc } = require('./_lib');

const token = (email) => crypto.createHmac('sha256', env('SUPABASE_SERVICE_ROLE_KEY')).update('unsub:' + email).digest('hex').slice(0, 32);

exports.token = token;
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  try {
    const p = JSON.parse(event.body || '{}');
    if (p.website) return json(200, { ok: true }); // honeypot
    const email = String(p.email || '').trim().toLowerCase();
    const name = String(p.name || '').trim().slice(0, 80) || null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) return json(400, { error: 'Please enter a valid email.' });
    const existing = await sb('subscribers?email=eq.' + encodeURIComponent(email) + '&select=id,unsubscribed_at');
    if (existing && existing.length) {
      if (existing[0].unsubscribed_at) await sb('subscribers?id=eq.' + existing[0].id, { method: 'PATCH', body: { unsubscribed_at: null }, prefer: 'return=minimal' });
      return json(200, { ok: true });
    }
    await sb('subscribers', { method: 'POST', body: { email, name, source: String(p.source || 'website').slice(0, 40) }, prefer: 'return=minimal' });
    const site = process.env.SITE_URL || 'https://triptrekindia.in';
    await sendMail({
      to: email, subject: "You're on the list — Trip Trek India",
      html: wrapMail('Welcome aboard 🏔️', `<p>Thanks for subscribing${name ? ', ' + esc(name) : ''}! We'll send you new departures, offers and travel ideas — never spam.</p><p><a href="${site}/upcoming-trips.html" style="background:#EF3006;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:700">See upcoming trips</a></p><p style="font-size:12px;color:#5A6B80"><a href="${site}/.netlify/functions/unsubscribe?e=${encodeURIComponent(email)}&t=${token(email)}">Unsubscribe</a></p>`),
    }).catch((e) => console.error(e));
    return json(200, { ok: true });
  } catch (e) {
    console.error(e);
    return json(500, { error: 'Could not subscribe right now. Please try again.' });
  }
};
