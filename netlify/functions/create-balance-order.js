// Logged-in customer pays the remaining balance online. Amount comes from the database, never the browser.
const { env, json, sb, rzCreateOrder, getUser } = require('./_lib');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  try {
    const user = await getUser(event);
    if (!user) return json(401, { error: 'Please log in again.' });
    const { booking_id } = JSON.parse(event.body || '{}');
    if (!booking_id) return json(400, { error: 'Missing booking' });
    const rows = await sb('bookings?id=eq.' + encodeURIComponent(booking_id) + '&select=*');
    const b = rows && rows[0];
    if (!b || String(b.email).toLowerCase() !== user.email) return json(404, { error: 'Booking not found' });
    if (b.status !== 'confirmed') return json(400, { error: 'This booking is not confirmed yet.' });
    if (b.balance_paid_at || !(b.balance_due > 0)) return json(400, { error: 'Nothing left to pay on this booking.' });
    if (b.cancel_requested_at) return json(400, { error: 'A cancellation is in progress. Please contact us.' });

    const order = await rzCreateOrder(b.balance_due * 100, 'TTIB-' + Date.now(), { type: 'balance', booking_id: String(b.id), email: b.email });
    await sb('bookings?id=eq.' + b.id, { method: 'PATCH', body: { balance_order_id: order.id }, prefer: 'return=minimal' });
    return json(200, { order_id: order.id, amount: b.balance_due * 100, key: env('RAZORPAY_KEY_ID'), trek_name: b.trek_name, name: b.name, email: b.email, phone: b.phone });
  } catch (e) {
    console.error(e);
    return json(500, { error: 'Could not start payment. Please try again or contact us.' });
  }
};
