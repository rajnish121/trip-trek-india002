const { json, verifyCheckoutSignature, confirmBalance } = require('./_lib');
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  try {
    const { razorpay_order_id: o, razorpay_payment_id: pay, razorpay_signature: sig } = JSON.parse(event.body || '{}');
    if (!o || !pay || !sig) return json(400, { error: 'Missing payment details' });
    if (!verifyCheckoutSignature(o, pay, sig)) return json(400, { error: 'Payment signature invalid' });
    const r = await confirmBalance(o, pay);
    if (!r) return json(404, { error: 'Booking not found for this payment' });
    return json(200, { ok: true });
  } catch (e) {
    console.error(e);
    return json(500, { error: 'Payment received but confirmation failed. Please contact us — your payment is safe.' });
  }
};
