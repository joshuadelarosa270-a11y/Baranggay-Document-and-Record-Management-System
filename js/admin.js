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

  // Adjust UI visibility according to role permissions
  const walkinBtn = document.getElementById('btnOpenWalkin');
  if (walkinBtn) {
    walkinBtn.style.display = BDRMS.can(user, 'walkin') ? 'inline-flex' : 'none';
  }
}

function setupRoleSwitcher(currentUser) {
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-role');
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
    item.addEventListener('click', () => {
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Mobile sidebar toggle
  const menuBtn = document.getElementById('adminMenuToggle');
  const sidebar = document.querySelector('.admin-sidebar');
  if (menuBtn && sidebar) {
    menuBtn.innerHTML = BDRMS.ICONS.menu;
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
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
  }

  // Refresh tab content
  if (tabId === 'tabRequests') renderRequestsTable();
  if (tabId === 'tabResidents') renderResidentsTable();
  if (tabId === 'tabLogs') renderLogsTable();
}

/* ---------- Dashboard Rendering ---------- */
function renderDashboard() {
  const reqs = BDRMS.data().requests;
  const residents = BDRMS.data().residents;

  const countTotal = reqs.length;
  const countVerification = reqs.filter(r => r.status === 'Submitted' || r.status === 'Under Verification').length;
  const countApproval = reqs.filter(r => r.status === 'For Approval').length;
  const countReady = reqs.filter(r => r.status === 'Ready for Pickup').length;
  const countReleased = reqs.filter(r => r.status === 'Released').length;

  document.getElementById('statTotal').innerText = countTotal;
  document.getElementById('statVerification').innerText = countVerification;
  document.getElementById('statApproval').innerText = countApproval;
  document.getElementById('statReady').innerText = countReady;
  document.getElementById('statResidents').innerText = residents.length;

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

  // Walk-in modal button
  document.getElementById('btnOpenWalkin')?.addEventListener('click', openWalkinModal);

  // Add resident modal button
  document.getElementById('btnAddResident')?.addEventListener('click', openAddResidentModal);

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
    if (currentFilter.status === 'pending_verify') {
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
            <button class="btn btn-ghost btn-sm" onclick="openRequestDetail('${req.id}')" title="Review & Process Request">
              ${BDRMS.ICONS.eye} Review
            </button>
            ${(req.status === 'Ready for Pickup' || req.status === 'Released') ? `
              <button class="icon-btn" onclick="printRequestDirect('${req.id}')" title="Print Certificate">
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

  // Secretary or Admin Actions
  if (role === 'admin' || role === 'secretary') {
    if (status === 'Submitted') {
      btns.push(`<button class="btn btn-primary btn-block" data-action="verify_and_forward">${BDRMS.ICONS.send} 1-Click Verify & Endorse to Captain</button>`);
      btns.push(`<button class="btn btn-ghost btn-block btn-sm" data-action="verify" style="margin-top:4px;">${BDRMS.ICONS.search} Keep Under Verification (Pending requirements)</button>`);
    }
    if (status === 'Under Verification') {
      btns.push(`<button class="btn btn-primary btn-block" data-action="forward">${BDRMS.ICONS.send} Endorse to Captain for Approval</button>`);
    }
    if (status === 'Ready for Pickup') {
      btns.push(`<button class="btn btn-primary btn-block" data-action="release">${BDRMS.ICONS.badgeCheck} Collect Payment & Release Document</button>`);
    }
  }

  // Punong Barangay (Captain) or Admin Actions
  if (role === 'admin' || role === 'captain') {
    if (status === 'For Approval') {
      btns.push(`<button class="btn btn-primary btn-block" data-action="approve">${BDRMS.ICONS.signature} Approve & Electronically Sign Document</button>`);
    }
  }

  // Informative role indicators when waiting for other official
  if (status === 'For Approval' && role === 'secretary') {
    btns.push(`
      <div style="padding:10px 12px; border-radius:10px; background:var(--violet-soft); border:1px solid hsla(258,88%,72%,0.2); font-size:0.82rem; color:var(--text-soft);">
        <b style="color:var(--violet);">Awaiting Punong Barangay:</b> Endorsed to Hon. Ricardo D. Malabanan for final approval & signature.
      </div>
    `);
  }
  if ((status === 'Submitted' || status === 'Under Verification') && role === 'captain') {
    btns.push(`
      <div style="padding:10px 12px; border-radius:10px; background:var(--gold-soft); border:1px solid hsla(40,92%,61%,0.2); font-size:0.82rem; color:var(--text-soft);">
        <b style="color:var(--gold);">Under Secretary Review:</b> Sec. Lorna Fernandez is verifying ID and residency compliance.
      </div>
    `);
  }

  // Reject / Return Option (Available to Secretary, Captain, and Admin if not yet Released/Rejected)
  if (status !== 'Released' && status !== 'Rejected') {
    btns.push(`<button class="btn btn-danger btn-block btn-sm" data-action="reject" style="margin-top:8px;">${BDRMS.ICONS.x} Return / Reject Request</button>`);
  }

  if (btns.length === 0) {
    return `<div style="font-size:0.82rem; color:var(--muted); text-align:center; padding:10px;">Document completed and marked as ${status}.</div>`;
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
    req.history.push({ status: 'For Approval', by: user.short, at: new Date(Date.now() + 1000).toISOString(), note: 'Endorsed to Punong Barangay Hon. Ricardo D. Malabanan for approval.' });
    BDRMS.log(user, `Verified and endorsed ${req.ref} for approval`);
    BDRMS.toast(`Verified! Endorsed ${req.ref} to Punong Barangay for approval.`);
  } else if (action === 'verify') {
    req.status = 'Under Verification';
    req.verification.identity = true;
    req.verification.residency = true;
    req.history.push({ status: 'Under Verification', by: user.short, at: now, note: 'Checking proof of dwelling or additional requirements.' });
    BDRMS.log(user, `Marked request ${req.ref} under verification`);
    BDRMS.toast(`Request ${req.ref} moved to Under Verification.`);
  } else if (action === 'forward') {
    req.status = 'For Approval';
    req.history.push({ status: 'For Approval', by: user.short, at: now, note: 'Endorsed for Punong Barangay review and signature.' });
    BDRMS.log(user, `Endorsed ${req.ref} for approval`);
    BDRMS.toast(`Request ${req.ref} endorsed to Punong Barangay.`);
  } else if (action === 'approve') {
    req.status = 'Ready for Pickup';
    req.history.push({ status: 'Ready for Pickup', by: user.short, at: now, note: 'Approved and electronically sealed by Punong Barangay Hon. Ricardo D. Malabanan.' });
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
          history.push({ status: 'For Approval', by: user.short, at: now, note: 'Forwarded to Punong Barangay Hon. Ricardo D. Malabanan for approval.' });
        }
        if (flowSpeed === 'Ready for Pickup') {
          history.push({ status: 'Ready for Pickup', by: 'Hon. R. Malabanan', at: now, note: 'Approved on-the-spot for counter release.' });
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

/* ---------- Residents Registry Tab ---------- */
function renderResidentsTable() {
  const tbody = document.getElementById('residentsTableBody');
  if (!tbody) return;

  const residents = BDRMS.data().residents;
  tbody.innerHTML = residents.map((r, i) => {
    const age = BDRMS.ageOf(r.birthdate);
    const months = BDRMS.monthsBetween(r.residentSince);
    const isOk = months >= BDRMS.RESIDENCY_MONTHS;

    return `
      <tr>
        <td><b>RES-${String(i + 1).padStart(4, '0')}</b></td>
        <td>
          <div class="table-applicant">
            <div class="applicant-avatar">${r.firstName.charAt(0)}</div>
            <div class="applicant-meta">
              <strong>${BDRMS.esc(BDRMS.fullName(r))}</strong>
              <span>${age} yrs • ${r.sex}</span>
            </div>
          </div>
        </td>
        <td>${BDRMS.esc(r.purok)}</td>
        <td>${BDRMS.maskPhone(r.contact)}</td>
        <td>
          <b>${BDRMS.residencyText(r.residentSince)}</b>
          ${isOk ? '<span class="badge badge-released no-dot" style="margin-left:6px; font-size:0.7rem;">≥ 6 mos</span>' : '<span class="badge badge-verification no-dot" style="margin-left:6px; font-size:0.7rem;">&lt; 6 mos</span>'}
        </td>
        <td>
          <span class="badge badge-released">Verified</span>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddResidentModal() {
  BDRMS.modal({
    title: 'Register New Barangay Resident',
    subtitle: 'Official Registry of Barangay Wawa, Abra de Ilog',
    wide: false,
    body: `
      <form id="formAddRes" class="form-grid">
        <div class="field">
          <label>First Name <span class="req">*</span></label>
          <input type="text" id="arFirst" class="input" required>
        </div>
        <div class="field">
          <label>Last Name <span class="req">*</span></label>
          <input type="text" id="arLast" class="input" required>
        </div>
        <div class="field">
          <label>Middle Name</label>
          <input type="text" id="arMiddle" class="input">
        </div>
        <div class="field">
          <label>Date of Birth <span class="req">*</span></label>
          <input type="date" id="arBirth" class="input" required>
        </div>
        <div class="field">
          <label>Purok <span class="req">*</span></label>
          <select id="arPurok" class="select">
            ${BDRMS.PUROKS.map(p => `<option value="${p}">${p}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Resident Since <span class="req">*</span></label>
          <input type="date" id="arSince" class="input" required>
        </div>
        <div class="field span-2">
          <label>Contact Number</label>
          <input type="tel" id="arContact" class="input" placeholder="09XX XXX XXXX">
        </div>
      </form>
    `,
    foot: `
      <button class="btn btn-ghost" data-close>Cancel</button>
      <button class="btn btn-primary" id="btnSaveResident">${BDRMS.ICONS.plus} Register Resident</button>
    `,
    onMount: (modalEl, closeFn) => {
      modalEl.querySelector('#btnSaveResident').addEventListener('click', () => {
        const first = modalEl.querySelector('#arFirst').value.trim();
        const last = modalEl.querySelector('#arLast').value.trim();
        const birth = modalEl.querySelector('#arBirth').value;
        const purok = modalEl.querySelector('#arPurok').value;
        const since = modalEl.querySelector('#arSince').value;
        const contact = modalEl.querySelector('#arContact').value.trim();

        if (!first || !last || !birth || !since) {
          BDRMS.toast('Please provide required resident details.', 'error');
          return;
        }

        const newRes = {
          id: BDRMS.uid('res'),
          firstName: first,
          middleName: modalEl.querySelector('#arMiddle').value.trim(),
          lastName: last,
          suffix: '',
          birthdate: birth,
          sex: 'Male',
          civilStatus: 'Single',
          purok,
          address: `${purok}, Barangay Wawa, Abra de Ilog, Occidental Mindoro`,
          contact,
          email: '',
          residentSince: since,
          verified: true,
          createdAt: new Date().toISOString(),
        };

        BDRMS.data().residents.unshift(newRes);
        BDRMS.save();
        BDRMS.log(BDRMS.currentUser(), `Registered resident ${BDRMS.fullName(newRes)}`);
        BDRMS.toast(`Resident ${BDRMS.fullName(newRes)} registered successfully.`);

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
