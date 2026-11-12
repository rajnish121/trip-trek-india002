# Setup: My Account upgrade, Team Admin, WhatsApp, Newsletter

1. **Supabase → SQL Editor**: paste the contents of `supabase/migration2.sql` and click Run (once).
2. **Netlify → Site settings → Environment variables**, add:
   - `ADMIN_EMAILS` = team emails allowed into /admin/ (comma separated)  ← required for admin
3. Merge the pull request; Netlify redeploys. Admin page: `/admin/` (log in with a code sent to an ADMIN_EMAILS address).
4. Razorpay webhook already set up also covers balance payments (no change).
