// Public: approved reviews for one trip (name, stars, text). No emails or booking details leave the server.
const { sb, DATA } = require('./_lib');

exports.handler = async (event) => {
  const h = { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' };
  const trek = String((event.queryStringParameters || {}).trek || '');
  if (!DATA.names[trek]) return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unknown trip' }) };
  try {
    const rows = (await sb('reviews?trek=eq.' + encodeURIComponent(trek) + '&status=eq.approved&select=display_name,rating,body,approved_at,created_at&order=created_at.desc&limit=50')) || [];
    const count = rows.length, avg = count ? Math.round((rows.reduce((a, r) => a + r.rating, 0) / count) * 10) / 10 : 0;
    return { statusCode: 200, headers: h, body: JSON.stringify({ count, average: avg,
      reviews: rows.map((r) => ({ name: r.display_name, rating: r.rating, text: r.body, date: (r.approved_at || r.created_at || '').slice(0, 10) })) }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count: 0, average: 0, reviews: [] }) };
  }
};
