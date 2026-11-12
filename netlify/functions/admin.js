// Team admin API. Every call must carry a Supabase login whose email is in ADMIN_EMAILS.
const { json, sb, crypto, requireAdmin, sendConfirmationEmail, DATA, ADVANCE_PER_PERSON } = require('./_lib');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  try {
    const admin = await requireAdmin(event);
    if (!admin) return json(403, { error: 'Not authorised' });
    const p = JSON.parse(event.body || '{}');

    if (p.action === 'bookings') {
      const rows = await sb('bookings?select=*&order=created_at.desc&limit=1000');
      return json(200, { bookings: rows, trips: DATA.names, prices: DATA.prices, advance: ADVANCE_PER_PERSON });
    }
    if (p.action === 'subscribers') {
      const rows = await sb('subscribers?select=*&order=created_at.desc&limit=5000');
      return json(200, { subscribers: rows });
    }
    if (p.action === 'update') {
      const id = encodeURIComponent(p.id || '');
      if (!id) return json(400, { error: 'Missing id' });
      const f = p.fields || {};
      const patch = {};
      if (typeof f.admin_notes === 'string') patch.admin_notes = f.admin_notes.slice(0, 2000);
      if (f.travel_date === null || /^\d{4}-\d{2}-\d{2}$/.test(f.travel_date || '')) patch.travel_date = f.travel_date;
      if (f.status === 'cancelled' || f.status === 'confirmed') patch.status = f.status;
      if (f.clear_request) { patch.cancel_requested_at = null; patch.cancel_reason = null; }
      if (f.balance_received_offline) {
        const cur = (await sb('bookings?id=eq.' + id + '&select=balance_due,balance_paid_at'))[0];
        if (cur && !cur.balance_paid_at && cur.balance_due > 0) {
          patch.balance_paid_at = new Date().toISOString();
          patch.balance_paid_amount = cur.balance_due;
          patch.balance_payment_id = 'offline-by-' + admin.email;
          patch.balance_due = 0;
        }
      }
      if (!Object.keys(patch).length) return json(400, { error: 'Nothing to update' });
      const r = await sb('bookings?id=eq.' + id, { method: 'PATCH', body: patch });
      return json(200, { booking: r && r[0] });
    }
    if (p.action === 'reviews') {
      const rows = await sb('reviews?select=*&order=created_at.desc&limit=500');
      return json(200, { reviews: rows || [], trips: DATA.names });
    }
    if (p.action === 'review_set') {
      const id = encodeURIComponent(p.id || '');
      if (!id) return json(400, { error: 'Missing id' });
      if (p.status === 'delete') { await sb('reviews?id=eq.' + id, { method: 'DELETE', prefer: 'return=minimal' }); return json(200, { ok: true }); }
      if (!['approved', 'rejected', 'pending'].includes(p.status)) return json(400, { error: 'Bad status' });
      const patch = { status: p.status, approved_at: p.status === 'approved' ? new Date().toISOString() : null };
      if (typeof p.display_name === 'string' && p.display_name.trim().length >= 2) patch.display_name = p.display_name.trim().slice(0, 40);
      if (typeof p.body === 'string' && p.body.trim().length >= 10) patch.body = p.body.trim().slice(0, 1000);
      const r = await sb('reviews?id=eq.' + id, { method: 'PATCH', body: patch });
      return json(200, { review: r && r[0] });
    }
    if (p.action === 'links') {
      const rows = await sb('payment_links?select=*&order=created_at.desc&limit=200');
      return json(200, { links: rows });
    }
    if (p.action === 'create_link') {
      const trek = String(p.trek || ''), sharing = String(p.sharing || '');
      const travellers = parseInt(p.travellers, 10), price = parseInt(p.price, 10);
      const name = String(p.name || '').trim(), email = String(p.email || '').trim().toLowerCase();
      const phone = String(p.phone || '').replace(/\s|\+91|^0/g, '');
      const days = Math.min(Math.max(parseInt(p.expiry_days, 10) || 3, 1), 30);
      let adv = parseInt(p.advance, 10); if (!(adv >= 500)) adv = ADVANCE_PER_PERSON;
      if (!(DATA.prices[trek] && DATA.prices[trek][sharing])) return json(400, { error: 'Pick a trip and sharing type' });
      if (!(travellers >= 1 && travellers <= 20)) return json(400, { error: 'Travellers must be 1–20' });
      if (!(price >= 1000 && price <= 200000)) return json(400, { error: 'Enter a valid price per person' });
      if (adv > price) adv = price;
      if (name.length < 2) return json(400, { error: 'Enter the customer name' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: 'Enter a valid customer email' });
      if (!/^[6-9]\d{9}$/.test(phone)) return json(400, { error: 'Enter a valid 10-digit mobile number' });
      const code = crypto.randomBytes(7).toString('base64url');
      const row = await sb('payment_links', { method: 'POST', body: {
        code, trek, sharing, travellers, name, email, phone, price_per_person: price, advance_per_person: adv,
        travel_date: /^\d{4}-\d{2}-\d{2}$/.test(p.date || '') ? p.date : null,
        note: String(p.note || '').slice(0, 300) || null, created_by: admin.email,
        expires_at: new Date(Date.now() + days * 86400000).toISOString() } });
      return json(200, { link: row[0], url: (process.env.SITE_URL || 'https://triptrekindia.in') + '/pay/?c=' + code });
    }
    if (p.action === 'cancel_link') {
      await sb('payment_links?id=eq.' + encodeURIComponent(p.id || '') + '&used_at=is.null', { method: 'PATCH', body: { cancelled_at: new Date().toISOString() }, prefer: 'return=minimal' });
      return json(200, { ok: true });
    }
    if (p.action === 'resend') {
      const b = (await sb('bookings?id=eq.' + encodeURIComponent(p.id || '') + '&select=*'))[0];
      if (!b || b.status !== 'confirmed') return json(400, { error: 'Only confirmed bookings' });
      await sendConfirmationEmail(b);
      return json(200, { ok: true });
    }
    return json(400, { error: 'Unknown action' });
  } catch (e) {
    console.error(e);
    return json(500, { error: 'Server error' });
  }
};
