// Customer asks to cancel or change a booking. We never auto-refund: the team handles it per the refund policy.
const { json, sb, getUser, sendMail, teamList, wrapMail, esc, inr } = require('./_lib');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  try {
    const user = await getUser(event);
    if (!user) return json(401, { error: 'Please log in again.' });
    const p = JSON.parse(event.body || '{}');
    const type = p.type === 'change' ? 'change' : 'cancel';
    const message = String(p.message || '').trim().slice(0, 600);
    if (message.length < 3) return json(400, { error: 'Please tell us a little about your request.' });
    const rows = await sb('bookings?id=eq.' + encodeURIComponent(p.booking_id || '') + '&select=*');
    const b = rows && rows[0];
    if (!b || String(b.email).toLowerCase() !== user.email) return json(404, { error: 'Booking not found' });

    await sb('bookings?id=eq.' + b.id, {
      method: 'PATCH', prefer: 'return=minimal',
      body: { cancel_requested_at: new Date().toISOString(), cancel_reason: (type === 'change' ? '[CHANGE] ' : '[CANCEL] ') + message },
    });
    if (teamList().length) {
      await sendMail({
        to: teamList(), reply_to: b.email,
        subject: (type === 'change' ? 'Change request: ' : 'Cancellation request: ') + b.name + ' — ' + b.trek_name,
        html: wrapMail(type === 'change' ? 'Change request' : 'Cancellation request',
          `<p><b>${esc(b.name)}</b> · ${esc(b.phone)} · ${esc(b.email)}</p><p>${esc(b.trek_name)} · ${esc(b.travellers)} traveller(s) · date ${esc(b.travel_date || 'TBC')}<br>Advance paid ${inr(b.advance_paid)}</p><p><i>${esc(message)}</i></p>`),
      }).catch((e) => console.error(e));
    }
    await sendMail({
      to: b.email,
      subject: 'We got your request — ' + b.trek_name,
      html: wrapMail('Request received', `<p>Hi ${esc(b.name)}, we've received your ${type} request for <b>${esc(b.trek_name)}</b>. Our team will contact you shortly. Refunds, if any, follow our refund policy.</p>`),
    }).catch((e) => console.error(e));
    return json(200, { ok: true });
  } catch (e) {
    console.error(e);
    return json(500, { error: 'Could not send your request. Please call us.' });
  }
};
