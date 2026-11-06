import { createHash, randomBytes } from 'node:crypto';
import { getMembersCollection } from './_lib/db.js';
import { sendVerificationEmail } from './_lib/email.js';
import { validateRegistration } from './_lib/validation.js';

const MAX_BODY_BYTES = 20 * 1024;

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function sendJson(res, status, body) {
  res.status(status).setHeader('Cache-Control', 'no-store').json(body);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Metodă nepermisă.' });
  }

  if (Number(req.headers['content-length'] || 0) > MAX_BODY_BYTES) {
    return sendJson(res, 413, { error: 'Cererea este prea mare.' });
  }

  const { errors, values } = validateRegistration(req.body || {});
  if (Object.keys(errors).length > 0) return sendJson(res, 400, { error: 'Verifică datele introduse.', fields: errors });

  try {
    const collection = await getMembersCollection();
    const token = randomBytes(32).toString('base64url');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + Number(process.env.VERIFICATION_TOKEN_TTL_HOURS || 24) * 60 * 60 * 1000);
    await collection.insertOne({
      ...values,
      status: 'pending_email_verification',
      termsAcceptedAt: now,
      privacyNoticeVersion: '2026-10',
      lastVerificationSentAt: now,
      verificationTokenHash: hashToken(token),
      verificationExpiresAt: expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    const baseUrl = (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    await sendVerificationEmail({ email: values.email, name: values.name, verificationUrl: `${baseUrl}/api/verify?token=${encodeURIComponent(token)}` });
    return sendJson(res, 202, { ok: true, message: 'Verifică emailul pentru a confirma înscrierea.' });
  } catch (error) {
    console.error('registration_error', error);
    return sendJson(res, 500, { error: 'Nu am putut procesa înscrierea. Încearcă din nou mai târziu.' });
  }
}
