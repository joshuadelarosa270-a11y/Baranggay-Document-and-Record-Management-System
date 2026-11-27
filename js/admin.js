/* ==========================================================================
   BDRMS — Executive Admin & Monitoring Controller (js/admin.js)
   Barangay Wawa, Abra de Ilog, Occidental Mindoro
   Dedicated Controller for Punong Barangay & System Administrator (Executive Monitor)
   ========================================================================== */

let currentAdmin = null;

document.addEventListener('DOMContentLoaded', async () => {
  try { await BDRMS.ready; } catch (error) { BDRMS.reportError(error); return; }
  const app = document.querySelector('.admin-app');
  const user = BDRMS.currentUser();
  if (!BDRMS.isAdmin(user)) {
    window.location.replace('staff-login.html');
    return;
  }
  currentAdmin = user;
  const accountName = document.querySelector('.user-info strong');
  if (accountName) accountName.textContent = user.name;
  initAdminUI(app);
  app.classList.remove('hidden');

  window.addEventListener('pageshow', () => {
    if (!BDRMS.isAdmin()) {
      app.classList.add('hidden');
      window.location.replace('staff-login.html');
    }
  });
});

function initAdminUI(app) {
  BDRMSUI.mountPagination('requestsPager', 7, renderRequestsTable);
  BDRMSUI.mountPagination('residentsPager', 8, renderResidentsTable);
  BDRMSUI.mountPagination('logsPager', 8, renderLogsTable);
  const renderTab = {
    tabOverview: renderExecutiveDashboard,
    tabRequests: renderRequestsTable,
    tabResidents: renderResidentsTable,
    tabLogs: renderLogsTable,
  };
  BDRMSUI.mountStaffNavigation(app, id => renderTab[id]?.());
  setupLogout();
  renderExecutiveDashboard();
  setupEventListeners();

  // Multi-tab sync
  document.addEventListener('bdrms:sync', () => {
    renderExecutiveDashboard();
    renderRequestsTable();
    renderResidentsTable();
    renderLogsTable();
  });
}

function setupLogout() {
  // Logout
  const logoutBtn = document.getElementById('btnAdminLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      BDRMS.confirmDialog({
        title: 'Mag-logout sa Executive Admin Portal',
        message: 'Nais mo bang lumabas sa portal ng Administrator?',
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


/* ---------- Executive Dashboard & Analytics ---------- */
function renderExecutiveDashboard() {
  const store = BDRMS.data();
  const reqs = store.requests || [];
  const residents = store.residents || [];

  const totalReqs = reqs.length;
  const releasedReqs = reqs.filter(r => r.status === 'Released').length;
  const pendingReqs = reqs.filter(r => r.status === 'Submitted' || r.status === 'Under Verification' || r.status === 'For Approval').length;
  const verifiedResidents = residents.filter(r => r.verified && r.status !== 'pending_approval').length;

  const totalRevenue = reqs.filter(r => r.status === 'Released' && r.orNumber && !r.orNumber.includes('FREE')).reduce((acc, r) => {
    const doc = BDRMS.DOC_TYPES[r.docType];
    const fee = doc ? parseInt((doc.fee || '0').replace(/\D/g, ''), 10) || 0 : 0;
    return acc + fee;
  }, 0);

  const efficiencyRate = totalReqs > 0 ? Math.round((releasedReqs / totalReqs) * 100) : 100;

  // Set KPI stats
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  setEl('admTotalResidents', verifiedResidents);
  setEl('admTotalRequests', totalReqs);
  setEl('admReleasedRequests', releasedReqs);
  setEl('admPendingRequests', pendingReqs);
  setEl('admTotalRevenue', `₱${totalRevenue.toLocaleString('en-PH')}`);
  setEl('admEfficiencyRate', `${efficiencyRate}%`);

  const pendingBadge = document.getElementById('badgePendingCount');
  if (pendingBadge) {
    pendingBadge.innerText = pendingReqs;
    pendingBadge.style.display = pendingReqs > 0 ? 'inline-flex' : 'none';
  }

  // Purok breakdown
  const purokGrid = document.getElementById('admPurokBreakdown');
  if (purokGrid) {
    const purokCounts = {};
    BDRMS.PUROKS.forEach(p => { purokCounts[p] = 0; });
    residents.forEach(r => {
      if (purokCounts[r.purok] !== undefined) purokCounts[r.purok]++;
    });

    purokGrid.innerHTML = BDRMS.PUROKS.map(p => {
      const count = purokCounts[p] || 0;
      const pct = verifiedResidents > 0 ? Math.round((count / verifiedResidents) * 100) : 0;
      return `
        <div style="background:#f8fafc; padding:12px 14px; border-radius:10px; border:1px solid var(--border);">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <b style="font-size:0.85rem; color:var(--text);">${p}</b>
            <span style="font-size:0.85rem; font-weight:700; color:var(--primary);">${count} res.</span>
          </div>
          <div style="margin-top:6px; background:#e2e8f0; height:6px; border-radius:3px; overflow:hidden;">
            <div style="background:var(--primary); height:100%; width:${pct}%;"></div>
          </div>
          <span style="font-size:0.72rem; color:var(--muted); margin-top:4px; display:block;">${pct}% ng kabuuang residente</span>
        </div>
      `;
    }).join('');
  }

  // Document types breakdown
  const docBreakdown = document.getElementById('admDocDemandBreakdown');
  if (docBreakdown) {
    const docCounts = {};
    Object.keys(BDRMS.DOC_TYPES).forEach(k => { docCounts[k] = 0; });
    reqs.forEach(r => {
      if (docCounts[r.docType] !== undefined) docCounts[r.docType]++;
    });

    docBreakdown.innerHTML = Object.entries(BDRMS.DOC_TYPES).map(([k, d]) => {
      const count = docCounts[k] || 0;
      const pct = totalReqs > 0 ? Math.round((count / totalReqs) * 100) : 0;
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border-radius:8px; background:#f8fafc; border:1px solid var(--border); font-size:0.85rem;">
          <div>
            <b>${d.name}</b>
            <span style="font-size:0.75rem; color:var(--muted); display:block;">Bayad: ${d.fee}</span>
          </div>
          <div style="text-align:right;">
            <strong style="font-size:1.1rem; color:var(--text);">${count}</strong>
            <span style="font-size:0.75rem; color:var(--muted); display:block;">${pct}%</span>
          </div>
        </div>
      `;
    }).join('');
  }
}

/* ---------- Event Listeners ---------- */
function setupEventListeners() {
  BDRMSUI.bindRequestFilters(renderRequestsTable);
  document.getElementById('residentSearch').addEventListener('input', () => {
    BDRMSUI.resetPage('residentsPager');
    renderResidentsTable();
  });

  // Export CSV
  const btnExport = document.getElementById('btnExportCSV');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      BDRMS.exportRequestsCSV();
      BDRMS.toast('Na-export na ang opisyal na DILG CSV Report para sa Pamunuan.', 'success');
    });
  }

}

/* ---------- Requests Table (Executive Monitoring View) ---------- */
function renderRequestsTable() {
  BDRMSUI.renderRequests('Tingnan', window.openAdminRequestDetail);
}

/* ---------- Request Detail Modal (Admin Monitoring View) ---------- */
window.openAdminRequestDetail = function(reqId) {
  const req = BDRMS.data().requests.find(r => r.id === reqId);
  if (!req) return;

  const doc = BDRMS.DOC_TYPES[req.docType] || { name: req.docType, fee: 'Free' };
  const statusDef = BDRMS.STATUSES[req.status] || { cls: '', desc: '' };

  const modalBody = `
    <div class="req-detail-grid">
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
      </div>

      <div>
        <!-- Executive Monitoring Notice -->
        <div class="detail-section">
          <h4>Katayuan</h4>
          <div class="verification-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <span>Kasalukuyang Status:</span>
              <span class="badge ${statusDef.cls}">${req.status}</span>
            </div>
            <p style="font-size:0.8rem; color:var(--muted); margin-bottom:14px;">${statusDef.desc}</p>

            <p class="muted">Ang Kalihim ang nagpoproseso ng request.</p>
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
        <button class="btn btn-ghost btn-sm" onclick="printRequestDirect('${req.id}')" title="Preview Certificate">
          ${BDRMS.ICONS.printer}
          Tingnan ang Sertipiko
        </button>
      </div>
      <div>
        <button class="btn btn-primary" data-close>Isara</button>
      </div>
    </div>
  `;

  BDRMS.modal({
    title: `Subaybay sa Request: ${req.ref}`,
    subtitle: `${doc.name} — ${BDRMS.esc(BDRMS.fullName(req.applicant))}`,
    wide: true,
    body: modalBody,
    foot: modalFoot,
  });
};

window.printRequestDirect = function(reqId) {
  const req = BDRMS.data().requests.find(r => r.id === reqId);
  if (!req) return;

  BDRMS.log(currentAdmin, `Viewed official printout preview for ${req.ref}`);

  BDRMS.modal({
    title: 'Official Document Print Preview (Audit Copy)',
    subtitle: `${BDRMS.DOC_TYPES[req.docType].name} — Barangay Wawa, Abra de Ilog`,
    wide: true,
    body: BDRMS.certificateHTML(req),
    foot: `
      <button class="btn btn-ghost" data-close>Close</button>
      <button class="btn btn-primary" onclick="window.print()">${BDRMS.ICONS.printer} Print Copy</button>
    `,
  });
};

/* ---------- Residents Registry (Master Directory View) ---------- */
function renderResidentsTable() {
  const tbody = document.getElementById('residentsTableBody');
  const query = document.getElementById('residentSearch').value.trim().toLowerCase();
  const residents = BDRMS.data().residents.filter(resident => resident.verified &&
    resident.status !== 'pending_approval' && BDRMSUI.matchesResidentSearch(resident, query));
  const visible = BDRMSUI.page('residentsPager', residents);
  tbody.innerHTML = visible.length ? visible.map(resident => `
    <tr role="row">
      <td role="cell" data-label="Residente">
        <strong>${BDRMS.esc(BDRMS.fullName(resident))}</strong>
        <span class="row-detail">${BDRMS.esc(resident.username || '—')}</span>
      </td>
      <td role="cell" data-label="Purok">${BDRMS.esc(resident.purok)}</td>
      <td role="cell" data-label="Paninirahan">${BDRMS.residencyText(resident.residentSince)}</td>
      <td role="cell" data-label="Katayuan"><span class="badge badge-ready">Aktibo</span></td>
      <td role="cell" class="row-action"><button type="button" class="btn btn-ghost btn-sm" data-resident-id="${BDRMS.esc(resident.id)}">Tingnan</button></td>
    </tr>`).join('') : '<tr role="row"><td role="cell" colspan="5" class="table-empty">Walang nahanap na residente.</td></tr>';
  tbody.onclick = event => {
    const button = event.target.closest('[data-resident-id]');
    if (!button) return;
    const resident = residents.find(record => record.id === button.dataset.residentId);
    if (resident) BDRMSUI.residentDetails(resident);
  };
}

/* ---------- System Audit Trail Table ---------- */
function renderLogsTable() {
  const tbody = document.getElementById('logsTableBody');
  if (!tbody) return;

  const logs = BDRMSUI.page('logsPager', BDRMS.data().logs);

  if (logs.length === 0) {
    tbody.innerHTML = `
      <tr role="row">
        <td role="cell" colspan="4" class="table-empty">
          Walang naitalang audit log sa ngayon.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = logs.map(l => {
    let roleBadge = '<span class="badge badge-verification no-dot">System</span>';
    if (l.role === 'admin') roleBadge = '<span class="badge no-dot" style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe;">Admin</span>';
    else if (l.role === 'secretary') roleBadge = '<span class="badge badge-ready no-dot">Secretary</span>';
    else if (l.role === 'resident') roleBadge = '<span class="badge badge-submitted no-dot">Resident</span>';

    return `
      <tr role="row">
        <td style="font-size:0.82rem; color:var(--muted);">${BDRMS.fmtDateTime(l.at)}</td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            <b>${BDRMS.esc(l.user)}</b>
            ${roleBadge}
          </div>
        </td>
        <td><span style="font-weight:500;">${BDRMS.esc(l.action)}</span></td>
        <td><span class="ref-badge">${BDRMS.esc(l.target || '—')}</span></td>
      </tr>
    `;
  }).join('');
}
