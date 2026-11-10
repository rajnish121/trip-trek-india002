const { json, verifyCheckoutSignature, confirmBooking } = require('./_lib');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  try {
    const { razorpay_order_id: o, razorpay_payment_id: pay, razorpay_signature: sig } = JSON.parse(event.body || '{}');
    if (!o || !pay || !sig) return json(400, { error: 'Missing payment details' });
    if (!verifyCheckoutSignature(o, pay, sig)) return json(400, { error: 'Payment signature invalid' });

    const { booking } = await confirmBooking(o, pay);
    return json(200, {
      status: booking.status,
      trek_name: booking.trek_name,
      travellers: booking.travellers,
      advance_paid: booking.advance_paid,
      balance_due: booking.balance_due,
      email: booking.email,
    });
  } catch (e) {
    console.error(e);
    return json(500, { error: 'Payment received but confirmation failed. Please contact us — your booking is safe.' });
  }
};
