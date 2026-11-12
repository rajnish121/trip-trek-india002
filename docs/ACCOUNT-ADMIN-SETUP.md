# Setup: My Account upgrade, Team Admin, WhatsApp, Newsletter

1. **Supabase → SQL Editor**: paste the contents of `supabase/migration2.sql` and click Run (once).
2. **Netlify → Site settings → Environment variables**, add:
   - `ADMIN_EMAILS` = team emails allowed into /admin/ (comma separated)  ← required for admin
   - `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_TEMPLATE_CONFIRM` (and optional `WHATSAPP_TEMPLATE_REMINDER`, `WHATSAPP_LANG`) ← WhatsApp
3. Merge the pull request; Netlify redeploys. Admin page: `/admin/` (log in with a code sent to an ADMIN_EMAILS address).
4. Razorpay webhook already set up also covers balance payments (no change).

WhatsApp confirmation template body (8-param order): `{{1}}` name, `{{2}}` trip, `{{3}}` travellers, `{{4}}` date, `{{5}}` advance paid, `{{6}}` balance.
Reminder template: `{{1}}` name, `{{2}}` trip, `{{3}}` date, `{{4}}` "tomorrow" / "in 7 days".
