// Runs daily (see netlify.toml). Sends a reminder 7 days and 1 day before the travel date, once each.
const { sb, sendMail, wrapMail, esc, inr } = require('./_lib');

const ist = () => new Date(Date.now() + 5.5 * 3600 * 1000);
const dayNum = (iso) => Math.floor(Date.parse(iso + 'T00:00:00Z') / 86400000);

exports.handler = async () => {
  const todayN = Math.floor(ist().getTime() / 86400000);
  const site = process.env.SITE_URL || 'https://triptrekindia.in';
  const rows = await sb('bookings?status=eq.confirmed&travel_date=not.is.null&select=*');
  let sent = 0;
  for (const b of rows || []) {
    if (b.cancel_requested_at) continue;
    const left = dayNum(b.travel_date) - todayN;
    const key = left === 7 ? 'd7' : left === 1 ? 'd1' : null;
    if (!key) continue;
    const done = b.reminders_sent || {};
    if (done[key]) continue;
    const bal = b.balance_due > 0 ? `<p>Balance to pay: <b>${inr(b.balance_due)}</b> — you can pay it online from <a href="${site}/account/">My Account</a> or at onboarding.</p>` : '<p>You are fully paid. ✅</p>';
    try {
      await sendMail({
        to: b.email,
        subject: (left === 1 ? 'Tomorrow: ' : 'In 7 days: ') + b.trek_name,
        html: wrapMail(left === 1 ? 'Your trip starts tomorrow!' : 'One week to go!',
          `<p>Hi ${esc(b.name)}, your <b>${esc(b.trek_name)}</b> is on <b>${esc(b.travel_date)}</b>.</p>${bal}<p>Download your itinerary and packing list from <a href="${site}/account/">My Account</a>. Our team will share reporting details on WhatsApp. Questions? +91 93109 65771.</p>`),
      });
      done[key] = new Date().toISOString();
      await sb('bookings?id=eq.' + b.id, { method: 'PATCH', body: { reminders_sent: done }, prefer: 'return=minimal' });
      sent++;
    } catch (e) { console.error('reminder failed', b.id, e); }
  }
  console.log('reminders sent', sent);
  return { statusCode: 200, body: JSON.stringify({ sent }) };
};
