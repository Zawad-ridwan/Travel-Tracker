# Setup guide (Phase 1)

Everything here is free. Steps 1 and 2 are required; 3 and 4 are optional during development.
All values go into **`server/.env`** (copy it from `server/.env.example` if you have not yet).

---

## Step 1 — MongoDB Atlas (the database)

1. Go to <https://www.mongodb.com/cloud/atlas/register> and sign up (Google sign-in is fine).
2. Create a cluster: choose the **Free** tier (M0), any provider, and the region closest to you
   (for Bangladesh: Mumbai or Singapore). Name it `travel-tracker`.
3. **Database user:** Atlas asks you to create one. Pick a username (e.g. `tt-app`) and click
   **Autogenerate Secure Password**. Copy the password somewhere safe.
4. **Network access:** add your current IP address. For deploying later, also add
   `0.0.0.0/0` (allow from anywhere) because free hosts change IP addresses. The username and
   password still protect the database.
5. Click **Connect → Drivers**. Copy the connection string. It looks like:

   ```
   mongodb+srv://tt-app:<db_password>@travel-tracker.abc123.mongodb.net/?retryWrites=true&w=majority&appName=travel-tracker
   ```

6. In `server/.env`, set `MONGODB_URI` to that string, with two changes:
   - replace `<db_password>` with the real password
   - add the database name `travel-tracker` after `.net/`:

   ```
   MONGODB_URI=mongodb+srv://tt-app:YourPassword@travel-tracker.abc123.mongodb.net/travel-tracker?retryWrites=true&w=majority&appName=travel-tracker
   ```

   If the password contains special characters like `@ : / ? #`, either generate a new one with
   letters and numbers only, or URL-encode it.

## Step 2 — JWT secret (signs login tokens)

Run this in a terminal and paste the output into `JWT_ACCESS_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Use a **different** secret for the live site. Anyone with this secret could forge logins, so
never commit it or share it.

## Step 3 — Brevo (emails) — optional for now

Without it, verification and password-reset links are **printed in the terminal** where
`npm run dev` runs. Copy the link into your browser to test.

To send real emails (300 a day free):

1. Sign up at <https://www.brevo.com>.
2. Check your sender. The email you signed up with is usually already a confirmed sender.
   To see the list, open the **account menu at the top right** (your organisation's name) →
   **Senders, domains & dedicated IPs → Senders**, or **Transactional → Settings → Senders**
   (Brevo moves its menus now and then). To add another address, click **Add a sender**
   and click the link in the confirmation email Brevo sends.
3. **Account menu → SMTP & API → API keys → Generate a new API key.** Copy it straight away
   (it starts with `xkeysib-` and is shown only once).
4. In `server/.env`:

   ```
   BREVO_API_KEY=xkeysib-...
   EMAIL_FROM_ADDRESS=the-sender-email-you-confirmed@gmail.com
   EMAIL_FROM_NAME=Travel Tracker
   ```

Emails from a Gmail address sent through Brevo may land in spam. That is fine for a project; a
custom domain fixes it later.

## Step 4 — Cloudinary (profile photos) — optional

Without it, everything works except uploading a profile photo (the app shows initials instead).

1. Sign up at <https://cloudinary.com/users/register_free>.
2. On the dashboard (**Programmable Media → Dashboard**), copy **Cloud name**, **API Key** and
   **API Secret** into `server/.env`:

   ```
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```

## Step 5 — Run it

```bash
npm install
npm run dev
```

You should see `MongoDB connected` and `API running on http://localhost:4000`.
Open <http://localhost:5173>, sign up, and finish the welcome quiz.

## Step 6 — Make yourself an admin

After signing up on the website:

```bash
npm run make-admin -- you@example.com
```

Log out and back in. An **Admin** link appears in the sidebar.
This uses the database in `server/.env`, so it also works for the live site's database.

## Troubleshooting

| Message | Fix |
| --- | --- |
| `MONGODB_URI is missing` / `JWT_ACCESS_SECRET must be at least 32 characters` | Fill in `server/.env` (steps 1–2). |
| `Could not connect to MongoDB` | Check the password in the URI, and that your IP is in Atlas → Network Access. |
| `querySrv ENOTFOUND` | Your network blocks DNS lookups for `mongodb+srv`. Try another network, or in Atlas choose **Connect → Drivers** with an older driver version to get a `mongodb://` address. |
| Tests are slow the first time | They download a small MongoDB for testing (~100 MB) once. |
| Sign-up works but no email arrives | Without Brevo, look in the terminal for the link. With Brevo, check spam and that the sender is confirmed. |
| "Exchange rates are unavailable" | The server could not reach open.er-api.com or api.frankfurter.dev (a firewall or no internet). Expenses in the trip's own currency still work. |
