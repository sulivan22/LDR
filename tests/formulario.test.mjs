import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pagePath = new URL('../site/formular.html', import.meta.url);
const termsPath = new URL('../site/termeni-si-conditii.html', import.meta.url);
const privacyPath = new URL('../site/informare-confidentialitate.html', import.meta.url);

test('formularul de fidelizare are câmpurile și consimțămintele necesare', async () => {
  const html = await readFile(pagePath, 'utf8');

  assert.match(html, /name="nume"/);
  assert.match(html, /name="zi-nastere"/);
  assert.match(html, /name="telefon"/);
  assert.match(html, /name="email"/);
  assert.match(html, /name="accept-terms"/);
  assert.match(html, /name="marketing"/);
  assert.match(html, /termeni-si-conditii\.html/);
  assert.match(html, /type="submit"/);
});

test('termenii explică scopul colectării și păstrează câmpurile firmei pentru completare', async () => {
  const html = await readFile(termsPath, 'utf8');
  const privacy = await readFile(privacyPath, 'utf8');

  assert.match(html, /concursuri|tombole|promoții/i);
  assert.match(html, /[Dd]ate cu caracter personal/);
  assert.match(html, /\[DENUMIREA LEGALĂ A FIRMEI\]/);
  assert.match(privacy, /\[EMAIL PENTRU SOLICITĂRI PRIVIND DATELE\]/);
});
