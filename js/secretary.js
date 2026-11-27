/* ==========================================================================
   BDRMS — Tanggapan ng Kalihim (Secretary Portal Controller)
   Barangay Wawa, Abra de Ilog, Occidental Mindoro
   Dedicated Controller for Sec. Lorna P. Fernandez (Operations & Approvals)
   ========================================================================== */

let currentSecretary = null;
let activeResidentsSubtab = 'active';

document.addEventListener('DOMContentLoaded', async () => {
  try { await BDRMS.ready; } catch (error) { BDRMS.reportError(error); return; }
  const app = document.querySelector('.admin-app');
  const user = BDRMS.currentUser();
  if (!BDRMS.isSecretary(user)) {
    window.location.replace('staff-login.html');
    return;
  }
  currentSecretary = user;
  const accountName = document.querySelector('.user-info strong');
  if (accountName) accountName.textContent = user.name;
  initSecretaryUI(app);
  app.classList.remove('hidden');

  window.addEventListener('pageshow', () => {
    if (!BDRMS.isSecretary()) {
      app.classList.add('hidden');
      window.location.replace('staff-login.html');
    }
  });
});

function initSecretaryUI(app) {
  BDRMSUI.mountPagination('requestsPager', 7, renderRequestsTable);
  BDRMSUI.mountPagination('residentsPager', 8, renderResidentsTable);
  const renderTab = {
    tabRequests: renderRequestsTable,
    tabResidents: renderResidentsTable,
    tabReports: renderReportsView,
  };
  BDRMSUI.mountStaffNavigation(app, id => renderTab[id]?.());
  setupLogout();
  renderDashboard();
  setupEventListeners();

  // Multi-tab store sync
  document.addEventListener('bdrms:sync', renderDashboard);
}

function setupLogout() {
  // Logout
  const logoutBtn = document.getElementById('btnSecretaryLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      BDRMS.confirmDialog({
        title: 'Mag-logout sa Tanggapan ng Kalihim',
        message: 'Nais mo bang lumabas sa portal ng Kalihim ng Barangay?',
        confirmText: 'Oo, Mag-logout',
        cancelText: 'Kanselahin',
        danger: true,
        onConfirm: async () => {
          await BDRMS.logout();
          window.location.replace('staff-login.html');
        }
      });
    });
  }
}


/* ---------- Dashboard Rendering ---------- */
function renderDashboard() {
  const store = BDRMS.data();
  const reqs = store.requests || [];
  const residents = store.residents || [];

  const total = reqs.length;
  const underVer = reqs.filter(r => r.status === 'Under Verification').length;
  const forAppr = reqs.filter(r => r.status === 'For Approval').length;
  const ready = reqs.filter(r => r.status === 'Ready for Pickup').length;
  const verifiedRes = residents.filter(r => r.verified && r.status !== 'pending_approval').length;
  const pendingRes = residents.filter(r => residentRegistryStatus(r) === 'pending').length;

  const setT = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  setT('statTotal', total);
  setT('statVerification', underVer);
  setT('statApproval', forAppr);
  setT('statReady', ready);
  setT('statResidents', verifiedRes);

  const pendingBadge = document.getElementById('badgePendingCount');
  if (pendingBadge) {
    const activePending = reqs.filter(r => r.status === 'Submitted' || r.status === 'Under Verification' || r.status === 'For Approval').length;
    pendingBadge.innerText = activePending;
    pendingBadge.style.display = activePending > 0 ? 'inline-flex' : 'none';
  }

  const pendingResBadge = document.getElementById('badgePendingResidents');
  if (pendingResBadge) {
    pendingResBadge.innerText = pendingRes;
    pendingResBadge.style.display = pendingRes > 0 ? 'inline-flex' : 'none';
  }

  const countActive = document.getElementById('countActiveResidents');
  if (countActive) countActive.innerText = verifiedRes;

  const countPend = document.getElementById('countPendingResidents');
  if (countPend) countPend.innerText = pendingRes;

  renderRequestsTable();
  renderResidentsTable();
  if (document.getElementById('tabReports').classList.contains('active')) renderReportsView();
}

/* ---------- Event Listeners ---------- */
function setupEventListeners() {
  BDRMSUI.bindRequestFilters(renderRequestsTable);
  document.getElementById('residentSearch').addEventListener('input', () => {
    BDRMSUI.resetPage('residentsPager');
    renderResidentsTable();
  });

  const statusFilter = document.getElementById('filterStatus');
  const statusCards = document.querySelectorAll('[data-filter-status]');
  const syncStatusCards = () => statusCards.forEach(card => {
    card.setAttribute('aria-pressed', String(card.dataset.filterStatus === statusFilter.value));
  });
  statusCards.forEach(card => {
    card.addEventListener('click', () => {
      statusFilter.value = card.dataset.filterStatus;
      syncStatusCards();
      BDRMSUI.resetPage('requestsPager');
      renderRequestsTable();
    });
  });
  statusFilter.addEventListener('change', syncStatusCards);
  document.querySelector('[data-open-residents]').addEventListener('click', () => {
    document.querySelector('.sidebar-nav [data-tab="tabResidents"]').click();
    document.getElementById('residentSearch').focus();
  });

  // Walk-in modal
  const btnWalkin = document.getElementById('btnOpenWalkin');
  if (btnWalkin) {
    btnWalkin.addEventListener('click', openWalkinModal);
  }

  // Add resident modal
  const btnAddRes = document.getElementById('btnAddResident');
  if (btnAddRes) {
    btnAddRes.addEventListener('click', openAddResidentModal);
  }

  document.querySelectorAll('[data-subtab]').forEach(button => {
    button.addEventListener('click', () => {
      activeResidentsSubtab = button.dataset.subtab;
      document.querySelectorAll('[data-subtab]').forEach(tab => {
        const isActive = tab === button;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-pressed', String(isActive));
      });
      BDRMSUI.resetPage('residentsPager');
      renderResidentsTable();
    });
  });

  // Export CSV
  const btnExport = document.getElementById('btnExportCSV');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      BDRMS.exportRequestsCSV();
      BDRMS.toast('Na-export na ang opisyal na DILG CSV Report para sa Tanggapan ng Kalihim.', 'success');
    });
  }
}

/* ---------- Requests Table ---------- */
function renderRequestsTable() {
  BDRMSUI.renderRequests('Suriin', window.openRequestDetail, true);
}

/* ---------- Request Detail Modal (Secretary View) ---------- */
window.openRequestDetail = function(reqId) {
  const req = BDRMS.data().requests.find(r => r.id === reqId);
  if (!req) return;

  const doc = BDRMS.DOC_TYPES[req.docType] || { name: req.docType, fee: 'Free' };
  const statusDef = BDRMS.STATUSES[req.status] || { cls: '', desc: '' };
  const modalBody = `
    <div class="req-detail-grid">
      <!-- Left Column: Core Info & Applicant -->
      <div>
        <div class="detail-section">
          <h4>Impormasyon ng Aplikante</h4>
          <div class="kv-list">
            <div class="kv-row"><dt>Pangalan</dt><dd><b>${BDRMS.esc(BDRMS.fullName(req.applicant))}</b></dd></div>
            <div class="kv-row"><dt>Tirahan sa Wawa</dt><dd>${BDRMS.esc(req.applicant.purok)}, Barangay Wawa</dd></div>
            <div class="kv-row"><dt>Tagal ng Paninirahan</dt><dd>${req.applicant.residentSince ? BDRMS.residencyText(req.applicant.residentSince) : 'Hindi nakatala'}</dd></div>
            <div class="kv-row"><dt>Numero ng Telepono</dt><dd>${BDRMS.esc(req.applicant.contact || 'Walang numero')}</dd></div>
            <div class="kv-row"><dt>Uri ng Valid ID</dt><dd>${BDRMS.esc(req.applicant.idType || 'Hindi tinukoy')} (${BDRMS.esc(req.applicant.idNumber || '—')})</dd></div>
          </div>
        </div>

        <div class="detail-section" style="margin-top: 18px;">
          <h4>Detalye ng Dokumento</h4>
          <div class="kv-list">
            <div class="kv-row"><dt>Uri ng Dokumento</dt><dd><b>${doc.name}</b></dd></div>
            <div class="kv-row"><dt>Opisyal na Bayarin</dt><dd><span class="price-tag">${doc.fee}</span></dd></div>
            <div class="kv-row"><dt>Layunin (Purpose)</dt><dd>${BDRMS.esc(req.purpose || 'Personal / Opisyal')}</dd></div>
            <div class="kv-row"><dt>Channel ng Aplikasyon</dt><dd>${req.channel === 'Walk-in' ? '🏛️ Walk-in (Barangay Hall)' : '🌐 Online Resident Portal'}</dd></div>
            <div class="kv-row"><dt>Petsa ng Kahilingan</dt><dd>${BDRMS.fmtDateTime(req.createdAt)}</dd></div>
            ${req.orNumber ? `<div class="kv-row"><dt>Official Receipt (OR#)</dt><dd><b>${BDRMS.esc(req.orNumber)}</b></dd></div>` : ''}
          </div>
        </div>

        ${renderExtraFieldsDetail(req)}
      </div>

      <!-- Right Column: Verification, Approvals, & Workflow Actions -->
      <div>
        <div class="detail-section">
          <h4>Katayuan at mga aksyon</h4>
          <div class="verification-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <span>Status ng Dokumento:</span>
              <span class="badge ${statusDef.cls}">${req.status}</span>
            </div>
            <p style="font-size:0.8rem; color:var(--muted); margin-bottom:14px;">${statusDef.desc}</p>

            <div style="border-top:1px solid var(--border); padding-top:14px;">
              <b style="font-size:0.82rem; display:block; margin-bottom:8px; color:var(--text-soft);">Aksyon ng Kalihim:</b>
              <div id="secretaryWorkflowActionContainer" style="display:grid; gap:8px;">
                ${renderWorkflowActions(req)}
              </div>
            </div>
          </div>
        </div>

        <!-- History / Timeline -->
        <div class="detail-section" style="margin-top:18px;">
          <h4>Kasaysayan</h4>
          <div class="timeline-list">
            ${(req.history || []).map(h => `
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div style="display:flex; justify-content:space-between; gap:10px;">
                    <b>${h.status}</b>
                    <span style="font-size:0.75rem; color:var(--muted);">${BDRMS.fmtDateTime(h.at)}</span>
                  </div>
                  <div style="font-size:0.8rem; color:var(--text-soft); margin-top:2px;">
                    Isinagawa ni: <b>${BDRMS.esc(h.by)}</b>
                  </div>
                  ${h.note ? `<div style="font-size:0.78rem; color:var(--muted); margin-top:2px;">${BDRMS.esc(h.note)}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  const modalFoot = `
    <div style="display:flex; justify-content:space-between; align-items:center; width:100%; flex-wrap:wrap; gap:10px;">
      <div>
        <button class="btn btn-ghost btn-sm" onclick="printRequestDirect('${req.id}')" title="Tingnan ang Opisyal na Sertipiko para sa pag-print">
          ${BDRMS.ICONS.printer}
          Mag-print ng Sertipiko
        </button>
      </div>
      <div>
        <button class="btn btn-primary" data-close>Isara</button>
      </div>
    </div>
  `;

  const close = BDRMS.modal({
    title: `Suriin ang Request: ${req.ref}`,
    subtitle: `${doc.name} — ${BDRMS.esc(BDRMS.fullName(req.applicant))}`,
    wide: true,
    body: modalBody,
    foot: modalFoot,
  });

  // Attach action button clicks
  const actionContainer = document.getElementById('secretaryWorkflowActionContainer');
  if (actionContainer) {
    actionContainer.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        requestWorkflowAction(req, action, close);
      });
    });
  }
};

function renderExtraFieldsDetail(req) {
  if (!req.extra || Object.keys(req.extra).length === 0) return '';
  const rows = Object.entries(req.extra).map(([k, v]) => `
    <div class="kv-row"><dt>${BDRMS.esc(k)}</dt><dd>${BDRMS.esc(v)}</dd></div>
  `).join('');

  return `
    <div class="detail-section" style="margin-top: 18px;">
      <h4>Karagdagang Datos ng Sertipiko</h4>
      <div class="kv-list">
        ${rows}
      </div>
    </div>
  `;
}

function renderWorkflowActions(req) {
  const status = req.status;
  const btns = [];

  if (status === 'Submitted') {
    btns.push(`<button class="btn btn-primary btn-block" data-action="verify_and_forward">${BDRMS.ICONS.send} I-verify at i-forward</button>`);
    btns.push(`<button class="btn btn-ghost btn-block btn-sm" data-action="verify" style="margin-top:4px;">${BDRMS.ICONS.search} Markahan para sa beripikasyon</button>`);
  }
  if (status === 'Under Verification') {
    btns.push(`<button class="btn btn-primary btn-block" data-action="forward">${BDRMS.ICONS.send} I-forward para maaprubahan</button>`);
  }
  if (status === 'For Approval') {
    btns.push(`<button class="btn btn-primary btn-block" data-action="approve">${BDRMS.ICONS.signature} Aprubahan ang request</button>`);
  }
  if (status === 'Ready for Pickup') {
    btns.push(`<button class="btn btn-primary btn-block" data-action="release">${BDRMS.ICONS.badgeCheck} I-release ang dokumento</button>`);
  }

  // Reject / Return Option
  if (status !== 'Released' && status !== 'Rejected') {
    btns.push(`<button class="btn btn-danger btn-block btn-sm" data-action="reject" style="margin-top:8px;">${BDRMS.ICONS.x} Tanggihan</button>`);
  }

  if (btns.length === 0) {
    return `<div style="font-size:0.82rem; color:var(--muted); text-align:center; padding:10px;">Nakumpleto na ang dokumento at minarkahang ${status}.</div>`;
  }

  return btns.join('');
}

function requestWorkflowAction(req, action, close) {
  const fee = BDRMS.DOC_TYPES[req.docType]?.fee || 'Free';
  if (action === 'reject') {
    BDRMSUI.requestText({
      title: 'Tanggihan ang request',
      label: 'Dahilan ng pagtanggi',
      confirmText: 'Tanggihan',
      multiline: true,
      danger: true,
      onSubmit: reason => handleSecretaryAction(req, action, close, reason),
    });
    return;
  }
  if (action === 'release' && !req.orNumber && !fee.includes('Free')) {
    BDRMSUI.requestText({
      title: 'I-release ang dokumento',
      label: 'Official receipt number · Bayad: ' + fee,
      confirmText: 'I-release',
      onSubmit: receipt => handleSecretaryAction(req, action, close, receipt),
    });
    return;
  }
  handleSecretaryAction(req, action, close);
}

async function handleSecretaryAction(req, action, closeModal, value) {
  try {
  const user = currentSecretary;
  const now = new Date().toISOString();

  if (action === 'verify_and_forward') {
    req.status = 'For Approval';
    req.verification = req.verification || {};
    req.verification.identity = true;
    req.verification.residency = true;
    req.history.push({ status: 'Under Verification', by: user.short, at: now, note: 'Identity & residency verified against barangay database.' });
    req.history.push({ status: 'For Approval', by: user.short, at: new Date(Date.now() + 1000).toISOString(), note: 'Verified by barangay staff and marked for approval.' });
    BDRMS.log(user, `Verified and forwarded ${req.ref} for approval`);
  } else if (action === 'verify') {
    req.status = 'Under Verification';
    req.verification = req.verification || {};
    req.verification.identity = true;
    req.verification.residency = true;
    req.history.push({ status: 'Under Verification', by: user.short, at: now, note: 'Checking proof of dwelling or additional requirements.' });
    BDRMS.log(user, `Marked request ${req.ref} under verification`);
  } else if (action === 'forward') {
    req.status = 'For Approval';
    req.history.push({ status: 'For Approval', by: user.short, at: now, note: 'Endorsed for final approval.' });
    BDRMS.log(user, `Forwarded ${req.ref} for approval`);
  } else if (action === 'approve') {
    req.status = 'Ready for Pickup';
    req.history.push({ status: 'Ready for Pickup', by: user.short, at: now, note: 'Approved and finalized by barangay staff.' });
    BDRMS.log(user, `Approved request ${req.ref}`);
  } else if (action === 'release') {
    req.status = 'Released';
    req.orNumber = value || req.orNumber || 'FREE-RA11261';
    req.paymentStatus = req.orNumber.startsWith('FREE') || req.orNumber.startsWith('EXEMPT') ? 'Exempt' : 'Paid';
    req.releasedAt = now;
    req.history.push({ status: 'Released', by: user.short, at: now, note: `Document issued and released. OR# ${req.orNumber}` });
    BDRMS.log(user, `Released document ${req.ref} with OR# ${req.orNumber}`);
  } else if (action === 'reject') {
    const reason = value;

    req.status = 'Rejected';
    req.remarks = reason;
    req.history.push({ status: 'Rejected', by: user.short, at: now, note: `Rejected by Secretary: ${reason}` });
    BDRMS.log(user, `Rejected ${req.ref}: ${reason}`);
  }

  req.updatedAt = now;
  await BDRMS.save();
  closeModal();
  renderDashboard();
  BDRMS.toast('Naisave ang pagbabago sa cloud.');
  } catch (error) { BDRMS.toast(error.message, 'error'); return false; }
}

window.printRequestDirect = function(reqId) {
  const req = BDRMS.data().requests.find(r => r.id === reqId);
  if (!req) return;

  const user = currentSecretary;
  BDRMS.log(user, `Generated official printout for ${req.ref}`);

  BDRMS.modal({
    title: 'Official Document Print Preview',
    subtitle: `${BDRMS.DOC_TYPES[req.docType].name} — Barangay Wawa, Abra de Ilog`,
    wide: true,
    body: BDRMS.certificateHTML(req),
    foot: `
      <button class="btn btn-ghost" data-close>Close</button>
      <button class="btn btn-primary" onclick="window.print()">${BDRMS.ICONS.printer} Print Document</button>
    `,
  });
};

/* ---------- Walk-in Encoding Modal ---------- */
function openWalkinModal() {
  const residents = (BDRMS.data().residents || []).filter(r => r.verified && r.status !== 'pending_approval');

  const residentOptions = residents.map(r => `
    <option value="${r.id}">${BDRMS.esc(BDRMS.fullName(r))} (${BDRMS.esc(r.purok)})</option>
  `).join('');

  const docOptions = Object.entries(BDRMS.DOC_TYPES).map(([k, d]) => `
    <option value="${k}">${d.name} (${d.fee})</option>
  `).join('');

  const body = `
    <form id="formWalkinRequest" style="display:grid; gap:16px;">
      <div class="field">
        <label for="walkinResidentId">Pumili ng Rehistradong Residente</label>
        <select id="walkinResidentId" class="select" required>
          <option value="">-- Piliin ang Pangalan ng Residente --</option>
          ${residentOptions}
        </select>
        <span class="muted" style="font-size:0.78rem;">Kung wala sa listahan, kailangang irehistro muna gamit ang "Magrehistro ng Residente" button.</span>
      </div>

      <div class="field">
        <label for="walkinDocType">Uri ng Dokumento</label>
        <select id="walkinDocType" class="select" required>
          ${docOptions}
        </select>
      </div>

      <div class="field">
        <label for="walkinPurpose">Layunin (Purpose)</label>
        <input type="text" id="walkinPurpose" class="input" placeholder="hal. Trabaho, Scholarship, ID Requirement" required>
      </div>

      <div class="field">
        <label for="walkinInitialStatus">Aksyon ni Secretary Pagkatapos I-encode</label>
        <select id="walkinInitialStatus" class="select">
          <option value="Ready for Pickup">Aprubahan Agad (Ready for Pickup / Release)</option>
          <option value="For Approval">Ihanda para sa Review (For Approval)</option>
        </select>
      </div>
    </form>
  `;

  const foot = `
    <button class="btn btn-ghost" data-close>Kanselahin</button>
    <button type="submit" form="formWalkinRequest" class="btn btn-primary">Isumite ang walk-in</button>
  `;

  const close = BDRMS.modal({
    title: '✍️ Mag-encode ng Walk-in Request sa Hall',
    subtitle: 'Tanggapan ng Kalihim — Barangay Wawa, Abra de Ilog',
    body,
    foot,
  });

  document.getElementById('formWalkinRequest').addEventListener('submit', async event => {
    event.preventDefault();
    const resId = document.getElementById('walkinResidentId').value;
    const docType = document.getElementById('walkinDocType').value;
    const purpose = document.getElementById('walkinPurpose').value.trim();
    const initialStatus = document.getElementById('walkinInitialStatus').value;

    if (!resId || !docType || !purpose) {
      BDRMS.toast('Pakipunan ang lahat ng kinakailangang impormasyon.', 'error');
      return;
    }

    const resident = BDRMS.data().residents.find(r => r.id === resId);
    if (!resident) return;

    const newReq = {
      id: BDRMS.uid('req'),
      ref: BDRMS.genRef(),
      residentId: resident.id,
      docType,
      purpose,
      channel: 'Walk-in',
      status: initialStatus,
      applicant: {
        firstName: resident.firstName,
        middleName: resident.middleName || '',
        lastName: resident.lastName,
        purok: resident.purok,
        contact: resident.contact,
        residentSince: resident.residentSince,
        idType: resident.idType || 'PhilSys National ID',
        idNumber: resident.idNumber || 'VERIFIED-RESIDENT',
      },
      verification: { identity: true, residency: true, blotterCheck: false },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        { status: 'Submitted', by: 'Secretary Walk-in', at: new Date().toISOString(), note: 'Encoded directly at Barangay Hall' },
        { status: initialStatus, by: currentSecretary.short, at: new Date().toISOString(), note: 'Walk-in request processed by Secretary' }
      ]
    };

    BDRMS.data().requests.unshift(newReq);
    try { await BDRMS.save(); } catch (error) { BDRMS.toast(error.message, 'error'); return; }
    BDRMS.log(currentSecretary, `Encoded walk-in request ${newReq.ref} for ${BDRMS.fullName(resident)}`);
    BDRMS.toast(`Matagumpay na nai-encode ang walk-in request: ${newReq.ref}`, 'success');

    close();

    renderDashboard();
  });
}

/* ---------- Residents Registry ---------- */
function residentRegistryStatus(resident) {
  if (resident.status === 'rejected') return 'rejected';
  return resident.verified && resident.status !== 'pending_approval' ? 'active' : 'pending';
}

function renderResidentsTable() {
  const tbody = document.getElementById('residentsTableBody');
  const query = document.getElementById('residentSearch').value.trim().toLowerCase();
  const residents = BDRMS.data().residents.filter(resident => residentRegistryStatus(resident) === activeResidentsSubtab &&
    BDRMSUI.matchesResidentSearch(resident, query));
  const visible = BDRMSUI.page('residentsPager', residents);
  const labels = {
    active: ['Aktibo', 'badge-ready'],
    pending: ['For review', 'badge-approval'],
    rejected: ['Tinanggihan', 'badge-rejected'],
  };
  const [label, badge] = labels[activeResidentsSubtab];
  tbody.innerHTML = visible.length ? visible.map(resident => `
    <tr role="row">
      <td role="cell" data-label="Residente">
        <strong>${BDRMS.esc(BDRMS.fullName(resident))}</strong>
        <span class="row-detail">${BDRMS.esc(resident.username || '—')}</span>
      </td>
      <td role="cell" data-label="Purok">${BDRMS.esc(resident.purok)}</td>
      <td role="cell" data-label="Paninirahan">${BDRMS.residencyText(resident.residentSince)}</td>
      <td role="cell" data-label="Katayuan"><span class="badge ${badge}">${label}</span></td>
      <td role="cell" class="row-action">
        <button type="button" class="btn ${activeResidentsSubtab === 'pending' ? 'btn-primary' : 'btn-ghost'} btn-sm" data-resident-id="${BDRMS.esc(resident.id)}">${activeResidentsSubtab === 'pending' ? 'Suriin' : 'Tingnan'}</button>
      </td>
    </tr>`).join('') : '<tr role="row"><td role="cell" colspan="5" class="table-empty">Walang nahanap na residente.</td></tr>';
  tbody.onclick = event => {
    const button = event.target.closest('[data-resident-id]');
    if (!button) return;
    const resident = residents.find(record => record.id === button.dataset.residentId);
    if (!resident) return;
    if (residentRegistryStatus(resident) === 'active') BDRMSUI.residentDetails(resident);
    else reviewResident(resident);
  };
}

function reviewResident(resident) {
  const rejected = residentRegistryStatus(resident) === 'rejected';
  BDRMSUI.residentDetails(resident, `
    <button type="button" class="btn btn-ghost" data-close>Isara</button>
    ${rejected ? '' : '<button type="button" class="btn btn-danger" data-reject>Tanggihan</button>'}
    <button type="button" class="btn btn-primary" data-approve>${rejected ? 'Ibalik sa aktibo' : 'Aprubahan'}</button>
  `, (dialog, closeDetails) => {
    dialog.querySelector('[data-approve]').addEventListener('click', () => {
      BDRMS.confirmDialog({
        title: 'Aprubahan ang pagpapatala',
        message: 'Kumpirmahing napatunayan ang paninirahan ni ' + BDRMS.fullName(resident) + ' sa Barangay Wawa.',
        confirmText: 'Aprubahan',
        onConfirm: async () => {
          await BDRMS.approveResidentBySecretary(resident.id, currentSecretary);
          closeDetails();
          renderDashboard();
          BDRMS.toast('Naaprubahan ang pagpapatala.', 'success');
        },
      });
    });
    dialog.querySelector('[data-reject]')?.addEventListener('click', () => {
      BDRMSUI.requestText({
        title: 'Tanggihan ang pagpapatala',
        label: 'Dahilan ng pagtanggi',
        confirmText: 'Tanggihan',
        multiline: true,
        danger: true,
        onSubmit: async reason => {
          try { await BDRMS.rejectResidentBySecretary(resident.id, reason, currentSecretary); }
          catch (error) { BDRMS.toast(error.message, 'error'); return; }
          closeDetails();
          renderDashboard();
          BDRMS.toast('Naitala ang pagtanggi.');
        },
      });
    });
  });
}

/* ---------- Direct Add Resident Modal ---------- */
function openAddResidentModal() {
  const purokOptions = BDRMS.PUROKS.map(p => `<option value="${p}">${p}</option>`).join('');
  const idOptions = BDRMS.ID_TYPES.map(i => `<option value="${i}">${i}</option>`).join('');

  const body = `
    <form id="formAddResident" style="display:grid; gap:14px;">
      <div style="background:#ecfdf5; padding:12px; border-radius:8px; border:1px solid #a7f3d0; font-size:0.82rem; color:#065f46;">
        ✍️ <b>Opisyal na Pagpapatala:</b> Ang residenteng ie-encode rito ay opisyal at agarang magiging aktibo sa database ng Barangay Wawa na may login credentials.
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
        <div class="field">
          <label for="addFirstName">Unang pangalan</label>
          <input type="text" id="addFirstName" class="input" placeholder="hal. Maria" required>
        </div>
        <div class="field">
          <label for="addMiddleName">Gitnang pangalan</label>
          <input type="text" id="addMiddleName" class="input" placeholder="hal. Santos">
        </div>
        <div class="field">
          <label for="addLastName">Apelyido</label>
          <input type="text" id="addLastName" class="input" placeholder="hal. Dela Cruz" required>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
        <div class="field">
          <label for="addPurok">Purok sa Barangay Wawa</label>
          <select id="addPurok" class="select" required>
            ${purokOptions}
          </select>
        </div>
        <div class="field">
          <label for="addContact">Numero ng Telepono</label>
          <input type="text" id="addContact" class="input" placeholder="0917-xxx-xxxx" required>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
        <div class="field">
          <label for="addResidentSince">Petsa ng Simula ng Paninirahan</label>
          <input type="date" id="addResidentSince" class="input" required>
        </div>
        <div class="field">
          <label for="addIdType">Uri ng Valid ID</label>
          <select id="addIdType" class="select">
            ${idOptions}
          </select>
        </div>
      </div>

<p class="muted">Resident record para sa walk-in services. Para sa online login, kailangang magpatala gamit ang sariling email.</p>
    </form>
  `;

  const foot = `
    <button class="btn btn-ghost" data-close>Kanselahin</button>
    <button type="submit" form="formAddResident" class="btn btn-primary">I-rehistro ang Residente</button>
  `;

  const close = BDRMS.modal({
    title: 'Opisyal na Pagpapatala ng Bagong Residente',
    subtitle: 'Tanggapan ng Kalihim — Barangay Wawa, Abra de Ilog',
    body,
    foot,
  });

  document.getElementById('formAddResident').addEventListener('submit', async (event) => {
    event.preventDefault();
    const fn = document.getElementById('addFirstName').value.trim();
    const ln = document.getElementById('addLastName').value.trim();
    const mn = document.getElementById('addMiddleName').value.trim();
    const purok = document.getElementById('addPurok').value;
    const contact = document.getElementById('addContact').value.trim();
    const residentSince = document.getElementById('addResidentSince').value;
    const idType = document.getElementById('addIdType').value;

    const regData = {
      firstName: fn,
      middleName: mn,
      lastName: ln,
      purok,
      contact,
      residentSince,
      idType,
      idNumber: 'VERIFIED-BY-SECRETARY',
    };

    try {
      await BDRMS.registerResidentBySecretary(regData, currentSecretary);
    } catch (error) {
      BDRMS.toast(error.message, 'error');
      return;
    }
    close();
    BDRMS.toast(`Matagumpay na nairehistro si ${fn} ${ln}! Naisave na ang kanyang resident record sa cloud.`, 'success');
    renderDashboard();
  });
}

/* ---------- Reports Tab Rendering ---------- */
function renderReportsView() {
  const store = BDRMS.data();
  const reqs = store.requests || [];

  const totalRevenue = reqs.filter(r => r.status === 'Released' && r.orNumber && !r.orNumber.includes('FREE')).reduce((acc, r) => {
    const doc = BDRMS.DOC_TYPES[r.docType];
    const fee = doc ? parseInt((doc.fee || '0').replace(/\D/g, ''), 10) || 0 : 0;
    return acc + fee;
  }, 0);

  const container = document.getElementById('reportsViewContent');
  if (!container) return;

  container.innerHTML = `
    <div class="workspace-grid">
      <div class="card" style="padding:22px;">
        <span class="muted" style="font-size:0.8rem; font-weight:600; text-transform:uppercase;">Kabuuang Naiprosesong Dokumento</span>
        <strong style="font-size:2.2rem; display:block; font-family:var(--font-display); color:var(--primary); margin-top:4px;">
          ${reqs.filter(r => r.status === 'Released').length}
        </strong>
        <span style="font-size:0.82rem; color:var(--muted);">Mula sa ${reqs.length} kabuuang natanggap na request</span>
      </div>

      <div class="card" style="padding:22px;">
        <span class="muted" style="font-size:0.8rem; font-weight:600; text-transform:uppercase;">Kabuuang Koleksyon ng Barangay</span>
        <strong style="font-size:2.2rem; display:block; font-family:var(--font-display); color:var(--gold); margin-top:4px;">
          ₱${totalRevenue.toLocaleString('en-PH')}
        </strong>
        <span style="font-size:0.82rem; color:var(--muted);">Opisyal na bayarin mula sa mga clearances at sertipiko</span>
      </div>

    </div>
  `;
}
