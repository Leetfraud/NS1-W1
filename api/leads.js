// api/leads.js
// POST  /api/leads  → save a new lead + fire notifications
// GET   /api/leads  → list all leads (protected by DASHBOARD_PASSWORD)
import { getDb } from './_db.js';
import nodemailer from 'nodemailer';

const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

// ── Email ────────────────────────────────────────────────────────
async function notifyEmail(lead) {
  const mailer = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
  await mailer.sendMail({
    from: `"NexioSol" <${process.env.GMAIL_USER}>`,
    to: process.env.NOTIFY_EMAIL,
    subject: `New project request — ${lead.name}`,
    html: `<div style="font-family:sans-serif;max-width:520px;color:#111;">
      <h2 style="color:#861211;">New Project Request</h2>
      <p style="color:#777;font-size:13px;">${new Date().toLocaleString()}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px;">
        <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#777;width:120px;">Name</td><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:500;">${lead.name}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#777;">Email</td><td style="padding:10px 0;border-bottom:1px solid #eee;">${lead.email}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#777;">Service</td><td style="padding:10px 0;border-bottom:1px solid #eee;">${lead.service || '—'}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #eee;color:#777;">Budget</td><td style="padding:10px 0;border-bottom:1px solid #eee;">${lead.budget || '—'}</td></tr>
        <tr><td style="padding:10px 0;color:#777;vertical-align:top;">Details</td><td style="padding:10px 0;">${lead.details || '—'}</td></tr>
      </table>
    </div>`,
  });
}

// ── WhatsApp via Twilio ──────────────────────────────────────────
async function notifyWhatsApp(lead) {
  const body = `📬 *New NexioSol Request*\n\n*Name:* ${lead.name}\n*Email:* ${lead.email}\n*Service:* ${lead.service || '—'}\n*Budget:* ${lead.budget || '—'}\n*Details:* ${(lead.details || '—').slice(0, 300)}`;
  const creds = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ From: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`, To: `whatsapp:${process.env.NOTIFY_WHATSAPP}`, Body: body }),
  });
}

// ── Slack ────────────────────────────────────────────────────────
async function notifySlack(lead) {
  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: process.env.SLACK_CHANNEL_ID,
      text: `New project request from *${lead.name}*`,
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: '📬 New Project Request' } },
        { type: 'section', fields: [
          { type: 'mrkdwn', text: `*Name*\n${lead.name}` },
          { type: 'mrkdwn', text: `*Email*\n${lead.email}` },
          { type: 'mrkdwn', text: `*Service*\n${lead.service || '—'}` },
          { type: 'mrkdwn', text: `*Budget*\n${lead.budget || '—'}` },
        ]},
        ...(lead.details ? [{ type: 'section', text: { type: 'mrkdwn', text: `*Details*\n${lead.details}` } }] : []),
      ],
    }),
  });
}

async function sendNotifications(lead) {
  const results = await Promise.allSettled([
    notifyEmail(lead),
    notifyWhatsApp(lead),
    notifySlack(lead),
  ]);
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.error(['Email','WhatsApp','Slack'][i], 'notification failed:', r.reason?.message);
  });
}

// ================================================================
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // ── POST: create lead ─────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const name    = String(body.name    || '').trim();
      const email   = String(body.email   || '').trim();
      const service = String(body.service || '').trim();
      const budget  = String(body.budget  || '').trim();
      const details = String(body.details || '').trim();

      if (!name)                     return res.status(400).json({ error: 'Name is required.' });
      if (!EMAIL_RE.test(email))     return res.status(400).json({ error: 'Please enter a valid email address.' });
      if (name.length > 200 || email.length > 200 || details.length > 5000)
                                     return res.status(400).json({ error: 'Input too long.' });

      const db   = await getDb();
      const lead = { name, email, service, budget, details, createdAt: new Date(), userAgent: String(req.headers['user-agent'] || '').slice(0, 300) };
      const result = await db.collection('leads').insertOne(lead);

      // Fire notifications — don't block the response
      sendNotifications(lead).catch(console.error);

      return res.status(201).json({ ok: true, id: result.insertedId });
    } catch (err) {
      console.error('POST /api/leads error:', err);
      return res.status(500).json({ error: 'Could not save your request. Please try again.' });
    }
  }

  // ── GET: list leads (password protected) ──────────────────────
  if (req.method === 'GET') {
    const pw = process.env.DASHBOARD_PASSWORD;
    if (!pw) return res.status(500).json({ error: 'Dashboard password not configured.' });
    const auth = String(req.headers['authorization'] || '');
    const provided = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
    if (provided !== pw) return res.status(401).json({ error: 'Unauthorized.' });
    try {
      const db    = await getDb();
      const leads = await db.collection('leads').find({}).sort({ createdAt: -1 }).limit(1000).toArray();
      return res.status(200).json({ leads: leads.map(l => ({ ...l, _id: l._id.toString() })) });
    } catch (err) {
      console.error('GET /api/leads error:', err);
      return res.status(500).json({ error: 'Could not load leads.' });
    }
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'Method not allowed.' });
}
