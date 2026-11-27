/* Supabase Auth + shared database. No browser database or demo fallback. */
window.BDRMSCloud = (() => {
  const config = window.BDRMS_SUPABASE_CONFIG;
  const SESSION_KEY = 'bdrms_supabase_session';
  const clone = value => JSON.parse(JSON.stringify(value));
  let session = null, user = null, staff = null, refreshing = null, saving = false;
  let baseline = { residents: new Map(), requests: new Map() };
  let revisions = { residents: new Map(), requests: new Map() };
  let started = false;
  try { session = JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch {}
  // Retire browser-only credentials/data. Never import them into the cloud.
  for (const key of ['bdrms_staff_session', 'bdrms_resident_session']) {
    sessionStorage.removeItem(key);
  }
  function keepSession(value) {
    session = value?.access_token ? { access_token: value.access_token,
      refresh_token: value.refresh_token, expires_at: Date.now() + value.expires_in * 1000 } : null;
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  }
  async function request(route, options = {}, authenticated = true) {
    if (!config?.url || !config?.publishableKey) throw new Error('Hindi pa naka-configure ang cloud connection.');
    if (authenticated && session && session.expires_at < Date.now() + 60000) {
      if (!refreshing) refreshing = request('/auth/v1/token?grant_type=refresh_token',
        { method: 'POST', body: JSON.stringify({ refresh_token: session.refresh_token }) }, false)
        .then(keepSession).catch(error => { keepSession(null); user = staff = null; throw error; })
        .finally(() => { refreshing = null; });
      await refreshing;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const headers = { apikey: config.publishableKey, 'Content-Type': 'application/json', ...options.headers };
      if (authenticated && session) headers.Authorization = 'Bearer ' + session.access_token;
      const response = await fetch(config.url + route, { ...options, headers, signal: controller.signal });
      const body = await response.text();
      let result; try { result = body ? JSON.parse(body) : null; } catch { result = null; }
      if (!response.ok) {
        if (response.status === 404 || ['42P01','PGRST202','PGRST205'].includes(result?.code))
          throw new Error('Hindi pa naka-install ang database setup sa Supabase. Makipag-ugnayan sa administrator.');
        if (response.status === 401) throw new Error('Hindi tama ang email/password, o nag-expire ang session. Mag-login muli.');
        throw new Error(result?.msg || result?.message || result?.error_description || 'Hindi naisave ang pagbabago sa cloud.');
      }
      return result;
    } catch (error) {
      if (error.name === 'AbortError' || error instanceof TypeError)
        throw new Error('Hindi maabot ang cloud. Suriin ang internet connection at subukan muli.');
      throw error;
    } finally { clearTimeout(timer); }
  }
  async function rows(table) {
    const all = [];
    for (let start = 0; ; start += 1000) {
      const page = await request('/rest/v1/' + table + '?select=*&order=id',
        { headers: { Range: start + '-' + (start + 999), 'Range-Unit': 'items' } });
      all.push(...page);
      if (page.length < 1000) return all;
    }
  }
  function currentUser() {
    return staff && user ? { username: user.email, name: staff.name, short: staff.name,
      role: staff.role === 'admin' ? 'admin' : 'secretary', staffRole: staff.role, id: user.id } : null;
  }
  function currentResident() {
    if (!user || staff) return null;
    return BDRMS.data().residents.find(row => row.authUserId === user.id &&
      row.verified && row.status === 'active') || null;
  }
  async function refresh() {
    if (!user || saving) return;
    const [residents, requests, logs] = await Promise.all([
      rows('bdrms_residents'), rows('bdrms_requests'),
      staff ? request('/rest/v1/bdrms_audit?select=*&order=id.desc&limit=500') : Promise.resolve([])
    ]);
    const next = { ...BDRMS.data(), users: currentUser() ? [currentUser()] : [],
      residents: residents.map(row => ({ ...row.payload, id: row.id, authUserId: row.auth_user_id })),
      requests: requests.map(row => ({ ...row.payload, id: row.id, ref: row.ref, residentId: row.resident_id })),
      logs: logs.map(row => ({ id: String(row.id), at: row.at, user: row.actor_name,
        role: row.actor_role, action: row.action, target: row.target })) };
    baseline = { residents: new Map(), requests: new Map() };
    revisions = { residents: new Map(), requests: new Map() };
    for (const kind of ['residents','requests']) {
      for (const row of next[kind]) baseline[kind].set(row.id, JSON.stringify(row));
      for (const row of kind === 'residents' ? residents : requests) revisions[kind].set(row.id, row.version);
    }
    BDRMS.replaceData(next);
    document.dispatchEvent(new CustomEvent('bdrms:sync'));
  }
  async function initialize() {
    if (!session) return;
    user = await request('/auth/v1/user');
    const matches = await request('/rest/v1/bdrms_staff?select=*&id=eq.' + encodeURIComponent(user.id));
    staff = matches.find(row => row.active) || null;
    await refresh();
    if (!started) {
      started = true;
      setInterval(() => { if (!document.hidden && user && !saving)
        refresh().catch(error => BDRMS.reportError(error)); }, 20000);
    }
  }
  async function signIn(email, password) {
    keepSession(await request('/auth/v1/token?grant_type=password',
      { method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase(), password }) }, false));
    try { await initialize(); }
    catch (error) { await logout(); throw error; }
  }
  async function logout() {
    try { if (session) await request('/auth/v1/logout', { method: 'POST' }); }
    finally {
      keepSession(null); user = staff = null;
      const current = BDRMS.data();
      BDRMS.replaceData({ ...current, users: [], residents: [], requests: [], logs: [] });
    }
  }
  async function login(email, password) {
    await signIn(email, password);
    const account = currentUser();
    if (!account) { await logout(); throw new Error('Walang aktibong staff role ang account na ito. Makipag-ugnayan sa administrator.'); }
    return account;
  }
  async function loginResident(email, password) {
    await signIn(email, password);
    if (staff) { await logout(); return { success: false, message: 'Gamitin ang Barangay Staff Login para sa account na ito.' }; }
    const resident = BDRMS.data().residents.find(row => row.authUserId === user.id);
    if (!resident || resident.status !== 'active' || !resident.verified) {
      const rejected = resident?.status === 'rejected';
      await logout();
      return { success: false, pending: !rejected,
        message: rejected ? 'Hindi naaprubahan ang pagpapatala. Makipag-ugnayan sa barangay hall.' :
          'Kailangan muna ang pag-apruba ng barangay staff bago magamit ang resident portal.' };
    }
    return { success: true, resident };
  }
  function validateProfile(form, birthdateRequired = true) {
    const profile = {};
    for (const key of ['firstName','middleName','lastName','suffix','birthdate','sex','civilStatus',
      'purok','contact','residentSince','email','idType']) profile[key] = String(form[key] || '').trim();
    if (!profile.firstName || !profile.lastName || !BDRMS.PUROKS.includes(profile.purok))
      throw new Error('Kumpletuhin ang pangalan at pumili ng wastong purok.');
    profile.contact = profile.contact.replace(/\D/g, '').replace(/^63(9\d{9})$/, '0$1');
    if (!/^09\d{9}$/.test(profile.contact)) throw new Error('Maglagay ng wastong mobile number.');
    const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(value)) && new Date(value + 'T00:00:00') <= new Date() &&
      new Date(value + 'T00:00:00').getDate() === Number(value.slice(8));
    if (!validDate(profile.residentSince) || (birthdateRequired && !validDate(profile.birthdate)) ||
      (profile.birthdate && (!validDate(profile.birthdate) || profile.birthdate > profile.residentSince)))
      throw new Error('Suriin ang petsa ng kapanganakan at simula ng paninirahan.');
    profile.address = profile.purok + ', Barangay Wawa, Abra de Ilog, Occidental Mindoro';
    return profile;
  }
  async function registerResidentOnline(form) {
    const profile = validateProfile({ ...form, email: form.email || form.username });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) throw new Error('Maglagay ng wastong email address.');
    if (String(form.password || '').length < 8) throw new Error('Gumamit ng password na may hindi bababa sa 8 character.');
    await request('/auth/v1/signup', { method: 'POST',
      body: JSON.stringify({ email: profile.email, password: form.password, data: { bdrms_profile: profile } }) }, false);
    return { ...profile, username: profile.email };
  }
  async function save(database) {
    if (!user) throw new Error('Mag-login bago mag-save.');
    if (saving) throw new Error('May sine-save pang pagbabago. Pakihintay at subukan muli.');
    const changes = { residents: [], requests: [] };
    for (const kind of ['residents','requests']) {
      for (const row of database[kind]) if (baseline[kind].get(row.id) !== JSON.stringify(row)) {
        const { password, authUserId, ...payload } = row;
        changes[kind].push({ id: row.id, auth_user_id: authUserId || null, ref: row.ref,
          resident_id: row.residentId, payload, expected_version: revisions[kind].get(row.id) ?? null });
      }
    }
    if (!changes.residents.length && !changes.requests.length) return;
    saving = true;
    let failure = null;
    try { await request('/rest/v1/rpc/bdrms_commit', { method: 'POST', body: JSON.stringify({ changes }) }); }
    catch (error) { failure = error; }
    finally { saving = false; }
    try { await refresh(); } catch (error) { if (!failure) failure = error; }
    if (failure) {
      // Revert optimistic data if refresh is unavailable. Never display a failed write as saved.
      const current = BDRMS.data();
      BDRMS.replaceData({ ...current,
        residents: [...baseline.residents.values()].map(value => JSON.parse(value)),
        requests: [...baseline.requests.values()].map(value => JSON.parse(value)) });
      document.dispatchEvent(new CustomEvent('bdrms:sync'));
      throw failure;
    }
  }
  async function registerResidentBySecretary(form) {
    const profile = validateProfile(form, false);
    const record = { ...profile, id: BDRMS.uid('res'), authUserId: null,
      verified: true, status: 'active', registeredBy: currentUser()?.name,
      registrationChannel: 'Walk-in', createdAt: new Date().toISOString() };
    BDRMS.data().residents.unshift(record);
    await save(BDRMS.data());
    return record;
  }
  async function setResidentStatus(id, status, reason = '') {
    const resident = BDRMS.data().residents.find(row => row.id === id);
    if (!resident) throw new Error('Hindi makita ang resident record.');
    Object.assign(resident, { status, verified: status === 'active', remarks: reason,
      registeredBy: currentUser()?.name, approvedAt: status === 'active' ? new Date().toISOString() : null });
    await save(BDRMS.data());
  }
  return { initialize, refresh, save, login, currentUser, logout, loginResident, currentResident,
    registerResidentOnline, registerResidentBySecretary, setResidentStatus };
})();
BDRMS.reportError = error => {
  let notice = document.getElementById('cloudError');
  if (!notice) {
    notice = document.createElement('div'); notice.id = 'cloudError';
    notice.setAttribute('role', 'alert');
    notice.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:10000;background:#fff7ed;color:#9a3412;padding:16px;max-width:90vw;border:1px solid #fed7aa;border-radius:12px';
    document.body.appendChild(notice);
  }
  notice.textContent = error.message;
};
BDRMS.ready = BDRMSCloud.initialize();
BDRMS.ready.catch(error => { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => BDRMS.reportError(error), { once: true }); else BDRMS.reportError(error); });
