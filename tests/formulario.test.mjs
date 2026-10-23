import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateRegistration } from '../api/_lib/validation.js';

const pagePath = new URL('../site/ed64e10b9bd101.html', import.meta.url);
const termsPath = new URL('../site/termeni-si-conditii.html', import.meta.url);
const privacyPath = new URL('../site/informare-confidentialitate.html', import.meta.url);
const homepagePath = new URL('../site/index.html', import.meta.url);

test('formularul de fidelizare are câmpurile și consimțămintele necesare', async () => {
  const html = await readFile(pagePath, 'utf8');

  assert.match(html, /name="nume"/);
  assert.match(html, /name="zi-nastere"/);
  assert.match(html, /name="telefon"/);
  assert.match(html, /name="email"/);
  assert.match(html, /name="ticketNumber"/);
  assert.match(html, /maxlength="8"/);
  assert.match(html, /pattern="\\d\{8\}"/);
  assert.match(html, /name="accept-terms"/);
  assert.match(html, /name="marketing"/);
  assert.match(html, /termeni-si-conditii\.html/);
  assert.match(html, /type="submit"/);
});

test('validarea acceptă doar un număr de ticket TD format din 8 cifre', () => {
  const validPayload = {
    name: 'Ana Popescu',
    birthDay: 10,
    birthMonth: 5,
    phone: '0712345678',
    email: 'ana@example.com',
    ticketNumber: '12345678',
    acceptTerms: true,
    marketing: false,
  };

  assert.equal(validateRegistration(validPayload).errors.ticketNumber, undefined);
  assert.equal(validateRegistration({ ...validPayload, ticketNumber: '00123456' }).values.ticketNumber, '00123456');
  assert.equal(validateRegistration({ ...validPayload, ticketNumber: '1234567' }).errors.ticketNumber, 'Numărul de ticket trebuie să conțină exact 8 cifre.');
  assert.equal(validateRegistration({ ...validPayload, ticketNumber: '1234ABCD' }).errors.ticketNumber, 'Numărul de ticket trebuie să conțină exact 8 cifre.');
});

test('documentele legale identifică operatorul și includ numărul de ticket TD', async () => {
  const html = await readFile(termsPath, 'utf8');
  const privacy = await readFile(privacyPath, 'utf8');

  assert.match(html, /concursuri|tombole|promoții/i);
  assert.match(html, /[Dd]ate cu caracter personal/);
  assert.match(html, /LADY MADRID S\.R\.L\./);
  assert.match(html, /număr de ticket|ticket.*TD/i);
  assert.match(privacy, /info@ladymadridromania\.com/);
  assert.match(privacy, /număr de ticket|ticket.*TD/i);
});

test('pagina principală afișează o secțiune dedicată TikTok sub galeria Instagram', async () => {
  const html = await readFile(homepagePath, 'utf8');

  assert.match(html, /03 — Inspirație din Instagram/);
  assert.match(html, /04 — Inspirație din TikTok/);
  assert.match(html, /href="https:\/\/www\.tiktok\.com\/@ladymadrid\.ro\//);
  assert.match(html, /class="photo-grid tiktok-grid"/);
  assert.equal((html.match(/class="photo(?: photo-large| photo-tall)?"/g) ?? []).length, 13);
  assert.match(html, /assets\/tiktok-yogurt-01\.png/);
  assert.match(html, /assets\/tiktok-yogurt-07\.png/);
  assert.doesNotMatch(html, /tiktok-embed|data-video-id|embed\.js/);
  assert.match(html, /Militari Shopping/);
  assert.match(html, /06 — Unde ne găsești/);
  assert.match(html, /Băneasa Shopping/);
  assert.match(html, /Șoseaua București - Ploiești, 42D/);
});
