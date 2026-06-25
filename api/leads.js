// api/leads.js
// POST  /api/leads  → save a new lead (public, from the contact form)
// GET   /api/leads  → list all leads (protected by DASHBOARD_PASSWORD)
import { getDb } from './_db.js';

// Simple, dependency-free email check.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default async function handler(req, res) {
  // ---- CORS (same-origin in practice; harmless defaults) ----
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // ============ CREATE A LEAD ============
  if (req.method === 'POST') {
    try {
      // Vercel parses JSON bodies automatically; fall back just in case.
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim();
      const service = String(body.service || '').trim();
      const budget = String(body.budget || '').trim();
      const details = String(body.details || '').trim();

      // ---- Validation ----
      if (!name) return res.status(400).json({ error: 'Name is required.' });
      if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'A valid email is required.' });
      if (name.length > 200 || email.length > 200 || details.length > 5000) {
        return res.status(400).json({ error: 'Input too long.' });
      }

      const db = await getDb();
      const lead = {
        name, email, service, budget, details,
        createdAt: new Date(),
        // light metadata to help triage later
        userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
      };
      const result = await db.collection('leads').insertOne(lead);
      return res.status(201).json({ ok: true, id: result.insertedId });
    } catch (err) {
      console.error('POST /api/leads error:', err);
      return res.status(500).json({ error: 'Could not save your request. Please try again.' });
    }
  }

  // ============ LIST LEADS (protected) ============
  if (req.method === 'GET') {
    const pw = process.env.DASHBOARD_PASSWORD;
    if (!pw) {
      return res.status(500).json({ error: 'Dashboard password is not configured on the server.' });
    }
    // Accept "Authorization: Bearer <password>"
    const auth = String(req.headers['authorization'] || '');
    const provided = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
    if (provided !== pw) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    try {
      const db = await getDb();
      const leads = await db.collection('leads')
        .find({})
        .sort({ createdAt: -1 })
        .limit(1000)
        .toArray();
      // Normalize _id to string for the client.
      const clean = leads.map((l) => ({ ...l, _id: l._id.toString() }));
      return res.status(200).json({ leads: clean });
    } catch (err) {
      console.error('GET /api/leads error:', err);
      return res.status(500).json({ error: 'Could not load leads.' });
    }
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'Method not allowed.' });
}
