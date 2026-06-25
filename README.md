# NexioSol — Site + Lead Backend

Static frontend, Vercel serverless API, and MongoDB Atlas lead storage. Everything
lives in one repo and deploys as one Vercel project (no second host).

```
.
├── index.html          # Home page
├── portfolio.html      # Portfolio, filterable by service
├── dashboard.html      # Password-gated leads dashboard
├── css/styles.css      # All styles (split out of the HTML)
├── js/
│   ├── main.js         # Site interactions + form submit + booking modal
│   └── dashboard.js    # Dashboard login + table
├── api/
│   ├── leads.js        # POST = save lead · GET = list leads (auth)
│   └── _db.js          # Cached MongoDB connection
├── package.json
├── vercel.json
└── .env.example        # Copy to .env.local for local dev
```

---

## What got wired up

- **CSS and JS are now separate files** (they were inline in one HTML file).
- **The contact form actually submits** now — it POSTs to `/api/leads`, which stores
  the lead in MongoDB. Before, it just showed the success screen without saving anything.
- **Dashboard at `/dashboard`** — enter your password to see every submission in a table,
  with search and basic stats. Protected server-side.
- **"Book a call"** buttons (nav + footer + portfolio CTA) open a modal that links to your
  Cal.com / Calendly page. **You need to paste your real booking link** — see step 5.
- **Portfolio page** with a service filter (All / Software / AI / Systems). One page, as
  discussed — split into per-service pages later when each has enough projects to fill it.

---

## Setup (one time, ~15 min)

### 1. MongoDB Atlas (free tier)
1. Create an account at https://www.mongodb.com/cloud/atlas and make a free **M0** cluster.
2. **Database Access** → add a database user (username + password). Save the password.
3. **Network Access** → add IP `0.0.0.0/0` (allow from anywhere — Vercel's IPs are dynamic).
4. **Connect → Drivers** → copy the connection string. It looks like:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   Put your real username and password into it.

### 2. Set environment variables on Vercel
In your Vercel project → **Settings → Environment Variables**, add three:

| Name                 | Value                                                |
|----------------------|------------------------------------------------------|
| `MONGODB_URI`        | the connection string from step 1                    |
| `MONGODB_DB`         | `nexiosol`                                            |
| `DASHBOARD_PASSWORD` | a long random password (this is your dashboard login)|

Add them for **Production** (and Preview if you want). Redeploy after adding.

### 3. Deploy
Push this folder to your existing repo. Vercel auto-detects the `/api` functions and
`mongodb` dependency from `package.json` — no build config needed. The static pages serve
as-is.

### 4. Test it
- Submit the form on the home page → you should see "Request received."
- Go to `yourdomain.com/dashboard`, enter `DASHBOARD_PASSWORD` → the lead appears.

### 5. Set your booking link  ⚠️ required
Open `index.html`, `portfolio.html` and find this line (it's marked with a TODO):
```html
<a href="https://cal.com/nexiosol" ...>Pick a time</a>
```
Replace `https://cal.com/nexiosol` with your real **Cal.com** or **Calendly** URL.
(Recommendation from our chat: use Cal.com — free, open source — rather than building a scheduler.)

---

## Local development (optional)
```bash
npm install
cp .env.example .env.local   # fill in your real values
npx vercel dev               # runs frontend + /api together at localhost:3000
```

---

## Notes & next steps
- **Security:** the dashboard password is checked on the server; the frontend never holds DB
  credentials. Good enough for a single-admin studio dashboard. If you later add multiple team
  members, move to real auth (e.g. Auth.js) — flag me when you're there.
- **Email notifications:** right now leads only land in the DB/dashboard. If you want an email
  every time someone submits, that's a small addition (Resend or a Vercel email integration) —
  say the word.
- **Per-service pages:** hold until each service has 3+ real projects, then we split
  `portfolio.html` into dedicated pages. The filter already gives you per-service browsing in
  the meantime.
