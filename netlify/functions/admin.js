// Team admin API. Every call must carry a Supabase login whose email is in ADMIN_EMAILS.
const { json, sb, requireAdmin, sendConfirmationEmail, whatsappConfirmation, DATA } = require('./_lib');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  try {
    const admin = await requireAdmin(event);
    if (!admin) return json(403, { error: 'Not authorised' });
    const p = JSON.parse(event.body || '{}');

    if (p.action === 'bookings') {
      const rows = await sb('bookings?select=*&order=created_at.desc&limit=1000');
      return json(200, { bookings: rows, trips: DATA.names });
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
    if (p.action === 'resend') {
      const b = (await sb('bookings?id=eq.' + encodeURIComponent(p.id || '') + '&select=*'))[0];
      if (!b || b.status !== 'confirmed') return json(400, { error: 'Only confirmed bookings' });
      await sendConfirmationEmail(b);
      if (p.whatsapp) await whatsappConfirmation(b);
      return json(200, { ok: true });
    }
    return json(400, { error: 'Unknown action' });
  } catch (e) {
    console.error(e);
    return json(500, { error: 'Server error' });
  }
};
