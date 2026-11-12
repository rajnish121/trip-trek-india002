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

---

## Departure dates (Fridays)

Every trip departs on a **Friday**, except the trips listed under `anyday` in `netlify/functions/trek-data.json` (currently Chopta Tungnath Chandrashila, Manali 3D, Manali 4D and Kedarkantha), which run on any day.

- On a Friday trip's page the customer picks from the **next 12 Fridays** (a dropdown). On an "any day" trip they pick any date.
- A date is now **required** to pay the advance, and the server rejects non-Friday dates for Friday trips and dates less than 2 days away. The 2-day cut-off is `MIN_LEAD_DAYS` in `netlify/functions/_lib.js` (and `LEAD` in `assets/departures.js`).
- Team payment links are not restricted, so you can still make an exception for a customer.
- **New trip:** it is Friday-only by default. To make a trip run on any day, add its slug to `anyday` in `trek-data.json` and set `data-departure="any"` on its `dateField` div.
