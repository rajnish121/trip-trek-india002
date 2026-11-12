const { sb, crypto, env, timingSafeEqualHex } = require('./_lib');
const page = (t) => ({ statusCode: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' }, body: `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:Arial;text-align:center;padding:60px 20px;color:#13243C"><h2>${t}</h2><p><a href="/" style="color:#043C87">Back to Trip Trek India</a></p>` });
exports.handler = async (event) => {
  try {
    const q = event.queryStringParameters || {};
    const email = String(q.e || '').toLowerCase();
    const exp = crypto.createHmac('sha256', env('SUPABASE_SERVICE_ROLE_KEY')).update('unsub:' + email).digest('hex').slice(0, 32);
    if (!email || !q.t || !timingSafeEqualHex(exp, q.t)) return page('This unsubscribe link is not valid.');
    await sb('subscribers?email=eq.' + encodeURIComponent(email), { method: 'PATCH', body: { unsubscribed_at: new Date().toISOString() }, prefer: 'return=minimal' });
    return page("You've been unsubscribed.");
  } catch (e) { console.error(e); return page('Something went wrong. Please email us to unsubscribe.'); }
};
