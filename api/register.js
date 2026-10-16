import { createHash, randomBytes } from 'node:crypto';
import { getMembersCollection } from './_lib/db.js';
import { sendVerificationEmail } from './_lib/email.js';
import { validateRegistration } from './_lib/validation.js';

const MAX_BODY_BYTES = 20 * 1024;
const RESEND_COOLDOWN_MS = 60 * 1000;

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
    const existing = await collection.findOne({ email: values.email }, { projection: { verifiedAt: 1, lastVerificationSentAt: 1 } });
    if (existing?.verifiedAt) return sendJson(res, 409, { error: 'Această adresă este deja confirmată.' });

    if (existing?.lastVerificationSentAt && Date.now() - existing.lastVerificationSentAt.getTime() < RESEND_COOLDOWN_MS) {
      return sendJson(res, 429, { error: 'Așteaptă un minut înainte de a solicita un nou email.' });
    }

    const token = randomBytes(32).toString('base64url');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + Number(process.env.VERIFICATION_TOKEN_TTL_HOURS || 24) * 60 * 60 * 1000);
    await collection.updateOne(
      { email: values.email },
      { $set: { ...values, status: 'pending_email_verification', termsAcceptedAt: now, privacyNoticeVersion: '2026-10', lastVerificationSentAt: now, verificationTokenHash: hashToken(token), verificationExpiresAt: expiresAt, updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );

    const baseUrl = (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    await sendVerificationEmail({ email: values.email, name: values.name, verificationUrl: `${baseUrl}/api/verify?token=${encodeURIComponent(token)}` });
    return sendJson(res, 202, { ok: true, message: 'Verifică emailul pentru a confirma înscrierea.' });
  } catch (error) {
    console.error('registration_error', error);
    return sendJson(res, 500, { error: 'Nu am putut procesa înscrierea. Încearcă din nou mai târziu.' });
  }
}
