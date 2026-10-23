export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function normalizePhone(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

export function normalizeTicketNumber(value) {
  return String(value || '').trim();
}

export function validateRegistration(payload) {
  const name = String(payload?.name || '').trim();
  const email = normalizeEmail(payload?.email);
  const phone = normalizePhone(payload?.phone);
  const ticketNumber = normalizeTicketNumber(payload?.ticketNumber);
  const birthDay = Number(payload?.birthDay);
  const birthMonth = Number(payload?.birthMonth);
  const errors = {};

  if (name.length < 2 || name.length > 100) errors.name = 'Numele nu este valid.';
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) errors.email = 'Adresa de email nu este validă.';
  if (!/^[+\d][\d\s().-]{7,24}$/.test(phone)) errors.phone = 'Numărul de telefon nu este valid.';
  if (!/^\d{8}$/.test(ticketNumber)) errors.ticketNumber = 'Numărul de ticket trebuie să conțină exact 8 cifre.';
  if (!Number.isInteger(birthDay) || birthDay < 1 || birthDay > 31) errors.birthDay = 'Ziua nașterii nu este validă.';
  if (!Number.isInteger(birthMonth) || birthMonth < 1 || birthMonth > 12) errors.birthMonth = 'Luna nașterii nu este validă.';
  if (payload?.acceptTerms !== true) errors.acceptTerms = 'Acceptarea termenilor este obligatorie.';
  if (payload?.marketing !== true && payload?.marketing !== false) errors.marketing = 'Opțiunea de comunicări nu este validă.';

  return { errors, values: { name, email, phone, ticketNumber, birthDay, birthMonth, marketing: payload?.marketing === true } };
}
