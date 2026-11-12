// Backup path: confirms the booking even if the customer closes the tab after paying.
const { env, json, crypto, timingSafeEqualHex, confirmBooking, confirmBalance } = require('./_lib');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  try {
    const sig = event.headers['x-razorpay-signature'];
    const expected = crypto.createHmac('sha256', env('RAZORPAY_WEBHOOK_SECRET')).update(event.body).digest('hex');
    if (!sig || !timingSafeEqualHex(expected, sig)) return json(400, { error: 'bad signature' });

    const payload = JSON.parse(event.body);
    if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
      const pay = payload.payload.payment && payload.payload.payment.entity;
      if (pay && pay.order_id) {
        // A balance order matches balance_order_id; anything else is an advance payment.
        const handled = await confirmBalance(pay.order_id, pay.id);
        if (!handled) await confirmBooking(pay.order_id, pay.id);
      }
    }
    return json(200, { ok: true });
  } catch (e) {
    console.error(e);
    return json(500, { error: 'webhook error' }); // Razorpay will retry
  }
};
