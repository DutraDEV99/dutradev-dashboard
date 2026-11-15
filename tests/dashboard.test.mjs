import test from 'node:test';
import assert from 'node:assert/strict';

test('dashboard: navigation, filters, persistence, safe rendering and CSV', async () => {
  const elements = new Map();
  const handlers = {};
  const storage = new Map();
  function element() {
    return {
      clientWidth: 650, innerHTML: '', textContent: '', value: '', dataset: {},
      classList: { add() {}, remove() {}, toggle() { return false; }, contains() { return false; } },
      setAttribute() {}, removeAttribute() {}, append() {}, remove() {}, click() {},
      focus() {}, contains() { return false; }, showModal() {}, close() {},
    };
  }
  globalThis.document = {
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, element());
      return elements.get(selector);
    },
    querySelectorAll() { return []; }, createElement: element, addEventListener() {}, body: element(),
  };
  globalThis.location = { hash: '#overview' };
  globalThis.window = { addEventListener(event, handler) { handlers[event] = handler; } };
  globalThis.localStorage = {
    getItem(key) { return storage.get(key) ?? null; },
    setItem(key, value) { storage.set(key, value); },
  };
  await import('../app.js');
  const $ = selector => elements.get(selector);
  const navigate = route => { location.hash = '#' + route; handlers.hashchange(); };
  assert.match(document.title, /^DutraDEV/);
  assert.match($('#content').innerHTML, /Receita recebida/);
  assert.match($('#revenue-chart').innerHTML, /<svg/);
  assert.doesNotMatch($('#revenue-chart').innerHTML, /NaN/);
  navigate('toString');
  assert.match(document.title, /Visão geral/);
  navigate('transactions');
  assert.match($('#table-results').innerHTML, /Página 1 de 11/);
  $('#next-page').onclick();
  assert.match($('#table-results').innerHTML, /Página 2 de 11/);
  $('#search').oninput({ target: { value: 'cliente-inexistente-xyz' } });
  assert.match($('#table-results').innerHTML, /Nenhum resultado/);
  $('#search').oninput({ target: { value: '' } });
  $('#status-filter').onchange({ target: { value: 'pending' } });
  assert.match($('#table-results').innerHTML, /Pendente/);
  assert.doesNotMatch($('#table-results').innerHTML, /class="status paid"/);
  const initialCount = Number($('#nav-count').textContent);
  const nativeFormData = globalThis.FormData;
  globalThis.FormData = class {
    get(key) { return { customer: '<script>alert(1)</script>', amount: '1234.56', plan: 'Pro', status: 'paid' }[key]; }
  };
  $('#transaction-form').onsubmit({ preventDefault() {}, target: { reset() {} } });
  globalThis.FormData = nativeFormData;
  assert.match(storage.get('dutradev-revenue-transactions-v1'), /1234.56/);
  assert.equal(Number($('#nav-count').textContent), initialCount + 1);
  navigate('transactions');
  assert.match($('#table-results').innerHTML, /&lt;script&gt;/);
  assert.doesNotMatch($('#table-results').innerHTML, /<script>/);
  $('#period').onchange({ target: { value: '7' } });
  assert.ok(Number($('#nav-count').textContent) < initialCount);
  let blob;
  const nativeCreate = URL.createObjectURL, nativeRevoke = URL.revokeObjectURL;
  URL.createObjectURL = value => { blob = value; return 'blob:test'; };
  URL.revokeObjectURL = () => {};
  $('#export').onclick();
  const csv = await blob.text();
  assert.match(csv, /"ID";"Cliente"/);
  assert.match(csv, /1234,56/);
  URL.createObjectURL = nativeCreate;
  // Revocation is deferred by the application; the no-op handles the test URL.
  setTimeout(() => { URL.revokeObjectURL = nativeRevoke; }, 1200).unref();
  navigate('customers');
  assert.match($('#customer-results').innerHTML, /Receita|RECEITA/);
  $('#customer-search').oninput({ target: { value: 'cliente-inexistente-xyz' } });
  assert.match($('#customer-results').innerHTML, /Nenhum cliente/);
  navigate('insights');
  assert.match($('#content').innerHTML, /STARTER/);
  assert.match($('#content').innerHTML, /BUSINESS/);
});
