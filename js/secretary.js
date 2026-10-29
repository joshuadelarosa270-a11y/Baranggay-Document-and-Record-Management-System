/* ==========================================================================
   BDRMS — Tanggapan ng Kalihim (Secretary Portal Controller)
   Barangay Wawa, Abra de Ilog, Occidental Mindoro
   Dedicated Controller for Sec. Lorna P. Fernandez (Operations & Approvals)
   ========================================================================== */

let currentSecretary = null;
let activeTab = 'tabRequests';
let activeResidentsSubtab = 'active';
let currentDetailModalClose = null;

document.addEventListener('DOMContentLoaded', () => {
  // Check if logged out
  if (sessionStorage.getItem('bdrms_secretary_logout') === 'true') {
    sessionStorage.removeItem('bdrms_secretary_logout');
    window.location.href = 'secretary-login.html';
    return;
  }

  // Ensure Secretary session
  let user = BDRMS.currentUser();
  if (!user || user.role !== 'secretary') {
    // Auto-login as secretary for demo / direct link ease
    user = BDRMS.login('secretary', 'secretary123');
  }

  currentSecretary = user;
  initSecretaryUI(user);
});

function initSecretaryUI(user) {
  setupNavigation();
  renderDashboard();
  setupEventListeners();

  // Multi-tab store sync
  document.addEventListener('bdrms:sync', () => {
    renderDashboard();
    renderRequestsTable();
    renderResidentsTable();
  });
}

/* ---------- Navigation & Tab Switching ---------- */
function setupNavigation() {
  document.querySelectorAll('.admin-sidebar .nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Mobile sidebar toggle
  const menuToggle = document.getElementById('secretaryMenuToggle');
  const sidebar = document.getElementById('secretarySidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      const expanded = !sidebar.classList.contains('collapsed');
      menuToggle.setAttribute('aria-expanded', expanded);
    });
  }

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
        onConfirm: () => {
          sessionStorage.setItem('bdrms_secretary_logout', 'true');
          BDRMS.logout('Secretary logged out');
          BDRMS.toast('Naka-logout na sa Tanggapan ng Kalihim.');
          setTimeout(() => {
            window.location.href = 'secretary-login.html';
          }, 350);
        }
      });
    });
  }
}

function switchTab(tabId) {
  activeTab = tabId;

  document.querySelectorAll('.admin-sidebar .nav-item').forEach(item => {
    if (item.getAttribute('data-tab') === tabId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  document.querySelectorAll('.admin-content .tab-pane').forEach(pane => {
    if (pane.id === tabId) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  if (tabId === 'tabRequests') {
    renderRequestsTable();
  } else if (tabId === 'tabResidents') {
    renderResidentsTable();
  } else if (tabId === 'tabReports') {
    renderReportsView();
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
  const pendingRes = residents.filter(r => !r.verified || r.status === 'pending_approval').length;

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
}

/* ---------- Event Listeners ---------- */
function setupEventListeners() {
  // Stat cards filter
  document.querySelectorAll('.stat-card').forEach(card => {
    card.addEventListener('click', () => {
      const status = card.getAttribute('data-filter-status');
      if (status && status !== 'all') {
        const filterStatus = document.getElementById('filterStatus');
        if (filterStatus) {
          filterStatus.value = status;
          renderRequestsTable();
        }
      } else {
        const filterStatus = document.getElementById('filterStatus');
        if (filterStatus) {
          filterStatus.value = 'all';
          renderRequestsTable();
        }
      }
      switchTab('tabRequests');
    });
  });

  // Table filters
  const searchInput = document.getElementById('tableSearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => renderRequestsTable());
  }

  const filterDoc = document.getElementById('filterDocType');
  if (filterDoc) filterDoc.addEventListener('change', () => renderRequestsTable());

  const filterStat = document.getElementById('filterStatus');
  if (filterStat) filterStat.addEventListener('change', () => renderRequestsTable());

  const filterChan = document.getElementById('filterChannel');
  if (filterChan) filterChan.addEventListener('change', () => renderRequestsTable());

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

  // Residents subtabs
  const subActive = document.getElementById('subtabActiveResidents');
  const subPending = document.getElementById('subtabPendingResidents');
  if (subActive && subPending) {
    subActive.addEventListener('click', () => {
      activeResidentsSubtab = 'active';
      updateResidentsSubtabsUI();
      renderResidentsTable();
    });
    subPending.addEventListener('click', () => {
      activeResidentsSubtab = 'pending';
      updateResidentsSubtabsUI();
      renderResidentsTable();
    });
  }

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
  const tbody = document.getElementById('requestsTableBody');
  if (!tbody) return;

  const store = BDRMS.data();
  let list = [...(store.requests || [])];

  const searchVal = (document.getElementById('tableSearch')?.value || '').toLowerCase().trim();
  const docVal = document.getElementById('filterDocType')?.value || 'all';
  const statVal = document.getElementById('filterStatus')?.value || 'all';
  const chanVal = document.getElementById('filterChannel')?.value || 'all';

  if (searchVal) {
    list = list.filter(r =>
      r.ref.toLowerCase().includes(searchVal) ||
      BDRMS.fullName(r.applicant).toLowerCase().includes(searchVal) ||
      (r.applicant.purok && r.applicant.purok.toLowerCase().includes(searchVal)) ||
      (r.purpose && r.purpose.toLowerCase().includes(searchVal))
    );
  }

  if (docVal !== 'all') {
    list = list.filter(r => r.docType === docVal);
  }

  if (statVal !== 'all') {
    list = list.filter(r => r.status === statVal);
  }

  if (chanVal !== 'all') {
    list = list.filter(r => r.channel === chanVal);
  }

  // Sort: most recent first
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 48px 20px; color: var(--muted);">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">📂</div>
          <b>Walang nahanap na dokumento</b><br>
          <span style="font-size: 0.85rem;">Subukang baguhin ang filter o i-clear ang search box.</span>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(req => {
    const doc = BDRMS.DOC_TYPES[req.docType] || { name: req.docType, fee: '—' };
    const statusDef = BDRMS.STATUSES[req.status] || { cls: 'badge-submitted', desc: '' };
    const isNew = req.status === 'Submitted' || req.status === 'For Approval';

    return `
      <tr class="${isNew ? 'row-highlight' : ''}" style="cursor: pointer;" onclick="openRequestDetail('${req.id}')">
        <td>
          <span class="ref-badge">${req.ref}</span>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--text);">${BDRMS.esc(BDRMS.fullName(req.applicant))}</div>
          <div style="font-size: 0.78rem; color: var(--muted);">${BDRMS.esc(req.applicant.purok)}, Brgy. Wawa</div>
        </td>
        <td>
          <div style="font-weight: 500;">${doc.name}</div>
          <div style="font-size: 0.78rem; color: var(--muted);">${BDRMS.esc(req.purpose || 'Personal Use')}</div>
        </td>
        <td>
          <span class="channel-pill ${req.channel === 'Walk-in' ? 'channel-walkin' : 'channel-online'}">
            ${req.channel === 'Walk-in' ? '🏛️ Walk-in' : '🌐 Online'}
          </span>
        </td>
        <td>
          <span class="badge ${statusDef.cls}">
            ${req.status}
          </span>
        </td>
        <td style="font-size: 0.82rem; color: var(--muted);" title="${BDRMS.fmtDateTime(req.createdAt)}">
          ${BDRMS.timeAgo(req.createdAt)}
        </td>
        <td style="text-align: right;" onclick="event.stopPropagation()">
          <button class="btn btn-primary btn-sm" onclick="openRequestDetail('${req.id}')" title="Suriin at Aprubahan ang Request">
            ${BDRMS.ICONS.signature}
            Suriin / Aprubahan
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/* ---------- Request Detail Modal (Secretary View) ---------- */
window.openRequestDetail = function(reqId) {
  const req = BDRMS.data().requests.find(r => r.id === reqId);
  if (!req) return;

  const doc = BDRMS.DOC_TYPES[req.docType] || { name: req.docType, fee: 'Free' };
  const statusDef = BDRMS.STATUSES[req.status] || { cls: '', desc: '' };
  const user = currentSecretary;

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
          <h4>Pagsusuri at Pag-apruba ni Secretary</h4>
          <div class="verification-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <span>Status ng Dokumento:</span>
              <span class="badge ${statusDef.cls}">${req.status}</span>
            </div>
            <p style="font-size:0.8rem; color:var(--muted); margin-bottom:14px;">${statusDef.desc}</p>

            <div style="border-top:1px solid var(--border); padding-top:14px;">
              <b style="font-size:0.82rem; display:block; margin-bottom:8px; color:var(--text-soft);">Aksyon ng Kalihim:</b>
              <div id="secretaryWorkflowActionContainer" style="display:grid; gap:8px;">
                ${renderWorkflowActions(req, user)}
              </div>
            </div>
          </div>
        </div>

        <!-- History / Timeline -->
        <div class="detail-section" style="margin-top:18px;">
          <h4>Kasaysayan ng Transaksyon (Timeline)</h4>
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

  BDRMS.modal({
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
        const modalOverlay = document.querySelector('.modal-overlay');
        const closeModal = () => { if (modalOverlay) modalOverlay.remove(); };
        handleSecretaryAction(req, action, closeModal);
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

function renderWorkflowActions(req, user) {
  const status = req.status;
  const btns = [];

  if (status === 'Submitted') {
    btns.push(`<button class="btn btn-primary btn-block" data-action="verify_and_forward">${BDRMS.ICONS.send} 1-Click Verify at I-forward para sa Approval</button>`);
    btns.push(`<button class="btn btn-ghost btn-block btn-sm" data-action="verify" style="margin-top:4px;">${BDRMS.ICONS.search} Ilagay sa Under Verification (Kulang pa ang requirements)</button>`);
  }
  if (status === 'Under Verification') {
    btns.push(`<button class="btn btn-primary btn-block" data-action="forward">${BDRMS.ICONS.send} I-forward para sa Huling Pag-apruba</button>`);
  }
  if (status === 'For Approval') {
    btns.push(`<button class="btn btn-primary btn-block" data-action="approve">${BDRMS.ICONS.signature} Aprubahan at Ihanda ang Dokumento (Ready for Pickup)</button>`);
  }
  if (status === 'Ready for Pickup') {
    btns.push(`<button class="btn btn-primary btn-block" data-action="release">${BDRMS.ICONS.badgeCheck} Tanggapin ang Bayad at I-release ang Dokumento</button>`);
  }

  // Reject / Return Option
  if (status !== 'Released' && status !== 'Rejected') {
    btns.push(`<button class="btn btn-danger btn-block btn-sm" data-action="reject" style="margin-top:8px;">${BDRMS.ICONS.x} Tanggihan / Ibalik ang Kahilingan</button>`);
  }

  if (btns.length === 0) {
    return `<div style="font-size:0.82rem; color:var(--muted); text-align:center; padding:10px;">Nakumpleto na ang dokumento at minarkahang ${status}.</div>`;
  }

  return btns.join('');
}

async function handleSecretaryAction(req, action, closeModal) {
  const user = currentSecretary;
  const now = new Date().toISOString();
  const doc = BDRMS.DOC_TYPES[req.docType] || { name: req.docType, fee: 'Free' };

  if (action === 'verify_and_forward') {
    req.status = 'For Approval';
    req.verification = req.verification || {};
    req.verification.identity = true;
    req.verification.residency = true;
    req.history.push({ status: 'Under Verification', by: user.short, at: now, note: 'Identity & residency verified against barangay database.' });
    req.history.push({ status: 'For Approval', by: user.short, at: new Date(Date.now() + 1000).toISOString(), note: 'Verified by Secretary Lorna Fernandez and marked for approval.' });
    BDRMS.log(user, `Verified and forwarded ${req.ref} for approval`);
    BDRMS.toast(`Na-verify na! Ang ${req.ref} ay nai-forward para sa pinal na pag-apruba.`, 'success');
  } else if (action === 'verify') {
    req.status = 'Under Verification';
    req.verification = req.verification || {};
    req.verification.identity = true;
    req.verification.residency = true;
    req.history.push({ status: 'Under Verification', by: user.short, at: now, note: 'Checking proof of dwelling or additional requirements.' });
    BDRMS.log(user, `Marked request ${req.ref} under verification`);
    BDRMS.toast(`Inilagay ang ${req.ref} sa Under Verification.`, 'info');
  } else if (action === 'forward') {
    req.status = 'For Approval';
    req.history.push({ status: 'For Approval', by: user.short, at: now, note: 'Endorsed for final approval.' });
    BDRMS.log(user, `Forwarded ${req.ref} for approval`);
    BDRMS.toast(`Nai-forward ang ${req.ref} para sa approval.`, 'info');
  } else if (action === 'approve') {
    req.status = 'Ready for Pickup';
    req.history.push({ status: 'Ready for Pickup', by: user.short, at: now, note: 'Approved and finalized by Secretary Lorna P. Fernandez.' });
    BDRMS.log(user, `Approved request ${req.ref}`);
    BDRMS.toast(`Naaprubahan! Handa nang kunin ang dokumento ${req.ref}.`, 'success');
  } else if (action === 'release') {
    const isFeeFree = doc.fee.includes('Free') || doc.fee === '₱0';
    let or = req.orNumber;

    if (!isFeeFree && !or) {
      or = prompt(`Koleksyon ng Bayad: ${doc.fee}\nIlagay ang Official Receipt (OR) Number:`, `OR-2026-${Math.floor(1000 + Math.random() * 9000)}`);
      if (or === null) return;
    }

    req.status = 'Released';
    req.orNumber = or || 'FREE-RA11261';
    req.releasedAt = now;
    req.history.push({ status: 'Released', by: user.short, at: now, note: `Document issued and released. OR# ${req.orNumber}` });
    BDRMS.log(user, `Released document ${req.ref} with OR# ${req.orNumber}`);
    BDRMS.toast(`Matagumpay na na-release ang dokumento! OR# ${req.orNumber}`, 'success');
  } else if (action === 'reject') {
    const reason = prompt('Ilagay ang opisyal na dahilan ng pagtanggi:', 'Kulang ang patunay ng paninirahan o hindi tugma ang rekord.');
    if (!reason) return;

    req.status = 'Rejected';
    req.remarks = reason;
    req.history.push({ status: 'Rejected', by: user.short, at: now, note: `Rejected by Secretary: ${reason}` });
    BDRMS.log(user, `Rejected ${req.ref}: ${reason}`);
    BDRMS.toast(`Minarkahang Rejected ang ${req.ref}.`, 'error');
  }

  req.updatedAt = now;
  BDRMS.save();
  closeModal();
  renderDashboard();
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
        <label>Pumili ng Rehistradong Residente</label>
        <select id="walkinResidentId" class="select" required>
          <option value="">-- Piliin ang Pangalan ng Residente --</option>
          ${residentOptions}
        </select>
        <span class="muted" style="font-size:0.78rem;">Kung wala sa listahan, kailangang irehistro muna gamit ang "Magrehistro ng Residente" button.</span>
      </div>

      <div class="field">
        <label>Uri ng Dokumento</label>
        <select id="walkinDocType" class="select" required>
          ${docOptions}
        </select>
      </div>

      <div class="field">
        <label>Layunin (Purpose)</label>
        <input type="text" id="walkinPurpose" class="input" placeholder="hal. Trabaho, Scholarship, ID Requirement" required>
      </div>

      <div class="field">
        <label>Aksyon ni Secretary Pagkatapos I-encode</label>
        <select id="walkinInitialStatus" class="select">
          <option value="Ready for Pickup">Aprubahan Agad (Ready for Pickup / Release)</option>
          <option value="For Approval">Ihanda para sa Review (For Approval)</option>
        </select>
      </div>
    </form>
  `;

  const foot = `
    <button class="btn btn-ghost" data-close>Kanselahin</button>
    <button class="btn btn-primary" id="btnSubmitWalkin">I-encode at Isumite</button>
  `;

  BDRMS.modal({
    title: '✍️ Mag-encode ng Walk-in Request sa Hall',
    subtitle: 'Tanggapan ng Kalihim — Barangay Wawa, Abra de Ilog',
    body,
    foot,
  });

  document.getElementById('btnSubmitWalkin').addEventListener('click', () => {
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
      ref: `BW-2603-${Math.floor(1000 + Math.random() * 9000)}`,
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
    BDRMS.save();
    BDRMS.log(currentSecretary, `Encoded walk-in request ${newReq.ref} for ${BDRMS.fullName(resident)}`);
    BDRMS.toast(`Matagumpay na nai-encode ang walk-in request: ${newReq.ref}`, 'success');

    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.remove();

    renderDashboard();
  });
}

/* ---------- Residents Registry ---------- */
function updateResidentsSubtabsUI() {
  const subActive = document.getElementById('subtabActiveResidents');
  const subPending = document.getElementById('subtabPendingResidents');
  if (subActive && subPending) {
    if (activeResidentsSubtab === 'active') {
      subActive.classList.add('active');
      subPending.classList.remove('active');
    } else {
      subPending.classList.add('active');
      subActive.classList.remove('active');
    }
  }
}

function renderResidentsTable() {
  const tbody = document.getElementById('residentsTableBody');
  const thead = document.getElementById('residentsTableHead');
  if (!tbody) return;

  const store = BDRMS.data();
  const allResidents = store.residents || [];

  let list = [];
  if (activeResidentsSubtab === 'active') {
    list = allResidents.filter(r => r.verified && r.status !== 'pending_approval');
    if (thead) {
      thead.innerHTML = `
        <tr>
          <th>Resident ID</th>
          <th>Buong Pangalan</th>
          <th>Purok sa Wawa</th>
          <th>Numero ng Telepono</th>
          <th>Tagal ng Paninirahan</th>
          <th>Katayuan</th>
        </tr>
      `;
    }
  } else {
    list = allResidents.filter(r => !r.verified || r.status === 'pending_approval');
    if (thead) {
      thead.innerHTML = `
        <tr>
          <th>Petsa ng Pre-reg</th>
          <th>Buong Pangalan</th>
          <th>Purok sa Wawa</th>
          <th>Numero ng Telepono</th>
          <th>Dokumento / ID</th>
          <th style="text-align:right;">Aksyon ni Secretary</th>
        </tr>
      `;
    }
  }

  if (list.length === 0) {
    const msg = activeResidentsSubtab === 'active'
      ? 'Walang rehistradong residente sa ngayon.'
      : 'Walang naghihintay na rehistrasyon. Lahat ng resident pre-registration ay nasuri at naaprubahan na.';
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 42px 20px; color: var(--muted);">
          <div style="font-size: 2rem; margin-bottom: 6px;">👥</div>
          ${msg}
        </td>
      </tr>
    `;
    return;
  }

  if (activeResidentsSubtab === 'active') {
    tbody.innerHTML = list.map(r => `
      <tr>
        <td><span class="ref-badge">${r.id}</span></td>
        <td>
          <b>${BDRMS.esc(BDRMS.fullName(r))}</b>
          <div style="font-size:0.76rem; color:var(--muted);">User: @${BDRMS.esc(r.username || 'resident')}</div>
        </td>
        <td>${BDRMS.esc(r.purok)}, Brgy. Wawa</td>
        <td>${BDRMS.esc(r.contact || '—')}</td>
        <td>${BDRMS.residencyText(r.residentSince)}</td>
        <td><span class="badge badge-ready no-dot">✓ Opisyal na Rehistrado</span></td>
      </tr>
    `).join('');
  } else {
    tbody.innerHTML = list.map(r => `
      <tr style="background:#fffbeb;">
        <td style="font-size:0.82rem; color:var(--muted);">${BDRMS.fmtDate(r.registeredAt || new Date().toISOString())}</td>
        <td>
          <b>${BDRMS.esc(BDRMS.fullName(r))}</b>
          <div style="font-size:0.76rem; color:var(--muted);">Username: @${BDRMS.esc(r.username)}</div>
        </td>
        <td><b>${BDRMS.esc(r.purok)}</b>, Brgy. Wawa</td>
        <td>${BDRMS.esc(r.contact || '—')}</td>
        <td>
          <div style="font-size:0.82rem;">${BDRMS.esc(r.idType || 'PhilSys')}</div>
          <div style="font-size:0.75rem; color:var(--muted);"># ${BDRMS.esc(r.idNumber || '—')}</div>
        </td>
        <td style="text-align:right;">
          <button class="btn btn-primary btn-sm" onclick="approveResident('${r.id}')" title="Aprubahan at i-activate ang resident account">
            ${BDRMS.ICONS.badgeCheck} Aprubahan at I-rehistro
          </button>
          <button class="btn btn-danger btn-sm" onclick="rejectResident('${r.id}')" style="margin-left:6px;" title="Tanggihan kung hindi lehitimong residente">
            ${BDRMS.ICONS.x} Tanggihan
          </button>
        </td>
      </tr>
    `).join('');
  }
}

window.approveResident = function(resId) {
  const resident = BDRMS.data().residents.find(r => r.id === resId);
  if (!resident) return;

  BDRMS.confirmDialog({
    title: 'Aprubahan ang Rehistrasyon ng Residente',
    message: `Kumpirmahin na na-verify ni Secretary Lorna Fernandez ang paninirahan ni <b>${BDRMS.fullName(resident)}</b> sa ${resident.purok}, Barangay Wawa. Magiging aktibo na ang kanyang login.`,
    confirmText: 'Oo, Aprubahan at I-rehistro',
    cancelText: 'Kanselahin',
    onConfirm: () => {
      BDRMS.approveResidentBySecretary(resId, currentSecretary);
      BDRMS.toast(`Naaprubahan na! Rehistrado na si ${BDRMS.fullName(resident)} at maaari nang mag-login sa Resident Portal.`, 'success');
      renderDashboard();
    }
  });
};

window.rejectResident = function(resId) {
  const resident = BDRMS.data().residents.find(r => r.id === resId);
  if (!resident) return;

  const reason = prompt('Ilagay ang dahilan ng pagtanggi sa rehistrasyon:', 'Hindi naninirahan sa Barangay Wawa o kulang ang patunay ng tirahan.');
  if (!reason) return;

  BDRMS.rejectResidentBySecretary(resId, reason, currentSecretary);
  BDRMS.toast(`Tinanggihan ang rehistrasyon ni ${BDRMS.fullName(resident)}.`, 'error');
  renderDashboard();
};

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
          <label>Pangalan (First Name)</label>
          <input type="text" id="addFirstName" class="input" placeholder="hal. Maria" required>
        </div>
        <div class="field">
          <label>Gitnang Pangalan (Middle Name)</label>
          <input type="text" id="addMiddleName" class="input" placeholder="hal. Santos">
        </div>
        <div class="field">
          <label>Apelyido (Last Name)</label>
          <input type="text" id="addLastName" class="input" placeholder="hal. Dela Cruz" required>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
        <div class="field">
          <label>Purok sa Barangay Wawa</label>
          <select id="addPurok" class="select" required>
            ${purokOptions}
          </select>
        </div>
        <div class="field">
          <label>Numero ng Telepono</label>
          <input type="text" id="addContact" class="input" placeholder="0917-xxx-xxxx" required>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
        <div class="field">
          <label>Petsa ng Simula ng Paninirahan</label>
          <input type="date" id="addResidentSince" class="input" value="2018-01-15" required>
        </div>
        <div class="field">
          <label>Uri ng Valid ID</label>
          <select id="addIdType" class="select">
            ${idOptions}
          </select>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
        <div class="field">
          <label>Resident Username (para sa Login)</label>
          <input type="text" id="addUsername" class="input" placeholder="hal. maria.delacruz" required>
        </div>
        <div class="field">
          <label>Default Password</label>
          <input type="text" id="addPassword" class="input" value="resident123" required>
        </div>
      </div>
    </form>
  `;

  const foot = `
    <button class="btn btn-ghost" data-close>Kanselahin</button>
    <button class="btn btn-primary" id="btnSubmitAddResident">I-rehistro ang Residente</button>
  `;

  BDRMS.modal({
    title: '✍️ Opisyal na Pagpapatala ng Bagong Residente',
    subtitle: 'Tanggapan ng Kalihim — Barangay Wawa, Abra de Ilog',
    body,
    foot,
  });

  document.getElementById('btnSubmitAddResident').addEventListener('click', () => {
    const fn = document.getElementById('addFirstName').value.trim();
    const ln = document.getElementById('addLastName').value.trim();
    const mn = document.getElementById('addMiddleName').value.trim();
    const purok = document.getElementById('addPurok').value;
    const contact = document.getElementById('addContact').value.trim();
    const residentSince = document.getElementById('addResidentSince').value;
    const idType = document.getElementById('addIdType').value;
    const username = document.getElementById('addUsername').value.trim().toLowerCase();
    const password = document.getElementById('addPassword').value;

    if (!fn || !ln || !contact || !username) {
      BDRMS.toast('Pakipunan ang lahat ng kinakailangang impormasyon.', 'error');
      return;
    }

    const regData = {
      firstName: fn,
      middleName: mn,
      lastName: ln,
      purok,
      contact,
      residentSince,
      idType,
      idNumber: 'VERIFIED-BY-SECRETARY',
      username,
      password,
    };

    const res = BDRMS.registerResidentBySecretary(regData, currentSecretary);
    if (res && res.success) {
      BDRMS.toast(`Matagumpay na nairehistro si ${fn} ${ln}! Aktibo na ang kanyang login sa Resident Portal.`, 'success');
      const overlay = document.querySelector('.modal-overlay');
      if (overlay) overlay.remove();
      renderDashboard();
    } else {
      BDRMS.toast(res.message || 'Hindi mairehistro ang residente.', 'error');
    }
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
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:20px; margin-bottom:24px;">
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

      <div class="card" style="padding:22px;">
        <span class="muted" style="font-size:0.8rem; font-weight:600; text-transform:uppercase;">DILG Compliance Report</span>
        <div style="margin-top:8px;">
          <button class="btn btn-primary btn-block" onclick="BDRMS.exportRequestsCSV()">
            ${BDRMS.ICONS.printer} I-download ang DILG CSV Report
          </button>
        </div>
        <span style="font-size:0.8rem; color:var(--muted); display:block; margin-top:8px;">Format ayon sa pamantayan ng DILG at LGU Abra de Ilog.</span>
      </div>
    </div>
  `;
}
