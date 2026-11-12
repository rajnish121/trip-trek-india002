// Travellers: list their own reviews and submit one per booking (held for team approval).
const { json, sb, getUser, DATA, sendMail, wrapMail, teamList, esc } = require('./_lib');

const todayIST = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  try {
    const user = await getUser(event);
    if (!user) return json(401, { error: 'Please log in again.' });
    const p = JSON.parse(event.body || '{}');

    if (p.action === 'mine') {
      const rows = await sb('reviews?email=eq.' + encodeURIComponent(user.email) + '&select=booking_id,status,rating,body,display_name');
      return json(200, { reviews: rows || [] });
    }

    // submit
    const bookingId = String(p.booking_id || '');
    const rating = parseInt(p.rating, 10);
    const body = String(p.body || '').trim();
    const name = String(p.name || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    if (!bookingId) return json(400, { error: 'Missing booking.' });
    if (!(rating >= 1 && rating <= 5)) return json(400, { error: 'Please choose a star rating.' });
    if (body.length < 20) return json(400, { error: 'Please write at least a couple of sentences (20 characters).' });
    if (body.length > 1000) return json(400, { error: 'Please keep your review under 1000 characters.' });
    if (name.length < 2) return json(400, { error: 'Please enter the name to show with your review.' });

    const b = (await sb('bookings?id=eq.' + encodeURIComponent(bookingId) + '&email=eq.' + encodeURIComponent(user.email) + '&select=id,trek,trek_name,status,travel_date'))[0];
    if (!b || b.status !== 'confirmed') return json(403, { error: 'We could not find a confirmed booking for this review.' });
    if (!b.travel_date || b.travel_date > todayIST()) return json(403, { error: 'You can review a trip after it has taken place.' });
    if (!DATA.names[b.trek]) return json(400, { error: 'Unknown trip.' });
    const dup = await sb('reviews?booking_id=eq.' + encodeURIComponent(b.id) + '&select=id');
    if (dup && dup.length) return json(409, { error: 'You have already reviewed this trip.' });

    await sb('reviews', { method: 'POST', prefer: 'return=minimal', body: {
      booking_id: String(b.id), trek: b.trek, email: user.email, display_name: name, rating, body } });
    const to = teamList();
    if (to.length) sendMail({ to, subject: 'New review to approve — ' + (b.trek_name || b.trek),
      html: wrapMail('New review waiting', `<p><b>${esc(name)}</b> rated <b>${rating}/5</b> for ${esc(b.trek_name || b.trek)}:</p><p style="background:#F4F7FB;padding:10px 12px;border-radius:8px">${esc(body)}</p><p>Open the admin portal → Reviews to approve or reject it.</p>`) }).catch((e) => console.error(e));
    return json(200, { ok: true });
  } catch (e) {
    console.error(e);
    return json(500, { error: 'Could not save your review right now. Please try again.' });
  }
};
