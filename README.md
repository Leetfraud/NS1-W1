# NexioSol Website

Production website for NexioSol, a technology and business development partner: a static site with an interactive portfolio, a multi-step discovery call request form, a Vercel serverless lead API, MongoDB storage, optional lead notifications, and a password-gated leads dashboard.

## Current Site

- `index.html` - home page with animated ASCII hero, the four service groups (Software Development, CRM Solutions, AI & Automation, Business Development) in the capabilities accordion, packages, process/code interaction, metrics counters, selected work, and the discovery call request form.
- `portfolio.html` - full portfolio page with service filters, a desktop constellation view, project panels/decks, and a card-grid fallback for mobile/coarse-pointer devices.
- `dashboard.html` - private leads dashboard that reads from `/api/leads` after password authentication.
- `css/styles.css` - shared styling for the public site, portfolio, modals, and dashboard.
- `js/main.js` - home-page animation, counters, navigation, accordion, project form, and selected-work cards.
- `js/portfolio-constellation.js` - single source of portfolio project data plus the constellation, filters, project panel, and deck modal.
- `js/dashboard.js` - dashboard login, stats, search, and lead table rendering.
- `api/leads.js` - `POST` saves leads, `GET` lists leads with password auth, and notification hooks run after submissions.
- `api/_db.js` - cached MongoDB connection for serverless functions.
- `scripts/optimize-images.mjs` - converts mockup source images to optimized WebP assets.

## Features

- Static HTML/CSS/JS front end deployable on Vercel.
- Responsive navigation with mobile menu support.
- Motion-aware hero canvas and portfolio animations that respect `prefers-reduced-motion`.
- Three-step "Book a discovery call" form with client-side validation; visitors can select several services, budget is optional.
- Lead capture via `/api/leads`, stored in MongoDB. Each lead keeps a `services` array plus a comma-joined `service` string.
- Server-side dashboard protection using `DASHBOARD_PASSWORD`.
- Dashboard stats for total leads, recent leads, today's leads, and top requested service.
- Searchable leads table with contact, service, budget, details, and received date.
- Optional notifications through Gmail/Nodemailer, Twilio WhatsApp, and Slack.
- Portfolio mockups served from `assets/mockups`.

## Project Structure

```text
.
|-- index.html
|-- portfolio.html
|-- dashboard.html
|-- css/
|   `-- styles.css
|-- js/
|   |-- main.js
|   |-- portfolio-constellation.js
|   `-- dashboard.js
|-- api/
|   |-- leads.js
|   `-- _db.js
|-- assets/
|   |-- grounds/
|   `-- mockups/
|-- scripts/
|   `-- optimize-images.mjs
|-- package.json
|-- package-lock.json
`-- vercel.json
```

## Environment Variables

Required for lead storage and dashboard access:

| Name | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string. |
| `MONGODB_DB` | Database name. Defaults to `nexiosol` if omitted. |
| `DASHBOARD_PASSWORD` | Password used to access `dashboard.html`. |

Optional notification variables:

| Name | Purpose |
| --- | --- |
| `GMAIL_USER` | Gmail address used by Nodemailer. |
| `GMAIL_APP_PASSWORD` | Gmail app password for sending notification email. |
| `NOTIFY_EMAIL` | Email recipient for new project requests. |
| `TWILIO_ACCOUNT_SID` | Twilio account SID for WhatsApp notifications. |
| `TWILIO_AUTH_TOKEN` | Twilio auth token. |
| `TWILIO_WHATSAPP_FROM` | Twilio WhatsApp sender number. |
| `NOTIFY_WHATSAPP` | WhatsApp recipient number. |
| `SLACK_BOT_TOKEN` | Slack bot token for lead notifications. |
| `SLACK_CHANNEL_ID` | Slack channel ID to receive lead notifications. |

Notification delivery is best-effort. A failed email, WhatsApp, or Slack notification is logged, but it does not block saving the lead or returning success to the user.

## Local Development

Install dependencies:

```bash
npm install
```

Create `.env.local` with the variables above, then run the Vercel dev server:

```bash
npm run dev
```

Vercel serves the static pages and the `/api` functions together, usually at `http://localhost:3000`.

## Image Workflow

Portfolio screenshots live in `assets/mockups`. The portfolio script expects predictable filenames such as:

```text
auri-1.webp
auri-2.webp
auri-3.webp
```

To convert PNG/JPG mockups to WebP:

```bash
npm run images
npm run images auri
npm run images -- --force
```

Source images are kept on disk; the script writes optimized `.webp` siblings.

## Deployment

This repo is set up for Vercel:

1. Push the repository to GitHub/GitLab/Bitbucket.
2. Import it as a Vercel project.
3. Add the required environment variables in Vercel project settings.
4. Redeploy after environment variable changes.

No build command is required for the static pages. Vercel detects `api/*.js` as serverless functions.

## Testing Checklist

- Open the home page and confirm hero animation, navigation, capabilities, process tabs, counters, and selected-work cards render.
- Submit the discovery call form and confirm "Request received" appears.
- Confirm the submitted lead is stored in MongoDB.
- Visit `/dashboard.html`, enter `DASHBOARD_PASSWORD`, and confirm the lead appears.
- Open `/portfolio.html` on desktop and mobile-sized viewports to check both constellation and grid behavior.
- Check notification logs if Gmail, Twilio, or Slack credentials are configured.
