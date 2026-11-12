// Live Google reviews via Places API (New). Hidden on the site unless configured. Reviews shown exactly as Google returns them.
exports.handler = async () => {
  const key = process.env.GOOGLE_PLACES_API_KEY, id = process.env.GOOGLE_PLACE_ID;
  const h = { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=21600' };
  if (!key || !id) return { statusCode: 200, headers: h, body: JSON.stringify({ configured: false }) };
  try {
    const res = await fetch('https://places.googleapis.com/v1/places/' + encodeURIComponent(id), {
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'displayName,rating,userRatingCount,googleMapsUri,reviews' },
    });
    if (!res.ok) throw new Error('Places ' + res.status + ' ' + (await res.text()));
    const d = await res.json();
    const reviews = (d.reviews || []).map((r) => ({
      author: r.authorAttribution && r.authorAttribution.displayName,
      photo: r.authorAttribution && r.authorAttribution.photoUri,
      url: r.authorAttribution && r.authorAttribution.uri,
      rating: r.rating, when: r.relativePublishTimeDescription,
      text: (r.originalText && r.originalText.text) || (r.text && r.text.text) || '',
    })).filter((r) => r.text);
    return { statusCode: 200, headers: h, body: JSON.stringify({
      configured: true, rating: d.rating, count: d.userRatingCount, mapsUri: d.googleMapsUri,
      writeUrl: 'https://search.google.com/local/writereview?placeid=' + encodeURIComponent(id), reviews }) };
  } catch (e) {
    console.error(e);
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ configured: false }) };
  }
};
