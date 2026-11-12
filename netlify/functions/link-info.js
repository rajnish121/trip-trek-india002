// Public: details of a payment link (so the customer can see what they're paying for).
const { DATA, json, sb } = require('./_lib');
exports.handler = async (event) => {
  try {
    const c = String((event.queryStringParameters || {}).c || '');
    if (!/^[\w-]{6,40}$/.test(c)) return json(404, { error: 'This link is not valid.' });
    const l = ((await sb('payment_links?code=eq.' + encodeURIComponent(c) + '&select=*')) || [])[0];
    if (!l) return json(404, { error: 'This link is not valid.' });
    if (l.used_at) return json(410, { error: 'This payment link has already been used.' });
    if (l.cancelled_at) return json(410, { error: 'This payment link was cancelled. Please contact us.' });
    if (new Date(l.expires_at) < new Date()) return json(410, { error: 'This payment link has expired. Please contact us for a new one.' });
    const total = l.price_per_person * l.travellers, adv = Math.min(l.advance_per_person * l.travellers, total);
    return json(200, { trek_name: DATA.names[l.trek], sharing: l.sharing, travellers: l.travellers, name: l.name, travel_date: l.travel_date,
      price_per_person: l.price_per_person, total, advance: adv, balance: total - adv, note: l.note });
  } catch (e) { console.error(e); return json(500, { error: 'Something went wrong. Please try again.' }); }
};
