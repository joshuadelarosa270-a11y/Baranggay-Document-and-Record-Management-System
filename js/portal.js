/* ==========================================================================
   BDRMS — Resident Portal Controller (js/portal.js)
   Barangay Wawa, Abra de Ilog, Occidental Mindoro
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Update navbar based on active resident or staff session
  updateNavbarUser();

  // Mobile Nav Drawer Toggle
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
        navLinks.classList.remove('open');
      }
    });
  }

  // Scroll effect on Navbar
  const nav = document.getElementById('topNav') || document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });

  // Render Document Showcase Grid with Category Filters & Search
  renderDocsGrid();
  initCategoryFilters();
  initHeroSearch();

  // Initialize Request Tracker
  initTracker();

  // Populate Device Reference History
  renderDeviceRefs();

  // Smooth scroll links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || !targetId) return;
      const target = document.querySelector(targetId);
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

/* ---------- User & Navbar Synchronization ---------- */
function updateNavbarUser() {
  const curRes = BDRMS.currentResident();
  const navResidentBtn = document.getElementById('navResidentBtn');
  const navResidentText = document.getElementById('navResidentText');

  if (curRes && navResidentBtn) {
    navResidentBtn.href = 'resident-dashboard.html';
    navResidentBtn.classList.remove('btn-ghost');
    navResidentBtn.classList.add('btn-primary');
    if (navResidentText) {
      navResidentText.innerText = `Dashboard (${curRes.firstName})`;
    }
  }

  // Check autofill banner in wizard Step 2
  const banner = document.getElementById('residentAutofillBanner');
  const nameEl = document.getElementById('loggedResidentName');
  if (curRes && banner) {
    banner.classList.remove('hidden');
    if (nameEl) nameEl.innerText = BDRMS.fullName(curRes);
  }
}

/* ---------- Document Catalogue & Category Filtering ---------- */
let activeCategory = 'all';
let currentSearchQuery = '';

const CATEGORY_MAP = {
  free: ['indigency', 'jobseeker'],
  employment: ['clearance', 'jobseeker', 'residency'],
  assistance: ['indigency', 'residency'],
  business: ['clearance', 'bilihan'],
};

function initCategoryFilters() {
  const tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeCategory = tab.getAttribute('data-category');
      renderDocsGrid();
    });
  });
}

function initHeroSearch() {
  const input = document.getElementById('heroSearchInput');
  const btn = document.getElementById('heroSearchBtn');

  const executeSearch = () => {
    currentSearchQuery = (input?.value || '').trim().toLowerCase();
    const servicesSec = document.getElementById('services');
    if (servicesSec) {
      servicesSec.scrollIntoView({ behavior: 'smooth' });
    }
    renderDocsGrid();
  };

  btn?.addEventListener('click', executeSearch);
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeSearch();
    }
  });

  // Hero Quick Tag Buttons
  document.querySelectorAll('.hero-tag-btn').forEach(tag => {
    tag.addEventListener('click', () => {
      const q = tag.getAttribute('data-search') || '';
      if (input) input.value = q;
      currentSearchQuery = q.toLowerCase();
      activeCategory = 'all';
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.toggle('active', t.dataset.category === 'all'));
      const servicesSec = document.getElementById('services');
      if (servicesSec) {
        servicesSec.scrollIntoView({ behavior: 'smooth' });
      }
      renderDocsGrid();
    });
  });
}

function renderDocsGrid() {
  const container = document.getElementById('docsContainer');
  if (!container) return;

  const docs = Object.entries(BDRMS.DOC_TYPES);
  const filtered = docs.filter(([key, doc]) => {
    // Category match
    if (activeCategory !== 'all') {
      const allowed = CATEGORY_MAP[activeCategory] || [];
      if (!allowed.includes(key)) return false;
    }
    // Search query match
    if (currentSearchQuery) {
      const q = currentSearchQuery;
      const matchName = doc.name.toLowerCase().includes(q) || doc.short.toLowerCase().includes(q);
      const matchDesc = doc.desc.toLowerCase().includes(q);
      const matchPurposes = doc.purposes.some(p => p.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchPurposes) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 24px;" class="card">
        <div style="width:54px;height:54px;border-radius:50%;background:#f1f5f9;display:grid;place-items:center;margin:0 auto 14px;color:var(--text-muted);font-size:1.4rem;">
          🔍
        </div>
        <h4 style="font-size:1.15rem;margin-bottom:6px;">Walang Natagpuang Dokumento</h4>
        <p class="muted" style="font-size: 0.95rem; max-width:440px; margin:0 auto;">Hindi tumutugma ang iyong paghahanap. Subukan ang ibang salita tulad ng "clearance", "residency", o "indigency".</p>
        <button class="btn btn-primary btn-sm" style="margin-top: 18px;" onclick="activeCategory='all'; currentSearchQuery=''; const inp = document.getElementById('heroSearchInput'); if(inp) inp.value=''; document.querySelectorAll('.filter-tab').forEach(t=>t.classList.toggle('active', t.dataset.category==='all')); renderDocsGrid();">
          I-reset ang Paghahanap
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(([key, doc]) => {
    const isFree = doc.fee.toLowerCase().includes('free');
    return `
      <div class="doc-card-premium" data-key="${key}">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
          <div class="doc-icon" style="background:${doc.color.replace('hsl', 'hsla').replace(')', ', 0.12)')};color:${doc.color};border:1px solid ${doc.color.replace('hsl', 'hsla').replace(')', ', 0.25)')}">
            ${BDRMS.ICONS[doc.icon]}
          </div>
          <span class="badge ${isFree ? 'badge-ready' : 'badge-neutral'} no-dot" style="font-size:0.78rem; font-weight:700; padding: 5px 12px;">
            ${isFree ? 'LIBRE / FREE' : doc.fee}
          </span>
        </div>

        <h3 style="font-size: 1.18rem; margin-bottom: 6px; color:var(--text);">${BDRMS.esc(doc.name)}</h3>
        <p style="color:var(--text-soft); font-size: 0.88rem; flex:1; line-height: 1.55; margin-bottom: 16px;">${BDRMS.esc(doc.desc)}</p>

        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom: 16px;">
          <span class="chip" style="font-size:0.73rem; background:#f1f5f9;">⏱ Proseso: <b>${doc.processing}</b></span>
          <span class="chip" style="font-size:0.73rem; background:#f1f5f9;">🏠 ${doc.residency ? '6 buwan residency' : 'Walang residency rule'}</span>
        </div>

        <div class="doc-meta" style="display:flex; justify-content:space-between; align-items:center; padding-top:14px; border-top:1px dashed var(--border);">
          <button type="button" class="btn btn-ghost btn-sm" onclick="event.stopPropagation(); showDocRequirementsModal('${key}')" style="font-size: 0.78rem; padding: 6px 12px;">
            Requirements
          </button>
          <span class="go" style="display:inline-flex; align-items:center; gap:6px; color:var(--primary); font-weight:700; font-size:0.86rem;">
            Mag-apply ${BDRMS.ICONS.arrowRight}
          </span>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.doc-card-premium').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.getAttribute('data-key');
      const cur = BDRMS.currentResident();
      if (cur) {
        // Logged in: go to dashboard to apply
        window.location.href = 'resident-dashboard.html?apply=' + key;
      } else {
        // Not logged in: redirect to login with hint
        window.location.href = 'resident-login.html?from=apply&doc=' + key;
      }
    });
  });
}

function showDocRequirementsModal(key) {
  const doc = BDRMS.DOC_TYPES[key];
  if (!doc) return;

  BDRMS.modal({
    title: doc.name,
    subtitle: `Opisyal na Impormasyon at Talaan ng mga Kailangan (Barangay Wawa)`,
    body: `
      <div style="display:grid; gap: 16px; font-size: 0.92rem; line-height: 1.6;">
        <p style="color:var(--text-soft);">${BDRMS.esc(doc.desc)}</p>

        <div style="padding: 14px 18px; border-radius: 12px; background: #f8fafc; border: 1px solid var(--border);">
          <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div><span class="muted" style="font-size:0.75rem; text-transform:uppercase; display:block;">Halaga ng Sertipiko</span><b>${doc.fee}</b></div>
            <div><span class="muted" style="font-size:0.75rem; text-transform:uppercase; display:block;">Tinatayang Oras ng Proseso</span><b>${doc.processing}</b></div>
            <div style="grid-column:span 2;"><span class="muted" style="font-size:0.75rem; text-transform:uppercase; display:block;">Residency Requirement</span><b>${doc.residency ? 'Kailangan ng hindi bababa sa anim (6) na buwang paninirahan sa Brgy. Wawa' : 'Walang residency requirement'}</b></div>
          </div>
        </div>

        <div>
          <h4 style="font-size: 0.95rem; margin-bottom: 8px; color:var(--text);">Mga Kinakailangang Dalhin (Requirements):</h4>
          <ul style="padding-left: 20px; display: grid; gap: 6px; color: var(--text-soft);">
            ${doc.requirements.map(r => `<li>${BDRMS.esc(r)}</li>`).join('')}
          </ul>
        </div>

        <div>
          <h4 style="font-size: 0.95rem; margin-bottom: 8px; color:var(--text);">Karaniwang Layunin (Stated Purpose):</h4>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            ${doc.purposes.map(p => `<span class="chip" style="font-size:0.76rem;">${BDRMS.esc(p)}</span>`).join('')}
          </div>
        </div>
      </div>
    `,
    foot: `
      <button class="btn btn-ghost" data-close>Isara</button>
      <button class="btn btn-primary" onclick="(function(){ const cur = BDRMS.currentResident(); if (cur) { window.location.href='resident-dashboard.html?apply=${key}'; } else { window.location.href='resident-login.html?from=apply&doc=${key}'; } document.querySelector('.modal-backdrop')?.remove(); })()">
        Mag-apply ng Dokumentong Ito
      </button>
    `,
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
  setupAutofillHandler();
  updateWizardUI();
}

function setupAutofillHandler() {
  const btn = document.getElementById('btnApplyAutofill');
  btn?.addEventListener('click', () => {
    const cur = BDRMS.currentResident();
    if (!cur) return;

    const setVal = (id, v) => { const el = document.getElementById(id); if (el && v) el.value = v; };
    setVal('fieldFirstName', cur.firstName);
    setVal('fieldLastName', cur.lastName);
    setVal('fieldMiddleName', cur.middleName);
    setVal('fieldSuffix', cur.suffix);
    setVal('fieldBirthdate', cur.birthdate);
    setVal('fieldSex', cur.sex);
    setVal('fieldCivilStatus', cur.civilStatus);
    setVal('fieldPurok', cur.purok);
    setVal('fieldContact', cur.contact);
    setVal('fieldEmail', cur.email);
    setVal('fieldResidentSince', cur.residentSince);

    // Trigger residency evaluation
    const sinceInput = document.getElementById('fieldResidentSince');
    if (sinceInput) sinceInput.dispatchEvent(new Event('change'));

    // Clear error highlights
    document.querySelectorAll('.field-error').forEach(el => el.innerText = '');
    document.querySelectorAll('.input.invalid, .select.invalid').forEach(el => el.classList.remove('invalid'));

    BDRMS.toast(`Matagumpay na na-autofill ang talaan ni ${cur.firstName}!`, 'success');
  });
}

function renderDocPicker() {
  const picker = document.getElementById('docPicker');
  if (!picker) return;

  picker.innerHTML = Object.entries(BDRMS.DOC_TYPES).map(([key, doc]) => `
    <div class="doc-option ${key === selectedDocKey ? 'selected' : ''}" data-key="${key}">
      <div class="doc-icon" style="background:${doc.color.replace('hsl', 'hsla').replace(')', ', 0.12)')};color:${doc.color};border:1px solid ${doc.color.replace('hsl', 'hsla').replace(')', ', 0.25)')}">
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
      <h4>${BDRMS.ICONS.info} Opisyal na Requirements para sa ${BDRMS.esc(doc.name)}:</h4>
      <ul>
        ${doc.requirements.map(r => `<li>${BDRMS.esc(r)}</li>`).join('')}
      </ul>
      <div class="req-foot">
        <span>⏱ Tinatayang proseso: <b>${doc.processing}</b></span>
        <span>💵 Halaga ng bayarin: <b>${doc.fee}</b></span>
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
  const customPurpose = document.getElementById('customPurposeContainer');

  if (purposeSelect && doc) {
    purposeSelect.innerHTML = doc.purposes.map(p => `<option value="${BDRMS.esc(p)}">${BDRMS.esc(p)}</option>`).join('');
    purposeSelect.onchange = () => {
      if (purposeSelect.value === 'Other' || purposeSelect.value === 'Iba pa') {
        customPurpose?.classList.remove('hidden');
      } else {
        customPurpose?.classList.add('hidden');
      }
    };
  }

  if (container) {
    if (doc.extra && doc.extra.length > 0) {
      container.innerHTML = `
        <div class="form-grid" style="margin-top: 14px;">
          ${doc.extra.map(f => `
            <div class="field span-2">
              <label for="extra_${f.key}">${BDRMS.esc(f.label)} ${f.required ? '<span class="req">*</span>' : ''}</label>
              <input type="text" id="extra_${f.key}" class="input" placeholder="${BDRMS.esc(f.placeholder)}" ${f.required ? 'required' : ''}>
              <span class="field-error" id="err_extra_${f.key}"></span>
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
    sel.innerHTML = `<option value="">Piliin ang iyong Purok</option>` +
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

  // Default to 1 year ago for ease
  if (!sinceInput.value) {
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() - 1);
    sinceInput.value = defaultDate.toISOString().slice(0, 10);
  }

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
      meter.innerHTML = `${BDRMS.ICONS.check} <b>Paninirahan sa Wawa: ${text}</b> — Pasok sa 6-month residency requirement ng Barangay Wawa.`;
    } else {
      meter.className = 'residency-meter warn';
      meter.innerHTML = `${BDRMS.ICONS.alert} <b>Paninirahan sa Wawa: ${text} (Kulang sa 6 na buwan)</b> — Paalala: Maaaring mangailangan ng karagdagang beripikasyon mula sa Kalihim ng Barangay.`;
    }
  }

  sinceInput.addEventListener('change', evalResidency);
  sinceInput.addEventListener('input', evalResidency);
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
  document.getElementById('btnPrintClaimStubBtn')?.addEventListener('click', () => {
    if (lastSubmittedRequest) {
      showClaimStubModal(lastSubmittedRequest);
    }
  });
}

function goToStep(step) {
  currentStep = step;
  updateWizardUI();
  const requestSection = document.getElementById('request');
  if (requestSection) {
    requestSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
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
  let valid = true;
  const validateField = (id, errId, msg) => {
    const el = document.getElementById(id);
    const err = document.getElementById(errId);
    if (!el || !el.value.trim()) {
      if (el) el.classList.add('invalid');
      if (err) err.innerText = msg;
      valid = false;
    } else {
      if (el) el.classList.remove('invalid');
      if (err) err.innerText = '';
    }
  };

  validateField('fieldFirstName', 'errFirstName', 'Pakilagay ang iyong Unang Pangalan (First Name).');
  validateField('fieldLastName', 'errLastName', 'Pakilagay ang iyong Apelyido (Last Name).');
  validateField('fieldBirthdate', 'errBirthdate', 'Pakipili ang iyong Araw ng Kapanganakan.');

  const contact = document.getElementById('fieldContact');
  const errContact = document.getElementById('errContact');
  if (!contact || !contact.value.trim()) {
    contact?.classList.add('invalid');
    if (errContact) errContact.innerText = 'Pakilagay ang iyong Numero ng Telepono / Mobile.';
    valid = false;
  } else {
    const cleanPhone = contact.value.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      contact.classList.add('invalid');
      if (errContact) errContact.innerText = 'Mangyaring ilagay ang wastong 11-digit mobile number (hal. 09171234567).';
      valid = false;
    } else {
      contact.classList.remove('invalid');
      if (errContact) errContact.innerText = '';
    }
  }

  const purok = document.getElementById('fieldPurok');
  if (!purok || !purok.value) {
    purok?.classList.add('invalid');
    valid = false;
  } else {
    purok.classList.remove('invalid');
  }

  const since = document.getElementById('fieldResidentSince');
  const errSince = document.getElementById('errResidentSince');
  if (!since || !since.value) {
    since?.classList.add('invalid');
    if (errSince) errSince.innerText = 'Pakilagay kung kailan ka pa naninirahan sa Barangay Wawa.';
    valid = false;
  } else {
    since.classList.remove('invalid');
    if (errSince) errSince.innerText = '';
  }

  if (!valid) {
    BDRMS.toast('Pakipunan ang lahat ng kinakailangang personal na impormasyon.', 'error');
  }
  return valid;
}

function validateStep3() {
  let valid = true;
  const idNumber = document.getElementById('fieldIdNumber');
  const errIdNumber = document.getElementById('errIdNumber');

  if (!idNumber || !idNumber.value.trim()) {
    idNumber?.classList.add('invalid');
    if (errIdNumber) errIdNumber.innerText = 'Pakilagay ang numero ng iyong ID.';
    valid = false;
  } else {
    idNumber.classList.remove('invalid');
    if (errIdNumber) errIdNumber.innerText = '';
  }

  // Check extra required fields if any
  const doc = BDRMS.DOC_TYPES[selectedDocKey];
  if (doc && doc.extra) {
    doc.extra.forEach(f => {
      if (f.required) {
        const inp = document.getElementById(`extra_${f.key}`);
        const err = document.getElementById(`err_extra_${f.key}`);
        if (!inp || !inp.value.trim()) {
          inp?.classList.add('invalid');
          if (err) err.innerText = `Kinakailangan ang impormasyong ito para sa ${doc.short}.`;
          valid = false;
        } else {
          inp.classList.remove('invalid');
          if (err) err.innerText = '';
        }
      }
    });
  }

  if (!valid) {
    BDRMS.toast('Pakikumpleto ang numero ng ID at karagdagang detalye ng dokumento.', 'error');
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

  let chosenPurpose = document.getElementById('fieldPurpose')?.value || '';
  if (chosenPurpose === 'Other' || chosenPurpose === 'Iba pa') {
    const cust = document.getElementById('fieldCustomPurpose')?.value.trim();
    if (cust) chosenPurpose = `${chosenPurpose} (${cust})`;
  }

  summaryBox.innerHTML = `
    <div class="review-grid">
      <div class="span-2" style="background:#f0fdf4; border-bottom: 1px solid var(--border);">
        <dt>Dokumentong Hinihiling</dt>
        <dd style="color:var(--primary); font-size:1.15rem;"><b>${BDRMS.esc(doc.name)}</b> <span class="badge ${doc.fee.includes('Free') ? 'badge-ready' : 'badge-verification'}" style="margin-left:8px;">${doc.fee}</span></dd>
      </div>
      <div>
        <dt>Pangalan ng Aplikante</dt>
        <dd>${BDRMS.esc(BDRMS.fullName(applicant))}</dd>
      </div>
      <div>
        <dt>Tirahan / Purok</dt>
        <dd>${BDRMS.esc(applicant.purok)}, Barangay Wawa</dd>
      </div>
      <div>
        <dt>Mobile Number</dt>
        <dd>${BDRMS.esc(applicant.contact)}</dd>
      </div>
      <div>
        <dt>Tagal ng Paninirahan sa Wawa</dt>
        <dd>${BDRMS.residencyText(applicant.residentSince)} ${isResidencyOk ? '<span class="badge badge-ready no-dot" style="margin-left:4px;">Kuwalipikado</span>' : '<span class="badge badge-verification no-dot" style="margin-left:4px;">Kulang sa 6 mos</span>'}</dd>
      </div>
      <div>
        <dt>Ipakikitang Valid ID</dt>
        <dd>${BDRMS.esc(document.getElementById('fieldIdType').value)}</dd>
      </div>
      <div>
        <dt>Huling 4 na Numero ng ID</dt>
        <dd class="mono">•••• ${BDRMS.esc(document.getElementById('fieldIdNumber').value.slice(-4))}</dd>
      </div>
      <div class="span-2">
        <dt>Tiyak na Layunin (Purpose)</dt>
        <dd>${BDRMS.esc(chosenPurpose)}</dd>
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

let lastSubmittedRequest = null;

function handleSubmitRequest() {
  const privacyCheck = document.getElementById('agreePrivacy');
  const errPrivacy = document.getElementById('errPrivacy');
  if (!privacyCheck || !privacyCheck.checked) {
    if (errPrivacy) errPrivacy.innerText = 'Mangyaring lagyan ng tsek ang kahon ng pagsang-ayon sa Data Privacy bago mag-submit.';
    BDRMS.toast('Mangyaring sumang-ayon sa Data Privacy bago magpatuloy.', 'error');
    return;
  }
  if (errPrivacy) errPrivacy.innerText = '';

  const submitBtn = document.getElementById('btnSubmitRequest');
  const originalHtml = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin" style="width:18px;height:18px;animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
    Ipinapadala ang Request...
  `;

  setTimeout(() => {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHtml;

    const applicant = getApplicantFormData();
    const idType = document.getElementById('fieldIdType').value;
    const idNumber = document.getElementById('fieldIdNumber').value;
    let purpose = document.getElementById('fieldPurpose').value;
    if (purpose === 'Other' || purpose === 'Iba pa') {
      const cust = document.getElementById('fieldCustomPurpose')?.value.trim();
      if (cust) purpose = `${purpose}: ${cust}`;
    }
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

    lastSubmittedRequest = newReq;

    // Save to device history
    BDRMS.addDeviceRef(newReq.ref, applicant.lastName);
    renderDeviceRefs();

    // Show Success View
    showSuccessStep(newReq);
    BDRMS.toast(`Matagumpay na naipadala ang iyong request! Reference: ${newReq.ref}`, 'success');
  }, 450);
}

function showSuccessStep(req) {
  document.querySelectorAll('.wiz-panel').forEach(p => p.classList.remove('active'));
  const successPanel = document.getElementById('wizSuccess');
  if (!successPanel) return;

  successPanel.classList.add('active');
  document.getElementById('successRefCode').innerText = req.ref;
  document.getElementById('successDocName').innerText = BDRMS.DOC_TYPES[req.docType].name;
  document.getElementById('successApplicant').innerText = BDRMS.fullName(req.applicant);

  // Render authentic simulated QR Code SVG
  const qrContainer = document.getElementById('successQrContainer');
  if (qrContainer) {
    qrContainer.innerHTML = BDRMS.generateQRCodeSVG(`BDRMS:${req.ref}:${req.applicant.lastName}`, 100);
  }

  // Copy ref button
  document.getElementById('btnCopyRef').onclick = () => {
    navigator.clipboard.writeText(req.ref).then(() => {
      BDRMS.toast('Na-kopya na ang Reference Number sa clipboard!');
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
        BDRMS.toast('Pakilagay pareho ang Reference Number at Apelyido ng aplikante.', 'error');
        return;
      }
      lookupRequest(ref, lastName);
    });
  }

  // Quick Demo Reference Chips Click Handler
  document.querySelectorAll('.quick-ref-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const ref = chip.getAttribute('data-ref');
      const lastName = chip.getAttribute('data-lastname');
      const refInput = document.getElementById('trackRef');
      const lastNameInput = document.getElementById('trackLastName');
      if (refInput && ref) refInput.value = ref;
      if (lastNameInput && lastName) lastNameInput.value = lastName;
      if (ref && lastName) {
        lookupRequest(ref, lastName);
        document.getElementById('trackResult')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });
}

function lookupRequest(ref, lastName) {
  const resultContainer = document.getElementById('trackResult');
  if (!resultContainer) return;

  const req = BDRMS.trackRequest(ref, lastName);
  if (!req) {
    resultContainer.classList.remove('hidden');
    resultContainer.innerHTML = `
      <div style="text-align:center; padding: 40px 20px;">
        <div style="width:54px; height:54px; border-radius:50%; background:#fef2f2; color:#dc2626; display:grid; place-items:center; margin:0 auto 16px;">
          ${BDRMS.ICONS.alert}
        </div>
        <h4 style="font-size: 1.2rem; margin-bottom: 6px;">Walang Natagpuang Dokumento</h4>
        <p class="muted" style="max-width: 480px; margin: 0 auto;">Pakisuri kung tama ang iyong Reference Number (hal. <code>BW-2610-K7QM</code>) at kung tumutugma ang Apelyido sa rekord ng aplikante.</p>
        <p style="font-size: 0.85rem; margin-top: 14px; color: var(--text-soft);">
          Kung kailangan ng tulong, maaari kang magsadya sa Barangay Hall ng Barangay Wawa o tumawag sa tanggapan ng Kalihim.
        </p>
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
          <span class="chip" style="font-size:0.75rem;">${req.channel} Request</span>
        </div>
        <h3 style="font-size: 1.4rem;">${BDRMS.esc(doc.name)}</h3>
        <p class="muted" style="font-size:0.88rem;">Reference Code: <b class="mono" style="color:var(--primary); font-size:1rem;">${req.ref}</b> • Aplikante: <b>${BDRMS.esc(BDRMS.fullName(req.applicant))}</b></p>
        
        <div style="display:flex; align-items:center; gap:12px; margin-top:10px; font-size:0.86rem; flex-wrap:wrap;">
          <span>Halaga: <b>${doc.fee}</b></span>
          <span>•</span>
          <span>Katayuan ng Bayad: <b class="badge ${req.paymentStatus === 'Paid' ? 'badge-released' : (req.paymentStatus === 'Exempt' ? 'badge-submitted' : 'badge-verification')}">${req.paymentStatus || 'Unpaid'}</b> ${req.orNumber ? `(O.R. #${BDRMS.esc(req.orNumber)})` : ''}</span>
        </div>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" id="btnTrackPrintStub">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
            <path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
          </svg>
          I-print ang Claim Stub
        </button>
        ${isApproved ? `
          <button class="btn btn-primary btn-sm" id="btnResidentPrintCert">
            ${BDRMS.ICONS.printer} Tingnan ang Opisyal na Sertipiko
          </button>
        ` : ''}
      </div>
    </div>

    ${req.status === 'Ready for Pickup' ? `
      <div style="margin: 18px 0; padding: 16px; border-radius: 12px; background: #ecfdf5; border: 1px solid #a7f3d0; font-size: 0.88rem; color: #065f46; display: flex; gap: 12px; align-items: flex-start;">
        <div style="font-size: 1.4rem; line-height: 1;">📱</div>
        <div>
          <b>Abiso para sa Residente:</b><br>
          Ang iyong <b>${BDRMS.esc(doc.name)}</b> ay <b>HANDA NANG KUNIN</b> sa Barangay Hall ng Wawa. Dalhin ang iyong orihinal na <b>${BDRMS.esc(req.idType)}</b> at saktong halaga na <b>${doc.fee}</b>.
        </div>
      </div>
    ` : ''}

    ${req.status === 'Rejected' ? `
      <div style="margin: 18px 0; padding: 16px; border-radius: 12px; background: #fef2f2; border: 1px solid #fecaca; font-size: 0.88rem; color: #991b1b;">
        <b>Dahilan ng Pagbabalik / Hindi Pag-apruba:</b> ${BDRMS.esc(req.remarks || 'Kulang sa mga kinakailangang dokumento.')}<br>
        <span style="font-size: 0.82rem; margin-top: 4px; display: block;">Maaari kang magpasa muli ng aplikasyon kasama ang kumpletong requirements o pumunta sa Barangay Hall.</span>
      </div>
    ` : ''}

    <!-- 5-Stage Stepper Timeline -->
    <div class="timeline" style="margin-top: 24px;">
      ${renderTimelineSteps(req)}
    </div>

    <div style="margin-top: 26px; padding: 16px 20px; border-radius: 12px; background: #f8fafc; border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
      <div>
        <strong style="display:block; font-size: 0.9rem;">Paalala sa Pag-claim:</strong>
        <span style="font-size: 0.82rem; color: var(--text-muted);">Dalhin ang orihinal na <b>${BDRMS.esc(req.idType)}</b> at ipakita ang iyong Reference Code sa kawani ng Barangay.</span>
      </div>
      <div style="font-size: 0.84rem; color: var(--text-soft);">
        Oras ng Barangay Hall: <b>Lunes – Biyernes, 8:00 AM – 5:00 PM</b>
      </div>
    </div>
  `;

  document.getElementById('btnTrackPrintStub')?.addEventListener('click', () => {
    showClaimStubModal(req);
  });

  if (isApproved) {
    document.getElementById('btnResidentPrintCert')?.addEventListener('click', () => {
      showPrintModal(req);
    });
  }
}

function renderTimelineSteps(req) {
  const steps = [
    { name: 'Submitted', label: '1. Naipasa ang Request', desc: 'Matagumpay na natanggap sa talaan ng Barangay Wawa.' },
    { name: 'Under Verification', label: '2. Beripikasyon ng Kalihim', desc: 'Sinusuri ng Kalihim ang pagkakakilanlan at 6-month residency requirement.' },
    { name: 'For Approval', label: '3. Pagsusuri at Pag-apruba', desc: 'Nasa Punong Barangay at pamunuan para sa pinal na lagda at tuyong selyo.' },
    { name: 'Ready for Pickup', label: '4. Handa nang Kunin', desc: 'Nakahanda na ang opisyal na sertipiko sa Barangay Hall.' },
    { name: 'Released', label: '5. Na-release na sa Residente', desc: 'Opisyal na nakuha at nalagdaan ng aplikante.' },
  ];

  if (req.status === 'Rejected') {
    return `
      <div class="tl-item done">
        <div class="tl-dot">${BDRMS.ICONS.check}</div>
        <div class="tl-body">
          <strong>Naipasa ang Request</strong>
          <span>${BDRMS.fmtDateTime(req.createdAt)}</span>
        </div>
      </div>
      <div class="tl-item rejected">
        <div class="tl-dot">${BDRMS.ICONS.x}</div>
        <div class="tl-body">
          <strong style="color:var(--danger);">Ibinabalik / Hindi Naaprubahan</strong>
          <span>${BDRMS.fmtDateTime(req.updatedAt)}</span>
          <p style="color:var(--danger);">${BDRMS.esc(req.remarks || 'Mangyaring makipag-ugnayan sa Barangay Hall.')}</p>
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
          <strong>${step.label} ${state === 'current' ? '<span class="badge badge-submitted no-dot" style="margin-left:8px; font-size:0.7rem;">Kasalukuyang Ginagawa</span>' : ''}</strong>
          <span>${hist ? `${BDRMS.fmtDateTime(hist.at)} • ni ${hist.by}` : step.desc}</span>
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
    container.innerHTML = '<span class="muted" style="font-size:0.8rem;">Wala pang kamakailang hinanap sa device na ito.</span>';
    return;
  }

  container.innerHTML = refs.map(r => `
    <button type="button" class="chip" data-ref="${r.ref}" data-lastname="${BDRMS.esc(r.lastName)}">
      ${r.ref} (${BDRMS.esc(r.lastName)})
    </button>
  `).join('');

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

/* ---------- Printable Claim Stub Modal ---------- */
function showClaimStubModal(req) {
  const doc = BDRMS.DOC_TYPES[req.docType];
  const qrSvg = BDRMS.generateQRCodeSVG(`BDRMS:${req.ref}:${req.applicant.lastName}`, 120);

  BDRMS.modal({
    title: 'Opisyal na Claim Stub / Resibo ng Aplikasyon',
    subtitle: `Barangay Wawa, Abra de Ilog, Occidental Mindoro`,
    body: `
      <div style="border: 2px dashed #94a3b8; border-radius: 14px; padding: 26px; background: #ffffff; color: #0f172a; max-width: 580px; margin: 0 auto; font-family: var(--font-body);">
        <div style="text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 18px;">
          <h3 style="font-size: 1.3rem; margin-bottom: 2px;">BARANGAY WAWA</h3>
          <p style="font-size: 0.84rem; color: #475569;">Bayan ng Abra de Ilog, Lalawigan ng Occidental Mindoro</p>
          <h4 style="font-size: 1rem; margin-top: 6px; letter-spacing: 0.06em; text-transform: uppercase; color: #059669;">
            KATIBAYAN SA PAGHINGI NG DOKUMENTO (CLAIM STUB)
          </h4>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; margin-bottom: 20px;">
          <div>
            <span style="font-size: 0.74rem; text-transform: uppercase; color: #64748b; font-weight: 600;">Reference Code:</span>
            <div class="mono" style="font-size: 1.5rem; font-weight: 800; color: #059669;">${req.ref}</div>
            <span style="font-size: 0.8rem; color: #64748b;">Petsa: ${BDRMS.fmtDateTime(req.createdAt)}</span>
          </div>
          <div>
            ${qrSvg}
          </div>
        </div>

        <div style="display: grid; gap: 8px; font-size: 0.9rem; padding: 14px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
          <div><b>Aplikante:</b> ${BDRMS.esc(BDRMS.fullName(req.applicant))}</div>
          <div><b>Tirahan / Purok:</b> ${BDRMS.esc(req.applicant.purok)}, Barangay Wawa</div>
          <div><b>Dokumento:</b> ${BDRMS.esc(doc.name)}</div>
          <div><b>Layunin:</b> ${BDRMS.esc(req.purpose)}</div>
          <div><b>Ipakikitang ID:</b> ${BDRMS.esc(req.idType)}</div>
          <div><b>Opisyal na Bayad:</b> ${doc.fee} (${req.paymentStatus || 'Unpaid'})</div>
        </div>

        <div style="margin-top: 18px; font-size: 0.82rem; color: #475569; line-height: 1.5; border-top: 1px dashed #cbd5e1; padding-top: 14px;">
          <b>Mga Tagubilin sa Pagkuha:</b><br>
          1. Dalhin ang orihinal na ID at ang Claim Stub na ito (o ipakita sa cellphone).<br>
          2. Magbayad ng saktong halaga sa Tanggapan ng Ingat-Yaman kung may bayad ang dokumento.<br>
          3. Tanggapan ng Barangay Hall: Lunes hanggang Biyernes, 8:00 AM – 5:00 PM.
        </div>
      </div>
    `,
    foot: `
      <button class="btn btn-ghost" data-close>Isara</button>
      <button class="btn btn-primary" onclick="window.print()">
        ${BDRMS.ICONS.printer} I-print ang Claim Stub
      </button>
    `,
  });
}

/* ---------- Official Certificate Print Modal ---------- */
function showPrintModal(req) {
  BDRMS.modal({
    title: 'Opisyal na Sertipiko — Barangay Wawa',
    subtitle: `${BDRMS.DOC_TYPES[req.docType].name} (Para sa Pag-print)`,
    wide: true,
    body: BDRMS.certificateHTML(req),
    foot: `
      <button class="btn btn-ghost" data-close>Isara</button>
      <button class="btn btn-primary" onclick="window.print()">
        ${BDRMS.ICONS.printer} I-print ang Opisyal na Sertipiko
      </button>
    `,
  });
}

/* ---------- Academic Project Proposal Information Modal ---------- */
function showProposalModal() {
  BDRMS.modal({
    title: 'Laboratory Activity 1 – Part 1: Project Proposal',
    subtitle: 'Barangay Document and Records Management System (BDRMS)',
    wide: true,
    body: `
      <div style="font-size: 0.9rem; line-height: 1.6; display: grid; gap: 20px;">
        <div style="padding: 16px; border-radius: 12px; background: #f8fafc; border: 1px solid var(--border);">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
            <div><strong style="color:var(--primary);">Pangkat:</strong> Group 1E<br>Joshua Dela Rosa<br>Angela Espinosa<br>Nicole Guevarra<br>Era May Roxas</div>
            <div><strong style="color:var(--primary);">Asignatura:</strong> Midterm Project<br><strong style="color:var(--primary);">Petsa:</strong> August 16, 2026</div>
            <div><strong style="color:var(--primary);">Lugar ng Pag-aaral:</strong><br>Barangay Wawa, Abra de Ilog, Occidental Mindoro</div>
          </div>
        </div>

        <div>
          <h4 style="color:var(--primary-strong); margin-bottom: 6px;">1. Ang Suliraning Naobserbahan sa Komunidad</h4>
          <p class="muted">Ang mga residenteng nangangailangan ng Barangay Indigency, Barangay Clearance, Certificate of Residency, Certificate for Bilihan, First Time Job Seeker Certificate, Barangay ID, at Certificate to File Action ay kailangang magtungo nang personal, pumila nang matagal, at maghintay sa mano-manong pagsusuri sa lumang papel na talaan. Nagdudulot ito ng pagkaantala para sa mga residente at mabigat na pasanin para sa kawani ng barangay.</p>
        </div>

        <div>
          <h4 style="color:var(--primary-strong); margin-bottom: 6px;">2. Ebidensya at Panayam sa Field (August 16, 2026)</h4>
          <ul class="muted" style="padding-left: 20px; display: grid; gap: 6px;">
            <li><b>Obserbasyon sa Hall:</b> Ang pagsusuri ng pagkakakilanlan at 6-month residency requirement ay ginagawa nang mano-mano.</li>
            <li><b>Panayam sa Residente:</b> Nais ng mga residente ang online portal upang makapagpasa nang maaga at makita ang status.</li>
            <li><b>Panayam sa Kalihim (Sec. Lorna Fernandez):</b> Kailangang istriktong maipatupad ang 6-month residency rule alinsunod sa batas.</li>
            <li><b>Panayam sa Opisyal:</b> Hindi lahat ng residente ay may internet access, kaya dapat may walk-in encoder module para sa mga senior citizen at walang smartphone habang pinangangalagaan ang Data Privacy (RA 10173).</li>
          </ul>
        </div>

        <div>
          <h4 style="color:var(--primary-strong); margin-bottom: 6px;">3. Solusyong Ipinatupad sa Sistemang Ito</h4>
          <p class="muted">Isang kumpleto at hybrid na solusyon: (a) Online portal para sa mga residente para sa 24/7 submission at real-time tracking, at (b) Staff Portal na may Walk-In Encoder, verification stepper, resident registry, audit trail, at automated generation ng opisyal na sertipiko.</p>
        </div>
      </div>
    `,
    foot: `<button class="btn btn-primary" data-close>Naintindihan</button>`,
  });
}
