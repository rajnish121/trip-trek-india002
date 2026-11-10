// Serves only PUBLIC values (Supabase URL + anon key) so keys live in Netlify env, not in the HTML.
const { env, json } = require('./_lib');
exports.handler = async () => json(200, {
  supabaseUrl: env('SUPABASE_URL'),
  supabaseAnonKey: env('SUPABASE_ANON_KEY'),
});
