import { createHash } from 'node:crypto';
import { getMembersCollection } from './_lib/db.js';

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function page(title, message, success = false) {
  const accent = success ? '#f8cf58' : '#f37f68';
  return `<!doctype html><html lang="ro"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — Lady Madrid</title><style>body{margin:0;background:#fffaf1;color:#11254a;font-family:Arial,sans-serif;display:grid;min-height:100vh;place-items:center;padding:24px}main{max-width:520px;background:#fff;padding:42px;border-radius:24px;box-shadow:0 20px 55px rgba(21,87,163,.12)}h1{font-size:34px;line-height:1.1}p{color:#5f7087;line-height:1.6}a{display:inline-block;background:${accent};color:#0b397a;font-weight:700;text-decoration:none;border-radius:999px;padding:13px 20px;margin-top:12px}</style></head><body><main><p style="color:#1557a3;font-weight:700;letter-spacing:2px">LADY MADRID</p><h1>${title}</h1><p>${message}</p><a href="/">Înapoi pe site</a></main></body></html>`;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).send('Metodă nepermisă.');
  const token = typeof req.query?.token === 'string' ? req.query.token : '';
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return res.status(400).send(page('Link invalid', 'Linkul de verificare nu este valid sau este incomplet.'));

  try {
    const collection = await getMembersCollection();
    const result = await collection.updateOne(
      { verificationTokenHash: hashToken(token), verificationExpiresAt: { $gt: new Date() } },
      { $set: { status: 'active', verifiedAt: new Date(), updatedAt: new Date() }, $unset: { verificationTokenHash: '', verificationExpiresAt: '' } },
    );
    if (result.matchedCount !== 1) return res.status(400).send(page('Link expirat', 'Solicită un nou email de confirmare din formularul Lady Madrid.'));
    return res.status(200).send(page('Email confirmat', 'Mulțumim! Înscrierea ta la Lady Madrid este activă.', true));
  } catch (error) {
    console.error('verification_error', error);
    return res.status(500).send(page('Eroare temporară', 'Nu am putut confirma emailul acum. Încearcă din nou mai târziu.'));
  }
}
