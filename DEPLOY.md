# Deploying for free on Render

The whole app runs as **one** Render web service: the Express API also serves the built React
website. One address means login cookies work in every browser (including Safari on iPhone)
without any cross-site tricks.

Render's free plan sleeps after 15 minutes without visitors. The first visit after that takes
about 30–60 seconds; later visits are fast.

## Before you start

- Your code is on GitHub, and `npm test` passes.
- MongoDB Atlas has `0.0.0.0/0` in **Network Access** (see SETUP.md, step 1).
- You have a **new** `JWT_ACCESS_SECRET` for the live site (SETUP.md, step 2).

## Steps

1. Sign up at <https://render.com> with your GitHub account.
2. **New → Web Service**, pick your `travel-tracker` repository.
3. Fill in:

   | Field | Value |
   | --- | --- |
   | Name | `travel-tracker` (your address becomes `travel-tracker.onrender.com`, or similar if taken) |
   | Branch | `main` |
   | Runtime | Node |
   | Build command | `npm install --include=dev && npm run build` |
   | Start command | `npm start` |
   | Instance type | Free |

4. **Environment variables** (Advanced → Add environment variable):

   | Key | Value |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `NODE_VERSION` | `22` |
   | `SERVE_CLIENT` | `true` |
   | `MONGODB_URI` | your Atlas connection string |
   | `JWT_ACCESS_SECRET` | the new long secret |
   | `APP_URL` | `https://YOUR-SERVICE.onrender.com` (fill in after the first deploy, then redeploy) |
   | `CLIENT_ORIGIN` | the same address as `APP_URL` |
   | `BREVO_API_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME` | from SETUP.md step 3 |
   | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | from SETUP.md step 4 |

   Render sets `PORT` itself; do not add it.

5. Click **Create Web Service**. The first build takes a few minutes. When the log shows
   `MongoDB connected` and `API running`, open your address.
6. Check <https://YOUR-SERVICE.onrender.com/api/health>: it should say `"status":"ok"`.
7. Sign up on the live site, then make yourself admin from your laptop (your local `.env` points
   at the same Atlas database):

   ```bash
   npm run make-admin -- you@example.com
   ```

## Every update after that

Merge a pull request into `main` and Render redeploys automatically.

## Keep it awake (optional)

Create a free monitor at <https://uptimerobot.com> that checks `/api/health` every 10 minutes.
This keeps the free service from sleeping during demos. Render's free plan includes enough
monthly hours for one always-on service.
