const { DATA, ADVANCE_PER_PERSON, env, json, sb, rzCreateOrder, departureError } = require('./_lib');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  try {
    const p = JSON.parse(event.body || '{}');
    const trek = String(p.trek || '');
    const sharing = String(p.sharing || '');
    const travellers = parseInt(p.travellers, 10);
    const name = String(p.name || '').trim();
    const email = String(p.email || '').trim().toLowerCase();
    const phone = String(p.phone || '').replace(/\s|\+91|^0/g, '');
    const travelDate = p.date ? String(p.date).slice(0, 10) : null;

    if (DATA.closed && DATA.closed[trek]) {
      return json(400, { error: 'Bookings for this trip are closed right now (' + DATA.closed[trek] + '). Please message us on WhatsApp to be notified.' });
    }
    const pricePer = DATA.prices[trek] && DATA.prices[trek][sharing];
    if (!pricePer) return json(400, { error: 'Unknown trek or sharing type' });
    if (!(travellers >= 1 && travellers <= 20)) return json(400, { error: 'Travellers must be 1–20' });
    if (name.length < 2) return json(400, { error: 'Please enter your name' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: 'Please enter a valid email' });
    if (!/^[6-9]\d{9}$/.test(phone)) return json(400, { error: 'Please enter a valid 10-digit mobile number' });
    const dateErr = departureError(trek, travelDate);
    if (dateErr) return json(400, { error: dateErr });

    // All amounts are computed here, never trusted from the browser.
    const total = pricePer * travellers;
    const advance = ADVANCE_PER_PERSON * travellers;
    const balance = total - advance;

    const order = await rzCreateOrder(advance * 100, 'TTI-' + Date.now(), { trek, sharing, travellers: String(travellers), email });

    await sb('bookings', {
      method: 'POST',
      body: {
        email, name, phone,
        trek, trek_name: DATA.names[trek], sharing, travellers,
        travel_date: travelDate,
        total_amount: total, advance_due: advance, advance_paid: 0, balance_due: balance,
        status: 'pending',
        razorpay_order_id: order.id,
      },
      prefer: 'return=minimal',
    });

    return json(200, {
      order_id: order.id,
      amount: advance * 100,
      key: env('RAZORPAY_KEY_ID'),
      trek_name: DATA.names[trek],
    });
  } catch (e) {
    console.error(e);
    return json(500, { error: 'Could not start payment. Please try again or contact us on WhatsApp.' });
  }
};
