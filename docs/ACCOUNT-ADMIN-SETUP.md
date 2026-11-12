# Setup: My Account upgrade, Team Admin, WhatsApp, Newsletter

1. **Supabase → SQL Editor**: paste the contents of `supabase/migration2.sql` and click Run (once).
2. **Netlify → Site settings → Environment variables**, add:
   - `ADMIN_EMAILS` = team emails allowed into /admin/ (comma separated)  ← required for admin
3. Merge the pull request; Netlify redeploys. Admin page: `/admin/` (log in with a code sent to an ADMIN_EMAILS address).
4. Razorpay webhook already set up also covers balance payments (no change).

---

## Traveller reviews (added later)

**One-time setup:** in Supabase → SQL Editor, run the whole of `supabase/migration4.sql` (creates the `reviews` table). Nothing else is needed; the same environment variables are used.

**How it works**
1. After a trip, the traveller logs in to **My Account** and taps **Write a review** on that booking (stars + a few sentences).
2. The review is saved as *pending*. The team gets an email (to `TEAM_EMAIL`) saying a review is waiting.
3. In the **admin portal → Reviews** tab you read it, fix any typo if needed, and tap **Approve** (or **Reject** / **Delete**).
4. Approved reviews show on that trip's page under "What Travellers Say" within a few minutes. A trip with no approved reviews shows nothing at all.

**Rules built in**
- Only a *confirmed* booking can be reviewed, only by the email that made the booking, and only **one review per booking**.
- A review can only be written **after the travel date has passed**. Set the real **Travel date** on each booking in the admin portal (Bookings → open the booking → Travel date → Save); if it is blank, the "Write a review" button does not appear.
- Reviews are never created or edited by the website itself; only real travellers' submissions appear.
