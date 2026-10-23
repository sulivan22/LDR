const clubForm = document.querySelector('#club-form');
const statusMessage = document.querySelector('#form-status');
const daySelect = document.querySelector('#zi-nastere');
const monthSelect = document.querySelector('#luna-nastere');

const months = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];

if (daySelect && monthSelect) {
  for (let day = 1; day <= 31; day += 1) {
    daySelect.insertAdjacentHTML('beforeend', `<option value="${day}">${day}</option>`);
  }
  months.forEach((month, index) => {
    monthSelect.insertAdjacentHTML('beforeend', `<option value="${index + 1}">${month}</option>`);
  });
}

function setError(fieldName, message) {
  const field = document.querySelector(`[name="${fieldName}"]`);
  const error = document.querySelector(`[data-error-for="${fieldName}"]`);
  if (field) field.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (error) error.textContent = message;
}

clubForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  ['nume', 'zi-nastere', 'telefon', 'email', 'ticketNumber'].forEach((fieldName) => setError(fieldName, ''));
  statusMessage.textContent = '';

  const formData = new FormData(clubForm);
  let isValid = true;
  const name = String(formData.get('nume') || '').trim();
  const phone = String(formData.get('telefon') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const ticketNumber = String(formData.get('ticketNumber') || '').trim();

  if (name.length < 2) { setError('nume', 'Introdu numele complet.'); isValid = false; }
  if (!formData.get('zi-nastere') || !formData.get('luna-nastere')) { setError('zi-nastere', 'Alege ziua și luna nașterii.'); isValid = false; }
  if (!/^[+\d][\d\s().-]{7,}$/.test(phone)) { setError('telefon', 'Introdu un număr de telefon valid.'); isValid = false; }
  if (!/^\S+@\S+\.\S+$/.test(email)) { setError('email', 'Introdu o adresă de email validă.'); isValid = false; }
  if (!/^\d{8}$/.test(ticketNumber)) { setError('ticketNumber', 'Numărul de ticket trebuie să conțină exact 8 cifre.'); isValid = false; }
  if (!document.querySelector('#accept-terms')?.checked) { statusMessage.textContent = 'Pentru a continua, trebuie să accepți termenii și informarea privind datele.'; isValid = false; }

  if (!isValid) {
    statusMessage.className = 'form-status is-error';
    return;
  }

  const submitButton = clubForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.setAttribute('aria-busy', 'true');
  statusMessage.className = 'form-status';
  statusMessage.textContent = 'Se trimite…';

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        birthDay: Number(formData.get('zi-nastere')),
        birthMonth: Number(formData.get('luna-nastere')),
        phone,
        email,
        ticketNumber,
        acceptTerms: document.querySelector('#accept-terms')?.checked === true,
        marketing: document.querySelector('#marketing')?.checked === true,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Nu am putut procesa înscrierea.');
    statusMessage.className = 'form-status is-success';
    statusMessage.textContent = result.message;
    clubForm.reset();
  } catch (error) {
    statusMessage.className = 'form-status is-error';
    statusMessage.textContent = error.message || 'Nu am putut procesa înscrierea.';
  } finally {
    submitButton.disabled = false;
    submitButton.removeAttribute('aria-busy');
  }
});
