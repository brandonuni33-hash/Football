const ALLOWED_PLATFORMS = new Set(['PC', 'iOS', 'Android']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase environment variables');
    return res.status(503).json({ error: 'service_unavailable' });
  }

  const email = String(req.body?.email || '').trim().toLowerCase();
  const platform = String(req.body?.platform || '');
  const source = String(req.body?.source || 'direct').slice(0, 80);
  const campaign = req.body?.campaign ? String(req.body.campaign).slice(0, 120) : null;

  if (!EMAIL_RE.test(email) || email.length > 254) return res.status(400).json({ error: 'invalid_email' });
  if (!ALLOWED_PLATFORMS.has(platform)) return res.status(400).json({ error: 'invalid_platform' });

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/beta_signups`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ email, platform, source, campaign })
    });

    if (response.ok) return res.status(201).json({ ok: true });
    const body = await response.text();
    if (response.status === 409 || body.includes('23505')) return res.status(409).json({ error: 'already_registered' });
    console.error('Supabase signup error', response.status, body);
    return res.status(500).json({ error: 'signup_failed' });
  } catch (error) {
    console.error('Signup endpoint error', error);
    return res.status(500).json({ error: 'signup_failed' });
  }
};