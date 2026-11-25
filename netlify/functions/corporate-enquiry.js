// Corporate / group enquiry from /corporate.html. No database: the team gets an email, the sender gets a confirmation.
const { json, sendMail, teamList, wrapMail, esc } = require('./_lib');

const clean = (v, n) => String(v || '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  try {
    const p = JSON.parse(event.body || '{}');
    if (p.website) return json(200, { ok: true }); // honeypot
    const company = clean(p.company, 100), name = clean(p.name, 80), email = clean(p.email, 120).toLowerCase();
    const phone = clean(p.phone, 20), size = clean(p.size, 30), when = clean(p.when, 60), interest = clean(p.interest, 60), message = clean(p.message, 1200);
    if (company.length < 2 || name.length < 2) return json(400, { error: 'Please enter your company and your name.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: 'Please enter a valid work email.' });
    if (!/^[+\d][\d\s-]{6,17}$/.test(phone)) return json(400, { error: 'Please enter a valid phone number.' });
    if (!teamList().length) return json(500, { error: 'Could not send right now. Please WhatsApp us on +91 93109 65771.' });

    const row = (k, v) => `<tr><td style="padding:4px 14px 4px 0;color:#5A6B80">${k}</td><td style="padding:4px 0"><b>${esc(v || '—')}</b></td></tr>`;
    const sent = await sendMail({
      to: teamList(), reply_to: email,
      subject: 'Corporate enquiry: ' + company + ' (' + (size || 'size n/a') + ')',
      html: wrapMail('New corporate enquiry',
        `<table style="font-size:14px">${row('Company', company)}${row('Contact', name)}${row('Email', email)}${row('Phone', phone)}${row('Group size', size)}${row('Preferred time', when)}${row('Interested in', interest)}</table>
         <p style="margin-top:12px;white-space:pre-wrap">${esc(message || '(no message)')}</p>`),
    });
    if (!sent || !sent.ok) return json(500, { error: 'Could not send right now. Please WhatsApp us on +91 93109 65771.' });

    await sendMail({
      to: email,
      subject: 'We got your enquiry — Trip Trek India',
      html: wrapMail('Thanks, ' + esc(name), `<p>We have received your enquiry for <b>${esc(company)}</b>. Our team will get back to you shortly with options and a quote. For anything urgent, WhatsApp us on +91 93109 65771.</p>`),
    }).catch((e) => console.error(e));
    return json(200, { ok: true });
  } catch (e) {
    console.error(e);
    return json(500, { error: 'Could not send right now. Please WhatsApp us on +91 93109 65771.' });
  }
};
