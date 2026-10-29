/* ==========================================================================
   BDRMS — Executive Admin & Monitoring Controller (js/admin.js)
   Barangay Wawa, Abra de Ilog, Occidental Mindoro
   Dedicated Controller for Punong Barangay & System Administrator (Executive Monitor)
   ========================================================================== */

let currentAdmin = null;
let activeTab = 'tabOverview';

document.addEventListener('DOMContentLoaded', () => {
  // If user deliberately logged out, redirect to admin-login
  if (sessionStorage.getItem('bdrms_admin_logout') === 'true') {
    sessionStorage.removeItem('bdrms_admin_logout');
    window.location.href = 'admin-login.html';
    return;
  }

  // Ensure Admin session
  let user = BDRMS.currentUser();
  if (!user || user.role !== 'admin') {
    // Auto-login as admin for demo ease
    user = BDRMS.login('admin', 'admin123');
  }

  currentAdmin = user;
  initAdminUI(user);
});

function initAdminUI(user) {
  setupNavigation();
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

/* ---------- Navigation & Tab Switching ---------- */
function setupNavigation() {
  document.querySelectorAll('.admin-sidebar .nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Mobile sidebar toggle
  const menuToggle = document.getElementById('adminMenuToggle');
  const sidebar = document.getElementById('adminSidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      const expanded = !sidebar.classList.contains('collapsed');
      menuToggle.setAttribute('aria-expanded', expanded);
    });
  }

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
        onConfirm: () => {
          sessionStorage.setItem('bdrms_admin_logout', 'true');
          BDRMS.logout('Administrator logged out');
          BDRMS.toast('Naka-logout na sa Executive Portal.');
          setTimeout(() => {
            window.location.href = 'admin-login.html';
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

  if (tabId === 'tabOverview') {
    renderExecutiveDashboard();
  } else if (tabId === 'tabRequests') {
    renderRequestsTable();
  } else if (tabId === 'tabResidents') {
    renderResidentsTable();
  } else if (tabId === 'tabLogs') {
    renderLogsTable();
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

  // Export CSV
  const btnExport = document.getElementById('btnExportCSV');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      BDRMS.exportRequestsCSV();
      BDRMS.toast('Na-export na ang opisyal na DILG CSV Report para sa Pamunuan.', 'success');
    });
  }

  // Reset database
  const btnReset = document.getElementById('btnResetData');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      BDRMS.confirmDialog({
        title: 'I-reset ang Sistema sa Default',
        message: 'Nais mo bang ibalik ang lahat ng talaan ng Barangay Wawa sa orihinal nitong estado? Mawawala ang mga binagong transaksyon sa demo.',
        confirmText: 'Oo, I-reset ang Datos',
        cancelText: 'Kanselahin',
        danger: true,
        onConfirm: () => {
          BDRMS.reset();
          BDRMS.toast('Matagumpay na naibalik ang database sa default.', 'success');
          setTimeout(() => location.reload(), 400);
        }
      });
    });
  }
}

/* ---------- Requests Table (Executive Monitoring View) ---------- */
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

  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 48px 20px; color: var(--muted);">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">📂</div>
          <b>Walang nahanap na talaan</b><br>
          <span style="font-size: 0.85rem;">Subukang baguhin ang mga filter.</span>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(req => {
    const doc = BDRMS.DOC_TYPES[req.docType] || { name: req.docType, fee: '—' };
    const statusDef = BDRMS.STATUSES[req.status] || { cls: 'badge-submitted', desc: '' };

    return `
      <tr style="cursor: pointer;" onclick="openAdminRequestDetail('${req.id}')">
        <td><span class="ref-badge">${req.ref}</span></td>
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
          <span class="badge ${statusDef.cls}">${req.status}</span>
        </td>
        <td style="font-size: 0.82rem; color: var(--muted);" title="${BDRMS.fmtDateTime(req.createdAt)}">
          ${BDRMS.timeAgo(req.createdAt)}
        </td>
        <td style="text-align: right;" onclick="event.stopPropagation()">
          <button class="btn btn-ghost btn-sm" onclick="openAdminRequestDetail('${req.id}')" title="Tingnan ang Detalye ng Request (Monitoring)">
            ${BDRMS.ICONS.eye}
            Tingnan (Monitor)
          </button>
        </td>
      </tr>
    `;
  }).join('');
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
          <h4>Katayuan at Subaybay (Monitoring)</h4>
          <div class="verification-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <span>Kasalukuyang Status:</span>
              <span class="badge ${statusDef.cls}">${req.status}</span>
            </div>
            <p style="font-size:0.8rem; color:var(--muted); margin-bottom:14px;">${statusDef.desc}</p>

            <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:12px; font-size:0.82rem; color:#1e40af; line-height:1.5;">
              <b>🛡️ Executive Monitoring Mode:</b><br>
              Naka-login ka bilang <b>System Administrator</b> (Tagasubaybay Lamang). Ang pag-verify, pag-apruba, at pag-release ng dokumentong ito ay <b>eksklusibong isinasagawa ng Kalihim ng Barangay (Sec. Lorna P. Fernandez)</b> upang maiwasan ang conflict of interest.
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
  if (!tbody) return;

  const store = BDRMS.data();
  const allResidents = store.residents || [];
  const list = allResidents.filter(r => r.verified && r.status !== 'pending_approval');

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 42px 20px; color: var(--muted);">
          <div style="font-size: 2rem; margin-bottom: 6px;">👥</div>
          Walang rehistradong residente sa ngayon.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(r => `
    <tr>
      <td><span class="ref-badge">${r.id}</span></td>
      <td>
        <b>${BDRMS.esc(BDRMS.fullName(r))}</b>
        <div style="font-size:0.76rem; color:var(--muted);">Username: @${BDRMS.esc(r.username || 'resident')}</div>
      </td>
      <td><b>${BDRMS.esc(r.purok)}</b>, Barangay Wawa</td>
      <td>${BDRMS.esc(r.contact || '—')}</td>
      <td>${BDRMS.residencyText(r.residentSince)}</td>
      <td><span class="badge badge-ready no-dot">✓ Aktibo sa Rehistro</span></td>
    </tr>
  `).join('');
}

/* ---------- System Audit Trail Table ---------- */
function renderLogsTable() {
  const tbody = document.getElementById('logsTableBody');
  if (!tbody) return;

  const logs = [...(BDRMS.data().logs || [])];

  if (logs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 40px 20px; color: var(--muted);">
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
      <tr>
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
