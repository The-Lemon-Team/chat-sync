/**
 * Smoke-тесты REST API chat-sync backend.
 * Запуск: npm run test:api (backend должен быть на :3000)
 */
const BASE = process.env.API_URL ?? 'http://localhost:3000';

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: res.status, ok: res.ok, data };
}

function log(label, result) {
  const icon = result.ok ? '✓' : '✗';
  console.log(`${icon} ${label} [${result.status}]`, result.data);
}

async function main() {
  console.log(`Testing API at ${BASE}\n`);

  log('GET /telegram/accounts', await request('GET', '/telegram/accounts'));
  log('GET /chat-forks', await request('GET', '/chat-forks'));

  const createFork = await request('POST', '/chat-forks', {
    accountId: 'test-account-id',
    title: 'Test Offline Journal',
    type: 'OFFLINE_JOURNAL',
    syncMode: 'OFFLINE_ONLY',
  });
  log('POST /chat-forks (expect 404 without valid account)', createFork);

  console.log('\nDone.');
}

main().catch(console.error);
