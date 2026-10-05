/* ==========================================================================
   BDRMS — Resident Portal Controller (js/portal.js)
   Barangay Wawa, Abra de Ilog, Occidental Mindoro
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Update navbar if resident or staff is logged in
  updateNavbarUser();

  // Mobile Nav Toggle
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.querySelector('.nav-links');
  if (menuToggle && navLinks) {
    menuToggle.innerHTML = BDRMS.ICONS.menu;
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  // Scroll effect on Navbar
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  // Render Document Showcase Grid
  renderDocsGrid();

  // Initialize Request Wizard
  initWizard();

  // Initialize Request Tracker
  initTracker();

  // Populate Device Reference History
  renderDeviceRefs();

  // Smooth scroll links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        if (navLinks) navLinks.classList.remove('open');
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Proposal modal trigger
  const proposalBtn = document.getElementById('viewProposalBtn');
  if (proposalBtn) {
    proposalBtn.addEventListener('click', showProposalModal);
  }
});

function updateNavbarUser() {
  const curRes = BDRMS.currentResident();
  const residentLink = document.querySelector('a[href="resident-login.html"]');
  if (residentLink && curRes) {
    residentLink.href = 'resident-dashboard.html';
    residentLink.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px; color:#031512;">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
      Dashboard (${BDRMS.esc(curRes.firstName)})
    `;
    residentLink.classList.remove('btn-ghost');
    residentLink.classList.add('btn-primary');
  }
}

/* ---------- Render Document Cards ---------- */
function renderDocsGrid() {
  const container = document.getElementById('docsContainer');
  if (!container) return;

  const docs = Object.entries(BDRMS.DOC_TYPES);
  container.innerHTML = docs.map(([key, doc]) => `
    <div class="doc-card" data-key="${key}">
      <div class="doc-icon" style="background:${doc.color.replace('hsl', 'hsla').replace(')', ', 0.14)')};color:${doc.color};border:1px solid ${doc.color.replace('hsl', 'hsla').replace(')', ', 0.28)')}">
        ${BDRMS.ICONS[doc.icon]}
      </div>
      <h3>${BDRMS.esc(doc.name)}</h3>
      <p>${BDRMS.esc(doc.desc)}</p>
      <div class="doc-meta">
        <span>Processing: <b>${doc.processing}</b></span>
        <span class="go">Request ${BDRMS.ICONS.arrowRight}</span>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.doc-card').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.getAttribute('data-key');
      selectDocInWizard(key);
      const reqSection = document.getElementById('request');
      if (reqSection) reqSection.scrollIntoView({ behavior: 'smooth' });
    });

    // Card hover radial light effect
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mx', `${x}px`);
      card.style.setProperty('--my', `${y}px`);
    });
  });
}

/* ---------- Request Wizard Logic ---------- */
let currentStep = 1;
let selectedDocKey = 'clearance';

function initWizard() {
  renderDocPicker();
  setupResidencyCalculator();
  setupWizardButtons();
  populatePurokSelects();
  prefillIfResidentLoggedIn();
  updateWizardUI();
}

function prefillIfResidentLoggedIn() {
  const cur = BDRMS.currentResident();
  if (!cur) return;
  const setVal = (id, v) => { const el = document.getElementById(id); if (el && v) el.value = v; };
  setVal('fieldFirstName', cur.firstName);
  setVal('fieldLastName', cur.lastName);
  setVal('fieldMiddleName', cur.middleName);
  setVal('fieldBirthdate', cur.birthdate);
  setVal('fieldSex', cur.sex);
  setVal('fieldCivilStatus', cur.civilStatus);
  setVal('fieldPurok', cur.purok);
  setVal('fieldContact', cur.contact);
  setVal('fieldEmail', cur.email);
  setVal('fieldResidentSince', cur.residentSince);

  const meter = document.getElementById('residencyMeter');
  if (meter && cur.residentSince) {
    const text = BDRMS.residencyText(cur.residentSince);
    meter.className = 'residency-meter ok';
    meter.innerHTML = `${BDRMS.ICONS.check} <b>Verified Resident Profile:</b> ${BDRMS.esc(BDRMS.fullName(cur))} (${text} in Brgy. Wawa).`;
  }
}

function renderDocPicker() {
  const picker = document.getElementById('docPicker');
  if (!picker) return;

  picker.innerHTML = Object.entries(BDRMS.DOC_TYPES).map(([key, doc]) => `
    <div class="doc-option ${key === selectedDocKey ? 'selected' : ''}" data-key="${key}">
      <div class="doc-icon" style="background:${doc.color.replace('hsl', 'hsla').replace(')', ', 0.14)')};color:${doc.color};border:1px solid ${doc.color.replace('hsl', 'hsla').replace(')', ', 0.28)')}">
        ${BDRMS.ICONS[doc.icon]}
      </div>
      <div>
        <strong>${BDRMS.esc(doc.short)}</strong>
        <span>${doc.fee}</span>
      </div>
    </div>
  `).join('');

  picker.querySelectorAll('.doc-option').forEach(opt => {
    opt.addEventListener('click', () => {
      picker.querySelectorAll('.doc-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedDocKey = opt.getAttribute('data-key');
      updateDocRequirementsView();
    });
  });

  updateDocRequirementsView();
}

function selectDocInWizard(key) {
  selectedDocKey = key;
  const picker = document.getElementById('docPicker');
  if (picker) {
    picker.querySelectorAll('.doc-option').forEach(opt => {
      if (opt.getAttribute('data-key') === key) {
        opt.classList.add('selected');
      } else {
        opt.classList.remove('selected');
      }
    });
  }
  updateDocRequirementsView();
  goToStep(1);
}

function updateDocRequirementsView() {
  const doc = BDRMS.DOC_TYPES[selectedDocKey];
  const container = document.getElementById('docReqDetails');
  if (!container || !doc) return;

  container.innerHTML = `
    <div class="req-box">
      <h4>${BDRMS.ICONS.info} Official Barangay Requirements for ${BDRMS.esc(doc.name)}:</h4>
      <ul>
        ${doc.requirements.map(r => `<li>${BDRMS.esc(r)}</li>`).join('')}
      </ul>
      <div class="req-foot">
        <span>Estimated processing: <b>${doc.processing}</b></span>
        <span>Barangay fee: <b>${doc.fee}</b></span>
      </div>
    </div>
  `;

  // Update dynamic extra fields for Step 3
  updateExtraFields();
}

function updateExtraFields() {
  const doc = BDRMS.DOC_TYPES[selectedDocKey];
  const container = document.getElementById('extraFieldsContainer');
  const purposeSelect = document.getElementById('fieldPurpose');

  if (purposeSelect && doc) {
    purposeSelect.innerHTML = doc.purposes.map(p => `<option value="${BDRMS.esc(p)}">${BDRMS.esc(p)}</option>`).join('');
  }

  if (container) {
    if (doc.extra && doc.extra.length > 0) {
      container.innerHTML = `
        <div class="form-grid" style="margin-top: 14px;">
          ${doc.extra.map(f => `
            <div class="field span-2">
              <label for="extra_${f.key}">${BDRMS.esc(f.label)} ${f.required ? '<span class="req">*</span>' : ''}</label>
              <input type="text" id="extra_${f.key}" class="input" placeholder="${BDRMS.esc(f.placeholder)}" ${f.required ? 'required' : ''}>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      container.innerHTML = '';
    }
  }
}

function populatePurokSelects() {
  const sel = document.getElementById('fieldPurok');
  if (sel) {
    sel.innerHTML = `<option value="">Select your Purok</option>` +
      BDRMS.PUROKS.map(p => `<option value="${p}">${p}</option>`).join('');
  }

  const idTypeSel = document.getElementById('fieldIdType');
  if (idTypeSel) {
    idTypeSel.innerHTML = BDRMS.ID_TYPES.map(t => `<option value="${t}">${t}</option>`).join('');
  }
}

function setupResidencyCalculator() {
  const sinceInput = document.getElementById('fieldResidentSince');
  const meter = document.getElementById('residencyMeter');
  if (!sinceInput || !meter) return;

  // Default to 1 year ago for convenience
  const defaultDate = new Date();
  defaultDate.setFullYear(defaultDate.getFullYear() - 1);
  sinceInput.value = defaultDate.toISOString().slice(0, 10);

  function evalResidency() {
    const val = sinceInput.value;
    if (!val) {
      meter.className = 'residency-meter hidden';
      return;
    }
    const months = BDRMS.monthsBetween(val);
    const text = BDRMS.residencyText(val);

    if (months >= BDRMS.RESIDENCY_MONTHS) {
      meter.className = 'residency-meter ok';
      meter.innerHTML = `${BDRMS.ICONS.check} <b>Residency Duration: ${text}</b> — Meets the 6-month residency requirement of Barangay Wawa.`;
    } else {
      meter.className = 'residency-meter warn';
      meter.innerHTML = `${BDRMS.ICONS.alert} <b>Residency Duration: ${text} (Less than 6 months)</b> — Note: Barangay Secretary may require additional verification or proof of dwelling.`;
    }
  }

  sinceInput.addEventListener('change', evalResidency);
  evalResidency();
}

function setupWizardButtons() {
  document.getElementById('btnStep1Next')?.addEventListener('click', () => goToStep(2));
  document.getElementById('btnStep2Prev')?.addEventListener('click', () => goToStep(1));
  document.getElementById('btnStep2Next')?.addEventListener('click', () => {
    if (validateStep2()) goToStep(3);
  });
  document.getElementById('btnStep3Prev')?.addEventListener('click', () => goToStep(2));
  document.getElementById('btnStep3Next')?.addEventListener('click', () => {
    if (validateStep3()) {
      prepareReviewSummary();
      goToStep(4);
    }
  });
  document.getElementById('btnStep4Prev')?.addEventListener('click', () => goToStep(3));
  document.getElementById('btnSubmitRequest')?.addEventListener('click', handleSubmitRequest);
  document.getElementById('btnNewRequest')?.addEventListener('click', resetWizard);
}

function goToStep(step) {
  currentStep = step;
  updateWizardUI();
}

function updateWizardUI() {
  document.querySelectorAll('.wiz-step').forEach((el, idx) => {
    const s = idx + 1;
    el.classList.remove('active', 'done');
    if (s === currentStep) el.classList.add('active');
    else if (s < currentStep) el.classList.add('done');
  });

  document.querySelectorAll('.wiz-panel').forEach((panel, idx) => {
    if (idx + 1 === currentStep) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });
}

function validateStep2() {
  const fields = ['fieldFirstName', 'fieldLastName', 'fieldBirthdate', 'fieldSex', 'fieldCivilStatus', 'fieldPurok', 'fieldContact', 'fieldResidentSince'];
  let valid = true;
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el || !el.value.trim()) {
      if (el) el.classList.add('invalid');
      valid = false;
    } else {
      if (el) el.classList.remove('invalid');
    }
  });

  if (!valid) {
    BDRMS.toast('Please fill in all required personal information fields.', 'error');
  }
  return valid;
}

function validateStep3() {
  const idType = document.getElementById('fieldIdType');
  const idNumber = document.getElementById('fieldIdNumber');
  let valid = true;

  if (!idNumber || !idNumber.value.trim()) {
    idNumber.classList.add('invalid');
    valid = false;
  } else {
    idNumber.classList.remove('invalid');
  }

  // Check extra required fields if any
  const doc = BDRMS.DOC_TYPES[selectedDocKey];
  if (doc && doc.extra) {
    doc.extra.forEach(f => {
      if (f.required) {
        const inp = document.getElementById(`extra_${f.key}`);
        if (!inp || !inp.value.trim()) {
          if (inp) inp.classList.add('invalid');
          valid = false;
        } else {
          if (inp) inp.classList.remove('invalid');
        }
      }
    });
  }

  if (!valid) {
    BDRMS.toast('Please provide your ID number and complete document details.', 'error');
  }
  return valid;
}

function prepareReviewSummary() {
  const doc = BDRMS.DOC_TYPES[selectedDocKey];
  const applicant = getApplicantFormData();
  const summaryBox = document.getElementById('reviewSummary');
  if (!summaryBox) return;

  const extra = getExtraFormData();
  let extraRows = '';
  if (doc.extra && doc.extra.length > 0) {
    extraRows = doc.extra.map(f => `
      <div>
        <dt>${BDRMS.esc(f.label)}</dt>
        <dd>${BDRMS.esc(extra[f.key] || '—')}</dd>
      </div>
    `).join('');
  }

  const months = BDRMS.monthsBetween(applicant.residentSince);
  const isResidencyOk = months >= BDRMS.RESIDENCY_MONTHS;

  summaryBox.innerHTML = `
    <div class="review-grid">
      <div class="span-2">
        <dt>Requested Document</dt>
        <dd><b>${BDRMS.esc(doc.name)}</b> (${doc.fee})</dd>
      </div>
      <div>
        <dt>Applicant Name</dt>
        <dd>${BDRMS.esc(BDRMS.fullName(applicant))}</dd>
      </div>
      <div>
        <dt>Purok / Address</dt>
        <dd>${BDRMS.esc(applicant.purok)}, Barangay Wawa</dd>
      </div>
      <div>
        <dt>Contact Number</dt>
        <dd>${BDRMS.esc(applicant.contact)}</dd>
      </div>
      <div>
        <dt>Length of Residency</dt>
        <dd>${BDRMS.residencyText(applicant.residentSince)} ${isResidencyOk ? '✓' : '(Under 6 mos)'}</dd>
      </div>
      <div>
        <dt>Presented ID Type</dt>
        <dd>${BDRMS.esc(document.getElementById('fieldIdType').value)}</dd>
      </div>
      <div>
        <dt>ID Last 4 Digits</dt>
        <dd>•••• ${BDRMS.esc(document.getElementById('fieldIdNumber').value.slice(-4))}</dd>
      </div>
      <div class="span-2">
        <dt>Purpose</dt>
        <dd>${BDRMS.esc(document.getElementById('fieldPurpose').value)}</dd>
      </div>
      ${extraRows}
    </div>
  `;
}

function getApplicantFormData() {
  return {
    firstName: document.getElementById('fieldFirstName')?.value.trim() || '',
    middleName: document.getElementById('fieldMiddleName')?.value.trim() || '',
    lastName: document.getElementById('fieldLastName')?.value.trim() || '',
    suffix: document.getElementById('fieldSuffix')?.value.trim() || '',
    birthdate: document.getElementById('fieldBirthdate')?.value || '',
    sex: document.getElementById('fieldSex')?.value || 'Male',
    civilStatus: document.getElementById('fieldCivilStatus')?.value || 'Single',
    purok: document.getElementById('fieldPurok')?.value || 'Purok 1',
    contact: document.getElementById('fieldContact')?.value.trim() || '',
    email: document.getElementById('fieldEmail')?.value.trim() || '',
    residentSince: document.getElementById('fieldResidentSince')?.value || '',
  };
}

function getExtraFormData() {
  const doc = BDRMS.DOC_TYPES[selectedDocKey];
  const data = {};
  if (doc && doc.extra) {
    doc.extra.forEach(f => {
      const el = document.getElementById(`extra_${f.key}`);
      if (el) data[f.key] = el.value.trim();
    });
  }
  return data;
}

function handleSubmitRequest() {
  const privacyCheck = document.getElementById('agreePrivacy');
  if (!privacyCheck || !privacyCheck.checked) {
    BDRMS.toast('Please agree to the Data Privacy & Hybrid Verification terms before submitting.', 'error');
    return;
  }

  const applicant = getApplicantFormData();
  const idType = document.getElementById('fieldIdType').value;
  const idNumber = document.getElementById('fieldIdNumber').value;
  const purpose = document.getElementById('fieldPurpose').value;
  const extra = getExtraFormData();
  const curRes = BDRMS.currentResident();

  // Create request in store
  const newReq = BDRMS.createRequest({
    applicant,
    docType: selectedDocKey,
    purpose,
    extra,
    idType,
    idNumber,
    channel: 'Online',
    by: curRes ? `${curRes.firstName} (Resident Account)` : 'Resident (Online)',
    residentId: curRes ? curRes.id : null,
  });

  // Save to device history
  BDRMS.addDeviceRef(newReq.ref, applicant.lastName);
  renderDeviceRefs();

  // Show Success View
  showSuccessStep(newReq);
}

function showSuccessStep(req) {
  document.querySelectorAll('.wiz-panel').forEach(p => p.classList.remove('active'));
  const successPanel = document.getElementById('wizSuccess');
  if (!successPanel) return;

  successPanel.classList.add('active');
  document.getElementById('successRefCode').innerText = req.ref;
  document.getElementById('successDocName').innerText = BDRMS.DOC_TYPES[req.docType].name;
  document.getElementById('successApplicant').innerText = BDRMS.fullName(req.applicant);

  // Copy ref button
  document.getElementById('btnCopyRef').onclick = () => {
    navigator.clipboard.writeText(req.ref).then(() => {
      BDRMS.toast('Reference number copied to clipboard!');
    });
  };

  // Track button
  document.getElementById('btnTrackThisNow').onclick = () => {
    document.getElementById('trackRef').value = req.ref;
    document.getElementById('trackLastName').value = req.applicant.lastName;
    document.getElementById('track').scrollIntoView({ behavior: 'smooth' });
    lookupRequest(req.ref, req.applicant.lastName);
  };
}

function resetWizard() {
  document.getElementById('formStep2')?.reset();
  document.getElementById('formStep3')?.reset();
  const privacy = document.getElementById('agreePrivacy');
  if (privacy) privacy.checked = false;
  setupResidencyCalculator();
  goToStep(1);
}

/* ---------- Request Tracking Logic ---------- */
function initTracker() {
  const trackBtn = document.getElementById('btnTrack');
  if (trackBtn) {
    trackBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const ref = document.getElementById('trackRef').value.trim();
      const lastName = document.getElementById('trackLastName').value.trim();
      if (!ref || !lastName) {
        BDRMS.toast('Please enter both your Reference Number and Last Name.', 'error');
        return;
      }
      lookupRequest(ref, lastName);
    });
  }
}

function lookupRequest(ref, lastName) {
  const resultContainer = document.getElementById('trackResult');
  if (!resultContainer) return;

  const req = BDRMS.trackRequest(ref, lastName);
  if (!req) {
    resultContainer.classList.remove('hidden');
    resultContainer.innerHTML = `
      <div class="empty-state">
        ${BDRMS.ICONS.alert}
        <h4>No Matching Document Request Found</h4>
        <p>Double-check your Reference Number (e.g. <code>BW-2610-K7QM</code>) and ensure the Last Name matches the applicant's record.</p>
        <p style="font-size: 0.8rem; margin-top: 10px;">For assistance, you may visit the Barangay Hall of Barangay Wawa during office hours.</p>
      </div>
    `;
    return;
  }

  const doc = BDRMS.DOC_TYPES[req.docType];
  const isApproved = req.status === 'Ready for Pickup' || req.status === 'Released';

  resultContainer.classList.remove('hidden');
  resultContainer.innerHTML = `
    <div class="track-head">
      <div>
        <div style="display:flex; align-items:center; gap: 8px; margin-bottom: 6px;">
          ${BDRMS.statusBadge(req.status)}
          <span class="chip">${req.channel} Request</span>
        </div>
        <h3>${BDRMS.esc(doc.name)}</h3>
        <p class="muted">Reference No: <b class="mono" style="color:var(--primary);">${req.ref}</b> • Requested on ${BDRMS.fmtDateTime(req.createdAt)}</p>
        
        <div style="display:flex; align-items:center; gap:10px; margin-top:8px; font-size:0.84rem;">
          <span>Official Fee: <b>${doc.fee}</b></span>
          <span>•</span>
          <span>Payment: <b class="badge ${req.paymentStatus === 'Paid' ? 'badge-released' : (req.paymentStatus === 'Exempt' ? 'badge-submitted' : 'badge-verification')}">${req.paymentStatus || 'Unpaid'}</b> ${req.orNumber ? `(O.R. #${BDRMS.esc(req.orNumber)})` : ''}</span>
        </div>
      </div>
      <div>
        ${isApproved ? `<button class="btn btn-primary btn-sm" id="btnResidentPrintCert">${BDRMS.ICONS.printer} View & Print Official Document</button>` : ''}
      </div>
    </div>

    ${req.status === 'Ready for Pickup' ? `
      <div style="margin: 18px 0; padding: 14px 16px; border-radius: 12px; background: var(--primary-soft); border: 1px solid hsla(166,72%,44%,0.3); font-size: 0.86rem; color: var(--text); display: flex; gap: 12px; align-items: flex-start;">
        <div style="font-size: 1.4rem; line-height: 1;">📱</div>
        <div>
          <b style="color: var(--primary);">SMS Notification Dispatched to ${BDRMS.maskPhone(req.applicant.contact)}:</b><br>
          <i>"Good day! Your ${BDRMS.esc(doc.name)} (Ref: ${req.ref}) has been APPROVED by Punong Barangay Hon. Ricardo D. Malabanan and is READY FOR PICKUP at Barangay Wawa Hall. Please bring your ${BDRMS.esc(req.idType)} and exact fee of ${doc.fee}. Office hours: Mon-Fri 8am-5pm."</i>
        </div>
      </div>
    ` : ''}

    ${req.status === 'Rejected' ? `
      <div style="margin: 18px 0; padding: 14px 16px; border-radius: 12px; background: var(--danger-soft); border: 1px solid hsla(350,82%,66%,0.3); font-size: 0.86rem; color: var(--danger);">
        <b>Official Return / Rejection Remarks:</b> ${BDRMS.esc(req.remarks || 'Document requirements incomplete.')}<br>
        <span style="font-size: 0.8rem; color: var(--text-soft); margin-top: 4px; display: block;">You may submit a new request or visit the Barangay Hall for further verification.</span>
      </div>
    ` : ''}

    <!-- Timeline of progress -->
    <div class="timeline">
      ${renderTimelineSteps(req)}
    </div>

    <div style="margin-top: 26px; padding: 18px; border-radius: 14px; background: rgba(0,0,0,0.25); border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
      <div>
        <strong style="display:block; font-size: 0.9rem;">Pickup & Release Reminder:</strong>
        <span style="font-size: 0.82rem; color: var(--muted);">Please bring your original <b>${BDRMS.esc(req.idType)}</b> when claiming the official document at the Barangay Hall.</span>
      </div>
      <div style="font-size: 0.82rem; color: var(--text-soft);">
        Barangay Wawa Hall Hours: <b>Mon–Fri 8:00 AM – 5:00 PM</b>
      </div>
    </div>
  `;

  if (isApproved) {
    document.getElementById('btnResidentPrintCert')?.addEventListener('click', () => {
      showPrintModal(req);
    });
  }
}

function renderTimelineSteps(req) {
  const steps = [
    { name: 'Submitted', desc: 'Request submitted online and logged in the system.' },
    { name: 'Under Verification', desc: 'Barangay Secretary is checking resident identity and 6-month residency status.' },
    { name: 'For Approval', desc: 'Forwarded to Punong Barangay Hon. Ricardo D. Malabanan for review and signature.' },
    { name: 'Ready for Pickup', desc: 'Document prepared and sealed. Ready to claim at the Barangay Hall.' },
    { name: 'Released', desc: 'Official document claimed and signed by the resident.' },
  ];

  if (req.status === 'Rejected') {
    return `
      <div class="tl-item done">
        <div class="tl-dot">${BDRMS.ICONS.check}</div>
        <div class="tl-body">
          <strong>Request Submitted</strong>
          <span>${BDRMS.fmtDateTime(req.createdAt)}</span>
        </div>
      </div>
      <div class="tl-item rejected">
        <div class="tl-dot">${BDRMS.ICONS.x}</div>
        <div class="tl-body">
          <strong style="color:var(--danger);">Request Returned / Rejected</strong>
          <span>${BDRMS.fmtDateTime(req.updatedAt)}</span>
          <p style="color:var(--danger);">${BDRMS.esc(req.remarks || 'Please contact the Barangay Hall for details.')}</p>
        </div>
      </div>
    `;
  }

  const currentIdx = BDRMS.FLOW.indexOf(req.status);

  return steps.map((step, idx) => {
    let state = 'pending';
    let icon = BDRMS.ICONS.clock;
    if (idx < currentIdx) {
      state = 'done';
      icon = BDRMS.ICONS.check;
    } else if (idx === currentIdx) {
      state = 'current';
      icon = BDRMS.ICONS[BDRMS.STATUSES[req.status]?.icon || 'clock'];
    }

    const hist = req.history.find(h => h.status === step.name);

    return `
      <div class="tl-item ${state}">
        <div class="tl-dot">${icon}</div>
        <div class="tl-body">
          <strong>${step.name} ${state === 'current' ? '<span class="badge badge-submitted no-dot" style="margin-left:8px; font-size:0.7rem;">In Progress</span>' : ''}</strong>
          <span>${hist ? `${BDRMS.fmtDateTime(hist.at)} • by ${hist.by}` : step.desc}</span>
          ${hist && hist.note ? `<p>${BDRMS.esc(hist.note)}</p>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderDeviceRefs() {
  const container = document.getElementById('deviceRefsList');
  if (!container) return;

  const refs = BDRMS.deviceRefs();
  if (refs.length === 0) {
    container.innerHTML = '<span class="muted" style="font-size:0.8rem;">No recent requests on this device.</span>';
    return;
  }

  container.innerHTML = `
    <span class="muted" style="font-size:0.8rem;">Recent on this device:</span>
    ${refs.map(r => `
      <button class="chip" data-ref="${r.ref}" data-lastname="${BDRMS.esc(r.lastName)}">
        ${r.ref} (${BDRMS.esc(r.lastName)})
      </button>
    `).join('')}
  `;

  container.querySelectorAll('button.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const ref = btn.getAttribute('data-ref');
      const lastName = btn.getAttribute('data-lastname');
      document.getElementById('trackRef').value = ref;
      document.getElementById('trackLastName').value = lastName;
      lookupRequest(ref, lastName);
    });
  });
}

/* ---------- Official Print Modal ---------- */
function showPrintModal(req) {
  BDRMS.modal({
    title: 'Official Document Preview',
    subtitle: `${BDRMS.DOC_TYPES[req.docType].name} — Barangay Wawa, Abra de Ilog`,
    wide: true,
    body: BDRMS.certificateHTML(req),
    foot: `
      <button class="btn btn-ghost" data-close>Close</button>
      <button class="btn btn-primary" onclick="window.print()">${BDRMS.ICONS.printer} Print Document</button>
    `,
  });
}

/* ---------- Academic Proposal Information Modal ---------- */
function showProposalModal() {
  BDRMS.modal({
    title: 'Laboratory Activity 1 – Part 1: Project Proposal',
    subtitle: 'Barangay Document and Records Management System (BDRMS)',
    wide: true,
    body: `
      <div style="font-size: 0.9rem; line-height: 1.6; display: grid; gap: 20px;">
        <div style="padding: 16px; border-radius: 12px; background: var(--surface-2); border: 1px solid var(--border);">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
            <div><strong style="color:var(--primary);">Group Members:</strong><br>Joshua Dela Rosa<br>Angela Espinosa<br>Nicole Guevarra<br>Era May Roxas</div>
            <div><strong style="color:var(--primary);">Section:</strong> 1E<br><strong style="color:var(--primary);">Date:</strong> August 16, 2026</div>
            <div><strong style="color:var(--primary);">Location:</strong><br>Barangay Wawa, Abra de Ilog, Occidental Mindoro</div>
          </div>
        </div>

        <div>
          <h4 style="color:var(--accent); margin-bottom: 6px;">1. The Real-World Problem Observed</h4>
          <p class="muted">Residents who need Barangay Indigency, Barangay Clearance, Certificate of Residency, Certificate for Bilihan, First Time Job Seeker Certificate, Barangay ID, or Certificate to File Action must physically visit the barangay hall, verify their identity and 6-month residency, wait for manual processing, and obtain signatures. Heavy request volume creates long queues and burdens personnel.</p>
        </div>

        <div>
          <h4 style="color:var(--accent); margin-bottom: 6px;">2. Evidence Collected (August 16, 2026)</h4>
          <ul class="muted" style="padding-left: 20px; display: grid; gap: 6px;">
            <li><b>Observation:</b> Processing requires identity checks, residency verification, and Barangay Captain signature.</li>
            <li><b>Resident Interview:</b> Technology could make requesting faster and reduce waiting time at the hall.</li>
            <li><b>Barangay Secretary Interview:</b> Strict 6-month residency rule must be enforced; technology eases tracking.</li>
            <li><b>Barangay Official Interview:</b> Not all residents have internet access or tech literacy; system must support <i>both</i> online and face-to-face walk-in requests while protecting resident privacy.</li>
          </ul>
        </div>

        <div>
          <h4 style="color:var(--accent); margin-bottom: 6px;">3. Hybrid Solution Implemented in this System</h4>
          <p class="muted">A dual-mode solution: (a) Online portal for digitally-connected residents to submit and track requests ahead of time, and (b) Walk-In Encoding module for barangay personnel to serve residents without smartphones or internet, with a centralized verification and record-keeping system.</p>
        </div>
      </div>
    `,
    foot: `<button class="btn btn-primary" data-close>Understood</button>`,
  });
}
