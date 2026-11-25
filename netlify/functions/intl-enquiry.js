// Notify-me request from /international.html (Trip Trek International, coming soon). No database: the team gets an email, the sender gets a confirmation.
const { json, sendMail, teamList, wrapMail, esc } = require('./_lib');

const clean = (v, n) => String(v || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  try {
    const p = JSON.parse(event.body || '{}');
    if (p.website) return json(200, { ok: true }); // honeypot
    const name = clean(p.name, 80), email = clean(p.email, 120).toLowerCase();
    const phone = clean(p.phone, 20), size = clean(p.size, 30), when = clean(p.when, 60), dest = clean(p.destination, 60), message = clean(p.message, 1200);
    if (name.length < 2) return json(400, { error: 'Please enter your name.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: 'Please enter a valid email.' });
    if (!/^[+\d][\d\s-]{6,17}$/.test(phone)) return json(400, { error: 'Please enter a valid phone number.' });
    if (!teamList().length) return json(500, { error: 'Could not send right now. Please WhatsApp us on +91 93109 65771.' });

    const row = (k, v) => `<tr><td style="padding:4px 14px 4px 0;color:#5A6B80">${k}</td><td style="padding:4px 0"><b>${esc(v || '—')}</b></td></tr>`;
    const sent = await sendMail({
      to: teamList(), reply_to: email,
      subject: 'International waitlist: ' + name + ' → ' + (dest || 'not sure'),
      html: wrapMail('New international waitlist request',
        `<table style="font-size:14px">${row('Name', name)}${row('Email', email)}${row('Phone', phone)}${row('Group size', size)}${row('Preferred time', when)}${row('Destination', dest)}</table>
         <p style="margin-top:12px;white-space:pre-wrap">${esc(message || '(no message)')}</p>`),
    });
    if (!sent || !sent.ok) return json(500, { error: 'Could not send right now. Please WhatsApp us on +91 93109 65771.' });

    await sendMail({
      to: email,
      subject: 'You are on the list — Trip Trek International',
      html: wrapMail('Thanks, ' + esc(name), `<p>Thanks for your interest in international trips (${esc(dest || 'destination not decided')}). We will message you as soon as they open. For anything urgent, WhatsApp us on +91 93109 65771.</p>`),
    }).catch((e) => console.error(e));
    return json(200, { ok: true });
  } catch (e) {
    console.error(e);
    return json(500, { error: 'Could not send right now. Please WhatsApp us on +91 93109 65771.' });
  }
};
