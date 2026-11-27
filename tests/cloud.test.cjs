const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key) };
}
function sandbox({ role = null, activeResident = true, rejectAuth = false, rejectCommit = false, commitGate = null } = {}) {
  const calls = [];
  const resident = { id: 'res_test', auth_user_id: 'test-user', version: 1,
    payload: { firstName: 'Test', lastName: 'Resident', purok: 'Purok 1', contact: '09000000000',
      status: activeResident ? 'active' : 'pending_approval', verified: activeResident,
      residentSince: '2020-01-01', birthdate: '2000-01-01', email: 'resident@example.invalid' } };
  const remote = { residents: [resident], requests: [] };
  const localStorage = memoryStorage({ bdrms_data_v2: '{"users":[{"username":"admin","password":"old-demo"}]}' });
  const context = vm.createContext({
    console, URL, URLSearchParams, AbortController, setTimeout, clearTimeout, crypto: require('node:crypto').webcrypto,
    setInterval: () => 1, CustomEvent: class { constructor(type) { this.type = type; } },
    localStorage, sessionStorage: memoryStorage(),
    BDRMS_SUPABASE_CONFIG: { url: 'https://example.invalid', publishableKey: 'public-test-key' },
    document: { hidden: false, readyState: 'loading', addEventListener() {}, dispatchEvent() {} },
    fetch: async (url, options) => {
      calls.push({ url, options });
      let result = [], status = 200;
      if (url.includes('/token?')) {
        if (rejectAuth) { status = 401; result = {}; }
        else result = { access_token: 'test-access', refresh_token: 'test-refresh', expires_in: 3600 };
      } else if (url.endsWith('/user')) result = { id: 'test-user', email: 'test@example.invalid', user_metadata: { role: 'admin' } };
      else if (url.includes('/bdrms_staff?')) result = role ? [{ id: 'test-user', name: 'Test Staff', role, active: true }] : [];
      else if (url.includes('/bdrms_residents?')) result = remote.residents;
      else if (url.includes('/bdrms_requests?')) result = remote.requests;
      else if (url.includes('/rpc/bdrms_commit')) {
        if (commitGate) await commitGate;
        if (rejectCommit) { status = 409; result = { message: 'Record changed. Refresh and retry.' }; }
        else {
          const { changes } = JSON.parse(options.body);
          remote.requests = changes.requests.map(row => ({ ...row, version: 1 }));
          result = null;
        }
      } else if (url.endsWith('/logout')) result = null;
      else if (url.includes('/signup')) result = { user: { id: 'new-test-user' } };
      return { ok: status < 400, status, text: async () => JSON.stringify(result) };
    }
  });
  context.window = context;
  vm.runInContext(fs.readFileSync(path.join(root, 'js/store.js'), 'utf8') + '\nglobalThis.BDRMS = BDRMS;', context);
  vm.runInContext(fs.readFileSync(path.join(root, 'js/cloud.js'), 'utf8'), context);
  return { app: context.BDRMS, calls, remote, context, localStorage };
}
test('legacy browser records are preserved but cannot authenticate', async () => {
  const s = sandbox({ rejectAuth: true });
  await s.app.ready;
  assert.ok(s.localStorage.getItem('bdrms_data_v2'));
  assert.equal(s.app.data().users.length, 0);
  assert.equal(s.app.data().residents.length, 0);
  await assert.rejects(s.app.login('admin', 'old-demo'), /email\/password/);
  assert.equal(s.app.currentUser(), null);
});
test('staff authorization comes from the database, not editable user metadata', async () => {
  const noRole = sandbox();
  await noRole.app.ready;
  await assert.rejects(noRole.app.login('test@example.invalid', 'test-password'), /staff role/);
  assert.equal(noRole.app.currentUser(), null);
  for (const [role, expected] of [['admin','admin'], ['secretary','secretary'], ['staff','secretary']]) {
    const s = sandbox({ role });
    await s.app.ready;
    const user = await s.app.login('test@example.invalid', 'test-password');
    assert.equal(user.role, expected);
  }
});
test('pending residents cannot enter the resident dashboard', async () => {
  const s = sandbox({ activeResident: false });
  await s.app.ready;
  const result = await s.app.loginResident('test@example.invalid', 'test-password');
  assert.equal(result.success, false);
  assert.equal(result.pending, true);
  assert.equal(s.app.currentResident(), null);
});
test('request submission waits for cloud commit and returns the server record', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const s = sandbox({ commitGate: gate });
  await s.app.ready;
  await s.app.loginResident('test@example.invalid', 'test-password');
  let settled = false;
  const write = s.app.createRequest({ applicant: { firstName: 'Test', lastName: 'Resident' },
    docType: 'clearance', purpose: 'Test request', residentId: 'res_test', channel: 'Online' })
    .then(value => { settled = true; return value; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(settled, false);
  release();
  const record = await write;
  assert.equal(record.id, s.remote.requests[0].id);
  const payload = JSON.parse(s.calls.find(call => call.url.includes('/rpc/')).options.body);
  assert.equal(payload.changes.requests[0].expected_version, null);
  assert.equal(JSON.stringify(payload).includes('password'), false);
});
test('failed cloud writes reject and restore the last confirmed records', async () => {
  const s = sandbox({ rejectCommit: true });
  await s.app.ready;
  await s.app.loginResident('test@example.invalid', 'test-password');
  await assert.rejects(s.app.createRequest({ applicant: { firstName: 'Test', lastName: 'Resident' },
    docType: 'clearance', purpose: 'Test request', residentId: 'res_test' }), /Record changed/);
  assert.equal(s.app.data().requests.length, 0);
});
