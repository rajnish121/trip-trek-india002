// Public: start payment for a team-made link. Price comes from the stored link only.
const { DATA, env, json, sb, rzCreateOrder } = require('./_lib');
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  try {
    const c = String(JSON.parse(event.body || '{}').code || '');
    const l = /^[\w-]{6,40}$/.test(c) ? ((await sb('payment_links?code=eq.' + encodeURIComponent(c) + '&select=*')) || [])[0] : null;
    if (!l || l.used_at || l.cancelled_at || new Date(l.expires_at) < new Date()) return json(410, { error: 'This payment link is no longer valid. Please contact us.' });
    const total = l.price_per_person * l.travellers, advance = Math.min(l.advance_per_person * l.travellers, total), balance = total - advance;
    const name = DATA.names[l.trek];

    // Reuse the open order if the customer retries (avoids duplicate pending bookings).
    if (l.razorpay_order_id) {
      const ex = ((await sb('bookings?razorpay_order_id=eq.' + encodeURIComponent(l.razorpay_order_id) + '&select=status')) || [])[0];
      if (ex && ex.status === 'pending') return json(200, { order_id: l.razorpay_order_id, amount: advance * 100, key: env('RAZORPAY_KEY_ID'), trek_name: name, name: l.name, email: l.email, phone: l.phone });
    }
    const order = await rzCreateOrder(advance * 100, 'TTIL-' + Date.now(), { type: 'link', trek: l.trek, email: l.email });
    await sb('bookings', { method: 'POST', prefer: 'return=minimal', body: {
      email: l.email, name: l.name, phone: l.phone, trek: l.trek, trek_name: name, sharing: l.sharing, travellers: l.travellers,
      travel_date: l.travel_date, total_amount: total, advance_due: advance, advance_paid: 0, balance_due: balance,
      status: 'pending', razorpay_order_id: order.id, admin_notes: 'Via payment link' + (l.note ? ': ' + l.note : '') } });
    await sb('payment_links?id=eq.' + l.id, { method: 'PATCH', body: { razorpay_order_id: order.id }, prefer: 'return=minimal' });
    return json(200, { order_id: order.id, amount: advance * 100, key: env('RAZORPAY_KEY_ID'), trek_name: name, name: l.name, email: l.email, phone: l.phone });
  } catch (e) { console.error(e); return json(500, { error: 'Could not start payment. Please try again or contact us.' }); }
};
