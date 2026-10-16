import { Resend } from 'resend';

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character]));
}

export async function sendVerificationEmail({ email, name, verificationUrl }) {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');
  if (!process.env.RESEND_FROM_EMAIL) throw new Error('RESEND_FROM_EMAIL is not configured');

  const resend = new Resend(process.env.RESEND_API_KEY);
  const safeName = escapeHtml(name);
  const result = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: [email],
    subject: 'Confirmă înscrierea la Lady Madrid',
    text: `Bună, ${name}! Confirmă înscrierea la Lady Madrid accesând: ${verificationUrl}\n\nLinkul este valabil 24 de ore.`,
    html: `<!doctype html><html lang="ro"><body style="margin:0;background:#fffaf1;color:#11254a;font-family:Arial,sans-serif;line-height:1.6"><main style="max-width:560px;margin:0 auto;padding:40px 24px"><p style="color:#f37f68;font-weight:700;letter-spacing:2px;font-size:12px">LADY MADRID</p><h1 style="font-size:32px;line-height:1.1">Confirmă înscrierea, ${safeName}.</h1><p>Apasă butonul pentru a confirma adresa de email și a activa înscrierea la tombole și promoții.</p><p><a href="${verificationUrl}" style="display:inline-block;background:#f8cf58;color:#0b397a;font-weight:700;text-decoration:none;border-radius:999px;padding:14px 22px">Confirmă emailul</a></p><p style="font-size:13px;color:#65758b">Linkul este valabil 24 de ore. Dacă nu ai făcut această înscriere, poți ignora acest mesaj.</p></main></body></html>`,
  });

  if (result.error) throw new Error(result.error.message || 'Email delivery failed');
  return result.data;
}
