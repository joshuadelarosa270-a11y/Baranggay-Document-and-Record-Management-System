/* ==========================================================================
   BDRMS — Admin & Staff Portal Controller (js/admin.js)
   Barangay Wawa, Abra de Ilog, Occidental Mindoro
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // If user deliberately logged out, redirect to login page
  if (sessionStorage.getItem('bdrms_staff_logout') === 'true') {
    sessionStorage.removeItem('bdrms_staff_logout');
    window.location.href = 'admin-login.html';
    return;
  }

  // Ensure staff session or set default admin session for demo ease
  let user = BDRMS.currentUser();
  if (!user) {
    user = BDRMS.login('admin', 'admin123');
  }

  initAdminUI(user);
});

function initAdminUI(user) {
  updateUserDisplay(user);
  setupNavigation();
  setupRoleSwitcher(user);
  renderDashboard();
  setupEventListeners();

  // Listen to store changes from resident portal (multi-tab sync)
  document.addEventListener('bdrms:sync', () => {
    renderDashboard();
    renderRequestsTable();
    renderResidentsTable();
  });
}

/* ---------- User & Role Management ---------- */
function updateUserDisplay(user) {
  const nameEl = document.getElementById('adminUserName');
  const roleEl = document.getElementById('adminUserRole');
  const avatarEl = document.getElementById('adminUserAvatar');

  if (nameEl) nameEl.innerText = user.name;
  if (roleEl) roleEl.innerText = BDRMS.ROLES[user.role].label;
  if (avatarEl) avatarEl.innerText = user.name.charAt(0);

  // Update active button in role switcher
  document.querySelectorAll('.role-btn').forEach(btn => {
    if (btn.getAttribute('data-role') === user.role) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Render Role Status Banner
  renderRoleBanner(user);

  // Adjust UI visibility according to role permissions
  // Only Secretary can encode walk-ins
  const walkinBtn = document.getElementById('btnOpenWalkin');
  if (walkinBtn) {
    walkinBtn.style.display = BDRMS.can(user, 'walkin') ? 'inline-flex' : 'none';
  }

  // Only Secretary can officially register new residents
  const addResBtn = document.getElementById('btnAddResident');
  if (addResBtn) {
    addResBtn.style.display = BDRMS.can(user, 'register_resident') ? 'inline-flex' : 'none';
  }
}

function renderRoleBanner(user) {
  const container = document.getElementById('adminRoleBannerContainer');
  if (!container) return;

  if (user.role === 'admin') {
    container.innerHTML = `
      <div class="role-banner role-admin">
        <div class="role-banner-content">
          <div class="role-banner-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div class="role-banner-text">
            <h3>Mode: Pagsubaybay at Pag-monitor Lamang (System Admin)</h3>
            <p>Maaari mong subaybayan ang kabuuang transaksyon, ulat, at audit trail ng barangay. <b>Paalala:</b> Ang pag-apruba ng mga dokumento at pagrerehistro ng mga residente ay eksklusibong pinamamahalaan ng <b>Kalihim ng Barangay (Secretary Lorna P. Fernandez)</b>.</p>
          </div>
        </div>
        <div>
          <span class="role-badge-pill admin">🛡️ Tagasubaybay Lamang</span>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="role-banner role-secretary">
        <div class="role-banner-content">
          <div class="role-banner-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:24px;height:24px;">
              <path d="m21 17-2.16-1.44a2 2 0 0 0-2.48.22L15 17l-1.5-1.5L12 17"/><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2-1.67 0-3 2-3 4.5S6 13 7 15c1 2 3 4 3 4"/>
            </svg>
          </div>
          <div class="role-banner-text">
            <h3>Mode: Kalihim ng Barangay (Operations, Approvals & Registry)</h3>
            <p>Maligayang paglilingkod, <b>Sec. Lorna P. Fernandez</b>! Ikaw ang may buong awtoridad sa <b>pag-apruba ng lahat ng kahilingan sa dokumento</b> at <b>pagpapatala/pag-apruba ng mga residente</b> ng Barangay Wawa.</p>
          </div>
        </div>
        <div>
          <span class="role-badge-pill secretary">✍️ May Awtoridad sa Pag-apruba</span>
        </div>
      </div>
    `;
  }
}

function setupRoleSwitcher(currentUser) {
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-role');

      if (role === 'resident') {
        window.location.href = 'resident-login.html';
        return;
      }

      const targetUser = BDRMS.data().users.find(u => u.role === role);
      if (targetUser) {
        BDRMS.login(targetUser.username, targetUser.password);
        BDRMS.toast(`Switched active view to ${targetUser.name} (${BDRMS.ROLES[role].label})`, 'info');
        initAdminUI(targetUser);
      }
    });
  });
}

/* ---------- Navigation & Tab Switching ---------- */
function setupNavigation() {
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  navItems.forEach(item => {
    if (item.dataset.navigationBound === 'true') return;
    item.dataset.navigationBound = 'true';
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Mobile sidebar toggle
  const menuBtn = document.getElementById('adminMenuToggle');
  const sidebar = document.querySelector('.admin-sidebar');
  const adminApp = document.querySelector('.admin-app');
  if (menuBtn && sidebar && adminApp && menuBtn.dataset.sidebarToggleBound !== 'true') {
    menuBtn.dataset.sidebarToggleBound = 'true';
    const updateSidebarButton = () => {
      const isMobile = window.matchMedia('(max-width: 1024px)').matches;
      if (!isMobile) sidebar.classList.remove('open');
      const isExpanded = isMobile ? sidebar.classList.contains('open') : !adminApp.classList.contains('sidebar-collapsed');
      menuBtn.innerHTML = isMobile ? BDRMS.ICONS.menu : (isExpanded ? BDRMS.ICONS.arrowLeft : BDRMS.ICONS.arrowRight);
      menuBtn.setAttribute('aria-label', isExpanded ? 'Hide sidebar' : 'Show sidebar');
      menuBtn.setAttribute('aria-expanded', String(isExpanded));
      menuBtn.title = isExpanded ? 'Hide sidebar' : 'Show sidebar';
    };
    updateSidebarButton();
    window.addEventListener('resize', updateSidebarButton);
    menuBtn.addEventListener('click', () => {
      if (window.matchMedia('(max-width: 1024px)').matches) {
        sidebar.classList.toggle('open');
      } else {
        adminApp.classList.toggle('sidebar-collapsed');
      }
      updateSidebarButton();
    });
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    if (item.getAttribute('data-tab') === tabId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  document.querySelectorAll('.tab-pane').forEach(pane => {
    if (pane.id === tabId) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  const sidebar = document.querySelector('.admin-sidebar');
  if (sidebar && window.innerWidth <= 1024) {
    sidebar.classList.remove('open');
    const menuBtn = document.getElementById('adminMenuToggle');
    menuBtn?.setAttribute('aria-expanded', 'false');
    if (menuBtn) {
      menuBtn.setAttribute('aria-label', 'Show sidebar');
      menuBtn.title = 'Show sidebar';
      menuBtn.innerHTML = BDRMS.ICONS.menu;
    }
  }

  // Refresh tab content
  if (tabId === 'tabRequests') renderRequestsTable();
  if (tabId === 'tabResidents') renderResidentsTable();
  if (tabId === 'tabLogs') renderLogsTable();
}

let currentResidentsSubtab = 'active';

/* ---------- Dashboard Rendering ---------- */
function renderDashboard() {
  const reqs = BDRMS.data().requests;
  const residents = BDRMS.data().residents;

  const countTotal = reqs.length;
  const countVerification = reqs.filter(r => r.status === 'Submitted' || r.status === 'Under Verification').length;
  const countApproval = reqs.filter(r => r.status === 'For Approval').length;
  const countReady = reqs.filter(r => r.status === 'Ready for Pickup').length;
  const countReleased = reqs.filter(r => r.status === 'Released').length;

  const activeResidents = residents.filter(r => r.status === 'active' || (r.verified && r.status !== 'pending_approval'));
  const pendingResidents = residents.filter(r => r.status === 'pending_approval' || !r.verified);

  document.getElementById('statTotal').innerText = countTotal;
  document.getElementById('statVerification').innerText = countVerification;
  document.getElementById('statApproval').innerText = countApproval;
  document.getElementById('statReady').innerText = countReady;
  document.getElementById('statResidents').innerText = activeResidents.length;

  const countActiveEl = document.getElementById('countActiveResidents');
  const countPendingEl = document.getElementById('countPendingResidents');
  if (countActiveEl) countActiveEl.innerText = activeResidents.length;
  if (countPendingEl) countPendingEl.innerText = pendingResidents.length;

  // Sidebar badge
  const pendingBadge = document.getElementById('badgePendingCount');
  if (pendingBadge) pendingBadge.innerText = countVerification + countApproval;

  renderRequestsTable();
}

/* ---------- Requests Table & Filters ---------- */
let currentFilter = {
  search: '',
  docType: 'all',
  status: 'all',
  channel: 'all',
};

function setupEventListeners() {
  // Search input
  const searchInput = document.getElementById('tableSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentFilter.search = e.target.value.trim().toLowerCase();
      renderRequestsTable();
    });
  }

  // Filter selects
  document.getElementById('filterDocType')?.addEventListener('change', (e) => {
    currentFilter.docType = e.target.value;
    renderRequestsTable();
  });
  document.getElementById('filterStatus')?.addEventListener('change', (e) => {
    currentFilter.status = e.target.value;
    renderRequestsTable();
  });
  document.getElementById('filterChannel')?.addEventListener('change', (e) => {
    currentFilter.channel = e.target.value;
    renderRequestsTable();
  });

  // Stat card clicks filter requests table
  document.querySelectorAll('.stat-card[data-filter-status]').forEach(card => {
    card.addEventListener('click', () => {
      const status = card.getAttribute('data-filter-status');
      currentFilter.status = status;
      const statusSelect = document.getElementById('filterStatus');
      if (statusSelect) statusSelect.value = status;
      switchTab('tabRequests');
      renderRequestsTable();
    });
  });

  // Sub-tabs for residents registry
  document.getElementById('subtabActiveResidents')?.addEventListener('click', () => {
    currentResidentsSubtab = 'active';
    updateResidentsSubtabsUI();
    renderResidentsTable();
  });

  document.getElementById('subtabPendingResidents')?.addEventListener('click', () => {
    currentResidentsSubtab = 'pending';
    updateResidentsSubtabsUI();
    renderResidentsTable();
  });

  // Walk-in modal button (Secretary only)
  document.getElementById('btnOpenWalkin')?.addEventListener('click', () => {
    const user = BDRMS.currentUser();
    if (!BDRMS.can(user, 'walkin')) {
      BDRMS.toast('Ang pag-encode ng walk-in request ay para lamang kay Secretary.', 'error');
      return;
    }
    openWalkinModal();
  });

  // Add resident modal button (Secretary only)
  document.getElementById('btnAddResident')?.addEventListener('click', () => {
    const user = BDRMS.currentUser();
    if (!BDRMS.can(user, 'register_resident')) {
      BDRMS.toast('Ang pagrehistro ng bagong residente ay eksklusibong isinasagawa ni Secretary Lorna Fernandez.', 'error');
      return;
    }
    openAddResidentModal();
  });

  // Export CSV for DILG / LGU
  document.getElementById('btnExportCSV')?.addEventListener('click', () => {
    BDRMS.exportRequestsCSV();
    BDRMS.toast('Exported official document requests to CSV.');
  });

  // Admin Logout button
  document.getElementById('btnAdminLogout')?.addEventListener('click', async () => {
    const ok = await BDRMS.confirmDialog(
      'Sign Out of Staff Portal',
      'Are you sure you want to end your administrative session?',
      'Sign Out',
      false
    );
    if (ok) {
      sessionStorage.setItem('bdrms_staff_logout', 'true');
      BDRMS.logout();
      BDRMS.toast('Signed out of staff portal.');
      setTimeout(() => {
        window.location.href = 'admin-login.html';
      }, 400);
    }
  });

  // Reset demo data button
  document.getElementById('btnResetData')?.addEventListener('click', async () => {
    const ok = await BDRMS.confirmDialog(
      'Reset Demo Database',
      'This will restore all default Barangay Wawa residents, sample requests, and logs. Do you want to proceed?',
      'Reset Data',
      true
    );
    if (ok) {
      BDRMS.reset();
      BDRMS.toast('Demo database restored to default state.');
      renderDashboard();
      renderResidentsTable();
      renderLogsTable();
    }
  });
}

function renderRequestsTable() {
  const tbody = document.getElementById('requestsTableBody');
  if (!tbody) return;

  let list = [...BDRMS.data().requests];

  // Filters
  if (currentFilter.search) {
    const q = currentFilter.search;
    list = list.filter(r =>
      r.ref.toLowerCase().includes(q) ||
      BDRMS.fullName(r.applicant).toLowerCase().includes(q) ||
      r.applicant.purok.toLowerCase().includes(q) ||
      r.purpose.toLowerCase().includes(q)
    );
  }
  if (currentFilter.docType !== 'all') {
    list = list.filter(r => r.docType === currentFilter.docType);
  }
  if (currentFilter.status !== 'all') {
    if (currentFilter.status === 'Under Verification') {
      list = list.filter(r => r.status === 'Submitted' || r.status === 'Under Verification');
    } else {
      list = list.filter(r => r.status === currentFilter.status);
    }
  }
  if (currentFilter.channel !== 'all') {
    list = list.filter(r => r.channel === currentFilter.channel);
  }

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            ${BDRMS.ICONS.inbox}
            <h4>No Document Requests Found</h4>
            <p>Try adjusting your search query or filter selection.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const user = BDRMS.currentUser();

  tbody.innerHTML = list.map(req => {
    const doc = BDRMS.DOC_TYPES[req.docType];
    const months = BDRMS.monthsBetween(req.applicant.residentSince);
    const isResidencyOk = months >= BDRMS.RESIDENCY_MONTHS;
    const resBadge = isResidencyOk
      ? `<span class="badge badge-released no-dot" style="font-size:0.7rem;" title="Residency: ${BDRMS.residencyText(req.applicant.residentSince)}">≥ 6 mos</span>`
      : `<span class="badge badge-verification no-dot" style="font-size:0.7rem;" title="Residency: ${BDRMS.residencyText(req.applicant.residentSince)}">&lt; 6 mos</span>`;

    return `
      <tr>
        <td>
          <b class="mono" style="color:var(--primary); font-size:0.86rem;">${req.ref}</b>
          <div style="font-size:0.72rem; color:var(--muted);">${BDRMS.timeAgo(req.createdAt)}</div>
        </td>
        <td>
          <div class="table-applicant">
            <div class="applicant-avatar">${req.applicant.firstName.charAt(0)}</div>
            <div class="applicant-meta">
              <strong>${BDRMS.esc(BDRMS.fullName(req.applicant))}</strong>
              <span>${BDRMS.esc(req.applicant.purok)} • ${resBadge}</span>
            </div>
          </div>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:8px;">
            ${BDRMS.docIcon(req.docType, 'sm')}
            <div>
              <strong style="display:block; font-size:0.88rem;">${BDRMS.esc(doc.short)}</strong>
              <span style="font-size:0.75rem; color:var(--muted);">${BDRMS.esc(req.purpose)}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="channel-tag ${req.channel === 'Walk-in' ? 'walkin' : ''}">
            ${req.channel === 'Walk-in' ? BDRMS.ICONS.walkin : BDRMS.ICONS.globe}
            ${req.channel}
          </span>
        </td>
        <td>${BDRMS.statusBadge(req.status)}</td>
        <td style="font-size:0.78rem; color:var(--muted);">${BDRMS.fmtDate(req.createdAt)}</td>
        <td>
          <div class="table-actions">
            <button class="btn ${user && user.role === 'secretary' ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="openRequestDetail('${req.id}')" title="${user && user.role === 'secretary' ? 'Suriin at Aprubahan ang Request' : 'Tingnan ang Detalye ng Request (Pag-monitor)'}">
              ${user && user.role === 'secretary' ? BDRMS.ICONS.signature : BDRMS.ICONS.eye}
              ${user && user.role === 'secretary' ? 'Suriin / Aprubahan' : 'Tingnan (Review)'}
            </button>
            ${(req.status === 'Ready for Pickup' || req.status === 'Released') ? `
              <button class="icon-btn" onclick="printRequestDirect('${req.id}')" title="I-print ang Opisyal na Sertipiko">
                ${BDRMS.ICONS.printer}
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

/* ---------- Request Detail Drawer / Modal ---------- */
let isDataMasked = true;

window.openRequestDetail = function(reqId) {
  const req = BDRMS.data().requests.find(r => r.id === reqId);
  if (!req) return;

  const user = BDRMS.currentUser();
  const doc = BDRMS.DOC_TYPES[req.docType];
  const a = req.applicant;
  const months = BDRMS.monthsBetween(a.residentSince);
  const isResidencyOk = months >= BDRMS.RESIDENCY_MONTHS;

  isDataMasked = true; // reset masking on modal open

  const modalInstance = BDRMS.modal({
    title: `Document Request: ${req.ref}`,
    subtitle: `${doc.name} — ${req.channel} Submission`,
    wide: true,
    body: `
      <div class="detail-grid" id="detailGrid">
        <!-- Left: Applicant Details & Verification -->
        <div style="display:grid; gap: 18px;">
          <div class="detail-section">
            <h4>
              <span>Applicant Personal Information</span>
              <button class="btn btn-ghost btn-sm" id="btnToggleMask" style="font-size:0.76rem;">
                ${BDRMS.ICONS.eye} <span id="maskLabel">Reveal Contact</span>
              </button>
            </h4>
            <div class="kv-list">
              <div class="kv-row"><dt>Full Name</dt><dd><b>${BDRMS.esc(BDRMS.fullName(a))}</b></dd></div>
              <div class="kv-row"><dt>Age / Sex</dt><dd>${BDRMS.ageOf(a.birthdate)} yrs old • ${BDRMS.esc(a.sex)} (${BDRMS.esc(a.civilStatus)})</dd></div>
              <div class="kv-row"><dt>Address</dt><dd>${BDRMS.esc(a.purok)}, Barangay Wawa</dd></div>
              <div class="kv-row"><dt>Contact Number</dt><dd id="valContact">${BDRMS.maskPhone(a.contact)}</dd></div>
              <div class="kv-row"><dt>ID Presented</dt><dd>${BDRMS.esc(req.idType)} (Last 4: ••••${BDRMS.esc(req.idLast4)})</dd></div>
              <div class="kv-row"><dt>Residency Duration</dt>
                <dd>
                  <b>${BDRMS.residencyText(a.residentSince)}</b>
                  ${isResidencyOk
                    ? `<span class="badge badge-released no-dot" style="margin-left:6px;">≥ 6 months</span>`
                    : `<span class="badge badge-verification no-dot" style="margin-left:6px;">Under 6 months</span>`}
                </dd>
              </div>
            </div>
          </div>

          <!-- Document Specific Details -->
          <div class="detail-section">
            <h4>Document Specifics</h4>
            <div class="kv-list">
              <div class="kv-row"><dt>Document Type</dt><dd><b>${BDRMS.esc(doc.name)}</b></dd></div>
              <div class="kv-row"><dt>Stated Purpose</dt><dd>${BDRMS.esc(req.purpose)}</dd></div>
              ${renderExtraFieldsDetail(req)}
              <div class="kv-row"><dt>Official Barangay Fee</dt><dd><b>${doc.fee}</b></dd></div>
              <div class="kv-row">
                <dt>Payment / O.R. Status</dt>
                <dd>
                  <span class="badge ${req.paymentStatus === 'Paid' ? 'badge-released' : (req.paymentStatus === 'Exempt' ? 'badge-submitted' : 'badge-verification')}">
                    ${req.paymentStatus || 'Unpaid'}
                  </span>
                  ${req.orNumber ? `<span class="mono" style="font-size:0.75rem; margin-left:6px;">(${BDRMS.esc(req.orNumber)})</span>` : ''}
                </dd>
              </div>
              <div class="kv-row"><dt>Submission Channel</dt><dd>${req.channel}</dd></div>
            </div>
          </div>

          <!-- Official Requirements Checklist -->
          <div class="detail-section">
            <h4>Barangay Verification Checklist</h4>
            <div class="verification-checklist">
              <div class="check-item">
                <span>1. Verified Valid ID (${BDRMS.esc(req.idType)})</span>
                <span class="badge ${req.verification.identity ? 'badge-released' : 'badge-verification'}">
                  ${req.verification.identity ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
              <div class="check-item">
                <span>2. 6-Month Barangay Residency Rule</span>
                <span class="badge ${isResidencyOk ? 'badge-released' : 'badge-rejected'}">
                  ${isResidencyOk ? 'Eligible (≥6 mos)' : 'Under 6 mos'}
                </span>
              </div>
              <div class="check-item">
                <span>3. Barangay Blotter & Lupon Conciliation Check</span>
                <span class="badge ${req.verification.blotterCleared !== false ? 'badge-released' : 'badge-rejected'}">
                  ${req.verification.blotterCleared !== false ? 'Clean (No Derogatory Record)' : 'Active Case on File'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Status Workflow & Audit History -->
        <div style="display:grid; gap: 18px;">
          <div class="detail-section">
            <h4>Current Workflow Status</h4>
            <div style="margin-bottom: 14px;">
              ${BDRMS.statusBadge(req.status)}
              <p style="font-size:0.8rem; color:var(--muted); margin-top:6px;">
                ${BDRMS.STATUSES[req.status]?.desc || ''}
              </p>
            </div>

            <!-- Role-based Action Buttons -->
            <div style="display:grid; gap: 8px; margin-top: 14px;">
              ${renderWorkflowActions(req, user)}
            </div>
          </div>

          <!-- Audit Timeline -->
          <div class="detail-section">
            <h4>Audit History & Milestones</h4>
            <div class="timeline" style="margin-top:10px;">
              ${req.history.map(h => `
                <div class="tl-item done" style="padding-bottom:16px;">
                  <div class="tl-dot" style="width:32px; height:32px;">${BDRMS.ICONS.check}</div>
                  <div class="tl-body">
                    <strong style="font-size:0.88rem;">${h.status}</strong>
                    <span style="font-size:0.75rem;">${BDRMS.fmtDateTime(h.at)} • by ${h.by}</span>
                    ${h.note ? `<p style="font-size:0.78rem;">${BDRMS.esc(h.note)}</p>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `,
    foot: `
      <div class="action-bar-footer">
        <div>
          <button class="btn btn-ghost btn-sm" onclick="printRequestDirect('${req.id}')">
            ${BDRMS.ICONS.printer} Preview Official Document
          </button>
        </div>
        <button class="btn btn-ghost" data-close>Close</button>
      </div>
    `,
    onMount: (modalEl, closeFn) => {
      // Toggle Privacy Masking
      const maskBtn = modalEl.querySelector('#btnToggleMask');
      const contactVal = modalEl.querySelector('#valContact');
      const maskLabel = modalEl.querySelector('#maskLabel');

      if (maskBtn) {
        maskBtn.addEventListener('click', () => {
          isDataMasked = !isDataMasked;
          if (isDataMasked) {
            contactVal.innerText = BDRMS.maskPhone(a.contact);
            maskLabel.innerText = 'Reveal Contact';
            maskBtn.querySelector('svg').outerHTML = BDRMS.ICONS.eye;
          } else {
            contactVal.innerText = a.contact;
            maskLabel.innerText = 'Mask Contact';
            maskBtn.querySelector('svg').outerHTML = BDRMS.ICONS.eyeOff;
            BDRMS.log(user, `Viewed unmasked contact for ${req.ref}`);
          }
        });
      }

      // Action Handlers
      modalEl.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const action = btn.getAttribute('data-action');
          await handleWorkflowAction(req, action, closeFn);
        });
      });
    },
  });
};

function renderExtraFieldsDetail(req) {
  const doc = BDRMS.DOC_TYPES[req.docType];
  const x = req.extra || {};
  if (!doc.extra || doc.extra.length === 0) return '';

  return doc.extra.map(f => `
    <div class="kv-row">
      <dt>${BDRMS.esc(f.label)}</dt>
      <dd><b>${BDRMS.esc(x[f.key] || '—')}</b></dd>
    </div>
  `).join('');
}

function renderWorkflowActions(req, user) {
  const role = user.role;
  const status = req.status;
  const btns = [];

  // Admin Role: Monitoring / Read-Only View Only
  if (role === 'admin') {
    return `
      <div class="read-only-banner" style="margin:0; line-height:1.5;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:22px;height:22px;flex-shrink:0;">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
        </svg>
        <div>
          <b style="display:block; margin-bottom:2px;">Executive Monitoring View:</b>
          Naka-login ka bilang <b>System Administrator</b> (Pagsubaybay Lamang). Ang pag-verify, pag-apruba, at pag-release ng dokumentong ito ay <b>eksklusibong isinasagawa ng Kalihim ng Barangay (Sec. Lorna P. Fernandez)</b>.
        </div>
      </div>
    `;
  }

  // Secretary Role: Full Authority to Verify, Approve, Release, and Reject
  if (role === 'secretary') {
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

    // Reject / Return Option (Available to Secretary if not yet Released/Rejected)
    if (status !== 'Released' && status !== 'Rejected') {
      btns.push(`<button class="btn btn-danger btn-block btn-sm" data-action="reject" style="margin-top:8px;">${BDRMS.ICONS.x} Tanggihan / Ibalik ang Kahilingan</button>`);
    }
  }

  if (btns.length === 0) {
    return `<div style="font-size:0.82rem; color:var(--muted); text-align:center; padding:10px;">Nakumpleto na ang dokumento at minarkahang ${status}.</div>`;
  }

  return btns.join('');
}

async function handleWorkflowAction(req, action, closeModal) {
  const user = BDRMS.currentUser();
  const now = new Date().toISOString();
  const doc = BDRMS.DOC_TYPES[req.docType];

  if (action === 'verify_and_forward') {
    req.status = 'For Approval';
    req.verification.identity = true;
    req.verification.residency = true;
    req.history.push({ status: 'Under Verification', by: user.short, at: now, note: 'Identity & residency verified against barangay database.' });
    req.history.push({ status: 'For Approval', by: user.short, at: new Date(Date.now() + 1000).toISOString(), note: 'Forwarded to authorized staff for final review and approval.' });
    BDRMS.log(user, `Verified and forwarded ${req.ref} for approval`);
    BDRMS.toast(`Verified! ${req.ref} forwarded for final approval.`);
  } else if (action === 'verify') {
    req.status = 'Under Verification';
    req.verification.identity = true;
    req.verification.residency = true;
    req.history.push({ status: 'Under Verification', by: user.short, at: now, note: 'Checking proof of dwelling or additional requirements.' });
    BDRMS.log(user, `Marked request ${req.ref} under verification`);
    BDRMS.toast(`Request ${req.ref} moved to Under Verification.`);
  } else if (action === 'forward') {
    req.status = 'For Approval';
    req.history.push({ status: 'For Approval', by: user.short, at: now, note: 'Endorsed for final staff review and approval.' });
    BDRMS.log(user, `Forwarded ${req.ref} for approval`);
    BDRMS.toast(`Request ${req.ref} forwarded for final approval.`);
  } else if (action === 'approve') {
    req.status = 'Ready for Pickup';
    req.history.push({ status: 'Ready for Pickup', by: user.short, at: now, note: 'Approved and finalized by authorized barangay staff.' });
    BDRMS.log(user, `Approved request ${req.ref}`);
    BDRMS.toast(`Approved! SMS pickup notice dispatched to ${BDRMS.maskPhone(req.applicant.contact)}.`);
  } else if (action === 'release') {
    const isFeeFree = doc.fee.includes('Free');
    let or = req.orNumber;

    if (!isFeeFree && (!or || or === 'EXEMPT')) {
      const defaultOR = `OR-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
      const enteredOR = prompt(`Confirm payment of ${doc.fee} and enter Official Receipt (O.R.) Number:`, defaultOR);
      if (!enteredOR) return; // user cancelled
      or = enteredOR.trim();
      req.paymentStatus = 'Paid';
    } else if (isFeeFree) {
      or = 'EXEMPT-RA11261';
      req.paymentStatus = 'Exempt';
    }

    req.status = 'Released';
    req.orNumber = or;
    req.history.push({ status: 'Released', by: user.short, at: now, note: `Document claimed and handed over to resident. Receipt: ${or} (${req.paymentStatus})` });
    BDRMS.log(user, `Released document for ${req.ref} with O.R. ${or}`);
    BDRMS.toast(`Document ${req.ref} successfully released to applicant.`);
  } else if (action === 'reject') {
    const reason = prompt('Please enter the reason/remarks for returning or rejecting this request:');
    if (!reason) return;
    req.status = 'Rejected';
    req.remarks = reason;
    req.history.push({ status: 'Rejected', by: user.short, at: now, note: `Returned / Rejected: ${reason}` });
    BDRMS.log(user, `Rejected ${req.ref}: ${reason}`);
    BDRMS.toast(`Request ${req.ref} marked as Rejected.`);
  }

  req.updatedAt = now;
  BDRMS.save();
  closeModal();
  renderDashboard();
  renderRequestsTable();
}

window.printRequestDirect = function(reqId) {
  const req = BDRMS.data().requests.find(r => r.id === reqId);
  if (!req) return;

  const user = BDRMS.currentUser();
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

/* ---------- Walk-In Encoding Modal (Hybrid Support) ---------- */
function openWalkinModal() {
  const user = BDRMS.currentUser();

  BDRMS.modal({
    title: 'Encode Walk-In Document Request',
    subtitle: 'Assisting residents visiting the Barangay Hall who lack internet access',
    wide: true,
    body: `
      <form id="formWalkin" class="form-grid">
        <div class="field span-2">
          <label>Document Type <span class="req">*</span></label>
          <select id="wDocType" class="select" required>
            ${Object.entries(BDRMS.DOC_TYPES).map(([k, d]) => `<option value="${k}">${d.name} (${d.fee})</option>`).join('')}
          </select>
        </div>

        <div class="field">
          <label>First Name <span class="req">*</span></label>
          <input type="text" id="wFirstName" class="input" placeholder="e.g. Juan" required>
        </div>
        <div class="field">
          <label>Last Name <span class="req">*</span></label>
          <input type="text" id="wLastName" class="input" placeholder="e.g. Dela Cruz" required>
        </div>

        <div class="field">
          <label>Middle Name</label>
          <input type="text" id="wMiddleName" class="input" placeholder="e.g. Santos">
        </div>
        <div class="field">
          <label>Suffix</label>
          <input type="text" id="wSuffix" class="input" placeholder="Jr., Sr., III (optional)">
        </div>

        <div class="field">
          <label>Date of Birth <span class="req">*</span></label>
          <input type="date" id="wBirthdate" class="input" required>
        </div>
        <div class="field">
          <label>Sex <span class="req">*</span></label>
          <select id="wSex" class="select">
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>

        <div class="field">
          <label>Purok in Brgy. Wawa <span class="req">*</span></label>
          <select id="wPurok" class="select">
            ${BDRMS.PUROKS.map(p => `<option value="${p}">${p}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Resident Since (Date or Estimate) <span class="req">*</span></label>
          <input type="date" id="wResidentSince" class="input" required>
        </div>

        <div class="field">
          <label>Contact Number</label>
          <input type="tel" id="wContact" class="input" placeholder="09XX XXX XXXX">
        </div>
        <div class="field">
          <label>Presented Valid ID <span class="req">*</span></label>
          <select id="wIdType" class="select">
            ${BDRMS.ID_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>

        <div class="field">
          <label>ID Number (or Last 4 Digits) <span class="req">*</span></label>
          <input type="text" id="wIdNumber" class="input" placeholder="e.g. 1234" required>
        </div>
        <div class="field">
          <label>Purpose of Request <span class="req">*</span></label>
          <input type="text" id="wPurpose" class="input" placeholder="e.g. Medical Assistance / Employment" required>
        </div>

        <div class="field span-2">
          <label>Walk-In Processing Option <span class="req">*</span></label>
          <select id="wFlowSpeed" class="select">
            <option value="For Approval">Fast-Track: Verified at Counter &rarr; Endorse to Captain for Approval</option>
            <option value="Submitted">Standard Queue: Place in verification queue (Submitted)</option>
            <option value="Ready for Pickup">Urgent / Express: Captain Present &rarr; Ready for Pickup / Release</option>
          </select>
          <span class="hint">Since the applicant is physically present at the Barangay Hall, choosing Fast-Track avoids redundant queue delays.</span>
        </div>
      </form>
    `,
    foot: `
      <button class="btn btn-ghost" data-close>Cancel</button>
      <button class="btn btn-primary" id="btnSaveWalkin">${BDRMS.ICONS.check} Encode Request & Process</button>
    `,
    onMount: (modalEl, closeFn) => {
      // Set default residentSince to 2 years ago
      const def = new Date();
      def.setFullYear(def.getFullYear() - 2);
      modalEl.querySelector('#wResidentSince').value = def.toISOString().slice(0, 10);

      modalEl.querySelector('#btnSaveWalkin').addEventListener('click', () => {
        const form = modalEl.querySelector('#formWalkin');
        if (!form.checkValidity()) {
          BDRMS.toast('Please fill in all required walk-in fields.', 'error');
          return;
        }

        const applicant = {
          firstName: modalEl.querySelector('#wFirstName').value.trim(),
          middleName: modalEl.querySelector('#wMiddleName').value.trim(),
          lastName: modalEl.querySelector('#wLastName').value.trim(),
          suffix: modalEl.querySelector('#wSuffix').value.trim(),
          birthdate: modalEl.querySelector('#wBirthdate').value,
          sex: modalEl.querySelector('#wSex').value,
          civilStatus: 'Single',
          purok: modalEl.querySelector('#wPurok').value,
          contact: modalEl.querySelector('#wContact').value.trim(),
          email: '',
          residentSince: modalEl.querySelector('#wResidentSince').value,
        };

        const docType = modalEl.querySelector('#wDocType').value;
        const purpose = modalEl.querySelector('#wPurpose').value.trim();
        const idType = modalEl.querySelector('#wIdType').value;
        const idNumber = modalEl.querySelector('#wIdNumber').value.trim();
        const flowSpeed = modalEl.querySelector('#wFlowSpeed').value;
        const now = new Date().toISOString();

        let history = [{ status: 'Submitted', by: user.short, at: now, note: 'Encoded in-person at the Barangay Hall counter (walk-in).' }];
        let verification = { identity: false, residency: false, blotterCleared: true };

        if (flowSpeed === 'For Approval' || flowSpeed === 'Ready for Pickup') {
          verification = { identity: true, residency: true, blotterCleared: true };
          history.push({ status: 'Under Verification', by: user.short, at: now, note: 'Identity, ID, and 6-month residency verified at the window.' });
          history.push({ status: 'For Approval', by: user.short, at: now, note: 'Forwarded to authorized barangay staff for final approval.' });
        }
        if (flowSpeed === 'Ready for Pickup') {
          history.push({ status: 'Ready for Pickup', by: user.short, at: now, note: 'Approved on-the-spot for counter release.' });
        }

        const req = BDRMS.createRequest({
          applicant,
          docType,
          purpose,
          extra: {},
          idType,
          idNumber,
          channel: 'Walk-in',
          by: user.short,
          status: flowSpeed,
          history,
          verification,
        });

        BDRMS.log(user, `Encoded walk-in request ${req.ref} for ${BDRMS.fullName(applicant)} (${flowSpeed})`);
        BDRMS.toast(`Walk-in request ${req.ref} encoded successfully!`);

        closeFn();
        renderDashboard();
        renderRequestsTable();

        // Prompt to print or view
        openRequestDetail(req.id);
      });
    },
  });
}

function updateResidentsSubtabsUI() {
  const btnActive = document.getElementById('subtabActiveResidents');
  const btnPending = document.getElementById('subtabPendingResidents');
  if (btnActive && btnPending) {
    if (currentResidentsSubtab === 'active') {
      btnActive.classList.add('active');
      btnPending.classList.remove('active');
    } else {
      btnActive.classList.remove('active');
      btnPending.classList.add('active');
    }
  }
}

/* ---------- Residents Registry Tab ---------- */
function renderResidentsTable() {
  const tbody = document.getElementById('residentsTableBody');
  const thead = document.getElementById('residentsTableHead');
  if (!tbody || !thead) return;

  const residents = BDRMS.data().residents;
  const user = BDRMS.currentUser();
  const isSecretary = user && user.role === 'secretary';

  const activeResidents = residents.filter(r => r.status === 'active' || (r.verified && r.status !== 'pending_approval'));
  const pendingResidents = residents.filter(r => r.status === 'pending_approval' || !r.verified);

  const countActiveEl = document.getElementById('countActiveResidents');
  const countPendingEl = document.getElementById('countPendingResidents');
  if (countActiveEl) countActiveEl.innerText = activeResidents.length;
  if (countPendingEl) countPendingEl.innerText = pendingResidents.length;

  updateResidentsSubtabsUI();

  if (currentResidentsSubtab === 'active') {
    // Header for active verified residents
    thead.innerHTML = `
      <tr>
        <th>Resident ID</th>
        <th>Buong Pangalan</th>
        <th>Purok sa Wawa</th>
        <th>Numero ng Telepono</th>
        <th>Tagal ng Paninirahan</th>
        <th>Katayuan sa Rehistro</th>
      </tr>
    `;

    if (activeResidents.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              ${BDRMS.ICONS.users}
              <h4>Walang Aktibong Residente</h4>
              <p>Magrehistro ng residente gamit ang button sa itaas.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = activeResidents.map((r, i) => {
      const age = BDRMS.ageOf(r.birthdate);
      const months = BDRMS.monthsBetween(r.residentSince);
      const isOk = months >= BDRMS.RESIDENCY_MONTHS;

      return `
        <tr>
          <td><b class="mono" style="color:var(--primary); font-size:0.86rem;">RES-${String(i + 1).padStart(4, '0')}</b></td>
          <td>
            <div class="table-applicant">
              <div class="applicant-avatar">${r.firstName.charAt(0)}</div>
              <div class="applicant-meta">
                <strong>${BDRMS.esc(BDRMS.fullName(r))}</strong>
                <span>${age} taong gulang • ${r.sex} (${BDRMS.esc(r.civilStatus || 'Single')})</span>
              </div>
            </div>
          </td>
          <td><b>${BDRMS.esc(r.purok)}</b>, Brgy. Wawa</td>
          <td>${BDRMS.maskPhone(r.contact)}</td>
          <td>
            <b>${BDRMS.residencyText(r.residentSince)}</b>
            ${isOk ? '<span class="badge badge-released no-dot" style="margin-left:6px; font-size:0.7rem;">≥ 6 mos</span>' : '<span class="badge badge-verification no-dot" style="margin-left:6px; font-size:0.7rem;">&lt; 6 mos</span>'}
          </td>
          <td>
            <span class="badge badge-released" title="Opisyal na nairehistro sa Barangay Wawa">
              ${BDRMS.ICONS.badgeCheck} Rehistrado ni Secretary
            </span>
          </td>
        </tr>
      `;
    }).join('');

  } else {
    // Header for pending registrations awaiting Secretary approval
    thead.innerHTML = `
      <tr>
        <th>Petsa ng Aplikasyon</th>
        <th>Aplikanteng Residente</th>
        <th>Purok sa Wawa</th>
        <th>Numero ng Telepono</th>
        <th>Tagal ng Paninirahan</th>
        <th>Katayuan</th>
        <th style="text-align: right;">Aksyon ng Kalihim</th>
      </tr>
    `;

    if (pendingResidents.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              ${BDRMS.ICONS.badgeCheck}
              <h4>Walang Naghihintay na Pag-apruba</h4>
              <p>Lahat ng mga nag-apply na residente ay na-verify at naaprubahan na ni Secretary Lorna Fernandez.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = pendingResidents.map((r) => {
      const age = BDRMS.ageOf(r.birthdate);
      const months = BDRMS.monthsBetween(r.residentSince);
      const isOk = months >= BDRMS.RESIDENCY_MONTHS;

      return `
        <tr style="background: rgba(254, 243, 199, 0.2);">
          <td>
            <b class="mono" style="font-size:0.82rem; color:var(--text);">${BDRMS.fmtDate(r.createdAt)}</b>
            <div style="font-size:0.72rem; color:var(--muted);">${BDRMS.timeAgo(r.createdAt)}</div>
          </td>
          <td>
            <div class="table-applicant">
              <div class="applicant-avatar" style="background:var(--gold);">${r.firstName.charAt(0)}</div>
              <div class="applicant-meta">
                <strong>${BDRMS.esc(BDRMS.fullName(r))}</strong>
                <span>${age} taong gulang • ${r.sex} • User: <b class="mono">${BDRMS.esc(r.username)}</b></span>
              </div>
            </div>
          </td>
          <td>
            <b style="color:var(--primary);">${BDRMS.esc(r.purok)}</b>, Brgy. Wawa
          </td>
          <td>${BDRMS.maskPhone(r.contact)}</td>
          <td>
            <b>${BDRMS.residencyText(r.residentSince)}</b>
            ${isOk ? '<span class="badge badge-released no-dot" style="margin-left:6px; font-size:0.7rem;">≥ 6 mos</span>' : '<span class="badge badge-verification no-dot" style="margin-left:6px; font-size:0.7rem;">&lt; 6 mos</span>'}
          </td>
          <td>
            <span class="badge badge-verification">
              ⏳ Naghihintay ng Apruba ni Secretary
            </span>
          </td>
          <td style="text-align: right;">
            ${isSecretary ? `
              <div class="table-actions" style="justify-content: flex-end;">
                <button class="btn btn-primary btn-sm" onclick="approveResidentAction('${r.id}')" title="Aprubahan at I-rehistro ang Residenteng Ito">
                  ${BDRMS.ICONS.badgeCheck} Aprubahan at I-rehistro
                </button>
                <button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="rejectResidentAction('${r.id}')" title="Tanggihan ang Aplikasyon">
                  ${BDRMS.ICONS.x} Tanggihan
                </button>
              </div>
            ` : `
              <span style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">
                Eksklusibo kay Secretary
              </span>
            `}
          </td>
        </tr>
      `;
    }).join('');
  }
}

// Global actions for Secretary approval/rejection
window.approveResidentAction = async function(resId) {
  const user = BDRMS.currentUser();
  if (!user || user.role !== 'secretary') {
    BDRMS.toast('Tanging si Secretary Lorna Fernandez lamang ang may awtoridad mag-apruba ng residente.', 'error');
    return;
  }
  const res = BDRMS.data().residents.find(x => x.id === resId);
  if (!res) return;

  const ok = await BDRMS.confirmDialog(
    'Aprubahan ang Residente ng Barangay Wawa',
    `Nais mo bang opisyal na aprubahan si <b>${BDRMS.esc(BDRMS.fullName(res))}</b> bilang lehitimong residente ng <b>${BDRMS.esc(res.purok)}, Barangay Wawa</b>?<br><br><b>Epekto:</b> Agad nang mabubuksan at magiging aktibo ang kanyang login account sa Resident Portal gamit ang kanyang username o mobile number.`,
    'Aprubahan at I-rehistro',
    false
  );

  if (ok) {
    BDRMS.approveResidentBySecretary(resId, user);
    BDRMS.toast(`Matagumpay na naaprubahan si ${BDRMS.fullName(res)}! Aktibo na ang kanyang login access sa Resident Portal.`, 'success');
    renderDashboard();
    renderResidentsTable();
  }
};

window.rejectResidentAction = async function(resId) {
  const user = BDRMS.currentUser();
  if (!user || user.role !== 'secretary') {
    BDRMS.toast('Tanging si Secretary Lorna Fernandez lamang ang may awtoridad tumanggi sa rehistrasyon.', 'error');
    return;
  }
  const res = BDRMS.data().residents.find(x => x.id === resId);
  if (!res) return;

  const reason = prompt(`Pakilagay ang dahilan sa pagtanggi sa rehistrasyon ni ${BDRMS.fullName(res)}:`, 'Hindi natukoy na naninirahan sa nasasakupan ng Barangay Wawa');
  if (!reason) return;

  BDRMS.rejectResidentBySecretary(resId, reason, user);
  BDRMS.toast(`Tinanggihan ang aplikasyon sa rehistrasyon ni ${BDRMS.fullName(res)}.`, 'info');
  renderDashboard();
  renderResidentsTable();
};

function openAddResidentModal() {
  const user = BDRMS.currentUser();
  if (!user || user.role !== 'secretary') {
    BDRMS.toast('Ang pagrehistro ng bagong residente ay eksklusibong isinasagawa ni Secretary Lorna Fernandez.', 'error');
    return;
  }

  BDRMS.modal({
    title: 'Opisyal na Pagpaparehistro ng Residente',
    subtitle: 'Tanggapan ng Kalihim • Barangay Wawa, Abra de Ilog, Occidental Mindoro',
    wide: true,
    body: `
      <form id="formAddRes" class="form-grid">
        <div style="grid-column: span 2; background:#f0fdf4; border:1px solid #bbf7d0; padding:12px 14px; border-radius:10px; font-size:0.84rem; color:#166534;">
          📌 <b>Pangangasiwa ng Kalihim:</b> Ang pagpapatala na ito ay agad na magiging <b>Aktibo at Rehistrado</b> sa opisyal na census ng Barangay Wawa. Magagamit agad ng residente ang kanyang mga detalye upang mag-login.
        </div>

        <div class="field">
          <label>Unang Pangalan <span class="req">*</span></label>
          <input type="text" id="arFirst" class="input" placeholder="hal. Juan" required>
        </div>
        <div class="field">
          <label>Apelyido <span class="req">*</span></label>
          <input type="text" id="arLast" class="input" placeholder="hal. Dela Cruz" required>
        </div>

        <div class="field">
          <label>Gitnang Pangalan</label>
          <input type="text" id="arMiddle" class="input" placeholder="hal. Ramos">
        </div>
        <div class="field">
          <label>Suffix</label>
          <input type="text" id="arSuffix" class="input" placeholder="Jr., Sr., III (opsyonal)">
        </div>

        <div class="field">
          <label>Araw ng Kapanganakan <span class="req">*</span></label>
          <input type="date" id="arBirth" class="input" required>
        </div>
        <div class="field">
          <label>Kasarian <span class="req">*</span></label>
          <select id="arSex" class="select" required>
            <option value="Male">Lalaki (Male)</option>
            <option value="Female">Babae (Female)</option>
          </select>
        </div>

        <div class="field">
          <label>Katayuang Sibil <span class="req">*</span></label>
          <select id="arCivil" class="select" required>
            <option value="Single">Walang Asawa (Single)</option>
            <option value="Married">May Asawa (Married)</option>
            <option value="Widowed">Biyudo / Biyuda (Widowed)</option>
            <option value="Separated">Hiwalay (Separated)</option>
          </select>
        </div>
        <div class="field">
          <label>Purok sa Barangay Wawa <span class="req">*</span></label>
          <select id="arPurok" class="select" required>
            ${BDRMS.PUROKS.map(p => `<option value="${p}">${p}</option>`).join('')}
          </select>
        </div>

        <div class="field">
          <label>Naninirahan sa Wawa Simula <span class="req">*</span></label>
          <input type="date" id="arSince" class="input" required>
        </div>
        <div class="field">
          <label>Mobile Number (Numero ng Telepono) <span class="req">*</span></label>
          <input type="tel" id="arContact" class="input" placeholder="09XX XXX XXXX" required>
        </div>

        <div class="field">
          <label>Username para sa Resident Login <span class="req">*</span></label>
          <input type="text" id="arUsername" class="input" placeholder="hal. juan.delacruz" required>
        </div>
        <div class="field">
          <label>Paunang Password para sa Residente <span class="req">*</span></label>
          <input type="text" id="arPassword" class="input" value="resident123" required>
        </div>
      </form>
    `,
    foot: `
      <button class="btn btn-ghost" data-close>Kanselahin</button>
      <button class="btn btn-primary" id="btnSaveResident">${BDRMS.ICONS.badgeCheck} Opisyal na I-rehistro ang Residente</button>
    `,
    onMount: (modalEl, closeFn) => {
      // Set default residency to 2 years ago
      const def = new Date();
      def.setFullYear(def.getFullYear() - 2);
      modalEl.querySelector('#arSince').value = def.toISOString().slice(0, 10);

      // Auto-generate username when typing first and last name
      const firstInp = modalEl.querySelector('#arFirst');
      const lastInp = modalEl.querySelector('#arLast');
      const userInp = modalEl.querySelector('#arUsername');
      const updateUsername = () => {
        const f = firstInp.value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const l = lastInp.value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (f && l) userInp.value = `${f}.${l}`;
      };
      firstInp.addEventListener('input', updateUsername);
      lastInp.addEventListener('input', updateUsername);

      modalEl.querySelector('#btnSaveResident').addEventListener('click', () => {
        const first = firstInp.value.trim();
        const last = lastInp.value.trim();
        const middle = modalEl.querySelector('#arMiddle').value.trim();
        const suffix = modalEl.querySelector('#arSuffix').value.trim();
        const birth = modalEl.querySelector('#arBirth').value;
        const sex = modalEl.querySelector('#arSex').value;
        const civil = modalEl.querySelector('#arCivil').value;
        const purok = modalEl.querySelector('#arPurok').value;
        const since = modalEl.querySelector('#arSince').value;
        const contact = modalEl.querySelector('#arContact').value.trim();
        const username = userInp.value.trim().toLowerCase();
        const password = modalEl.querySelector('#arPassword').value.trim();

        if (!first || !last || !birth || !since || !contact || !username || !password) {
          BDRMS.toast('Pakipunan ang lahat ng kinakailangang impormasyon.', 'error');
          return;
        }

        const newRes = BDRMS.registerResidentBySecretary({
          firstName: first,
          lastName: last,
          middleName: middle,
          suffix: suffix,
          birthdate: birth,
          sex: sex,
          civilStatus: civil,
          purok: purok,
          residentSince: since,
          contact: contact,
          username: username,
          password: password,
        }, user);

        BDRMS.toast(`Matagumpay na nairehistro si ${BDRMS.fullName(newRes)} sa Barangay Wawa! Aktibo na ang kanyang login access.`, 'success');

        closeFn();
        renderDashboard();
        renderResidentsTable();
      });
    },
  });
}

/* ---------- System Audit Trail Tab ---------- */
function renderLogsTable() {
  const tbody = document.getElementById('logsTableBody');
  if (!tbody) return;

  const logs = BDRMS.data().logs;
  tbody.innerHTML = logs.map(l => `
    <tr>
      <td>${BDRMS.fmtDateTime(l.at)}</td>
      <td><b>${BDRMS.esc(l.user)}</b> <span class="chip" style="font-size:0.7rem;">${l.role}</span></td>
      <td>${BDRMS.esc(l.action)}</td>
      <td>${BDRMS.esc(l.target || '—')}</td>
    </tr>
  `).join('');
}
