function showFeedback(form, message = '', tone = 'error') {
  const feedback = form.querySelector('.auth-feedback');
  feedback.dataset.tone = tone;
  feedback.hidden = !message;
  feedback.textContent = message;
}

function setPasswordVisibility(button, visible) {
  const input = document.getElementById(button.getAttribute('aria-controls'));
  input.type = visible ? 'text' : 'password';
  button.setAttribute('aria-pressed', String(visible));
  button.setAttribute('aria-label', visible ? 'Itago ang password' : 'Ipakita ang password');
  button.innerHTML = visible ? BDRMS.ICONS.eyeOff : BDRMS.ICONS.eye;
  button.firstElementChild.setAttribute('aria-hidden', 'true');
}

function prepareLoginForm(form) {
  form.addEventListener('input', () => showFeedback(form));
  document.querySelectorAll('[data-demo-id]').forEach((button) => {
    button.addEventListener('click', () => {
      form.elements.username.value = button.dataset.demoId;
      form.elements.password.value = button.dataset.demoPassword;
      setPasswordVisibility(form.querySelector('[data-password-toggle]'), false);
      showFeedback(form);
      button.closest('details').open = false;
      form.querySelector('[type="submit"]').focus();
    });
  });
}

function initStaffLogin(form) {
  const role = form.dataset.staffRole;
  const dashboard = role + '.html';
  if (BDRMS.currentUser()?.role === role) {
    window.location.replace(dashboard);
    return;
  }

  prepareLoginForm(form);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const user = BDRMS.login(form.elements.username.value, form.elements.password.value, role);
    if (user) {
      window.location.replace(dashboard);
    } else {
      showFeedback(form, 'Pakisuri ang username at password para sa portal na ito.');
    }
  });
}

function initResidentLogin(form) {
  const params = new URLSearchParams(window.location.search);
  const requestedDoc = params.get('doc');
  const docKey = params.get('from') === 'apply' && Object.hasOwn(BDRMS.DOC_TYPES, requestedDoc) ? requestedDoc : '';
  const dashboard = docKey ? 'resident-dashboard.html?apply=' + encodeURIComponent(docKey) : 'resident-dashboard.html';
  if (BDRMS.currentResident()) {
    window.location.replace(dashboard);
    return;
  }

  if (docKey) {
    const notice = document.getElementById('applyNotice');
    notice.textContent = 'Mag-login para mag-apply ng ' + BDRMS.DOC_TYPES[docKey].name + '.';
    notice.hidden = false;
  }

  prepareLoginForm(form);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = BDRMS.loginResident(form.elements.username.value, form.elements.password.value);
    if (result.success) {
      window.location.replace(dashboard);
    } else {
      showFeedback(form, result.message, result.pending ? 'notice' : 'error');
    }
  });

  const loginButton = document.getElementById('tabLoginBtn');
  const registerButton = document.getElementById('tabRegisterBtn');
  const loginPane = document.getElementById('paneLogin');
  const registerPane = document.getElementById('paneRegister');

  function showRegistration(register) {
    loginPane.hidden = register;
    registerPane.hidden = !register;
    loginButton.setAttribute('aria-pressed', String(!register));
    registerButton.setAttribute('aria-pressed', String(register));
  }

  loginButton.addEventListener('click', () => showRegistration(false));
  registerButton.addEventListener('click', () => showRegistration(true));
  showRegistration(window.location.hash === '#register');

  const registerForm = document.getElementById('residentRegisterForm');
  const birthdate = registerForm.elements.birthdate;
  const since = registerForm.elements.residentSince;
  const date = new Date();
  const today = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, '0')).join('-');
  birthdate.max = today;
  since.max = today;

  const purok = registerForm.elements.purok;
  BDRMS.PUROKS.forEach((name) => purok.add(new Option(name, name)));
  const meter = document.getElementById('regResidencyMeter');
  since.addEventListener('change', () => {
    meter.hidden = !since.value || !since.validity.valid;
    if (meter.hidden) return;
    const eligible = BDRMS.monthsBetween(since.value) >= BDRMS.RESIDENCY_MONTHS;
    meter.textContent = eligible ? 'Umabot na sa 6 na buwan ang iyong paninirahan.' :
      'May mga dokumentong nangangailangan ng 6 na buwang paninirahan.';
  });

  registerForm.addEventListener('input', () => showFeedback(registerForm));
  registerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    let resident;
    try {
      resident = BDRMS.registerResidentOnline(Object.fromEntries(new FormData(registerForm)));
    } catch (error) {
      showFeedback(registerForm, error.message);
      return;
    }
    registerForm.reset();
    setPasswordVisibility(registerForm.querySelector('[data-password-toggle]'), false);
    meter.hidden = true;
    showRegistration(false);
    form.elements.username.value = resident.username;
    form.elements.password.value = '';
    setPasswordVisibility(form.querySelector('[data-password-toggle]'), false);
    form.elements.username.focus();
    showFeedback(form, 'Naisumite ang pagpapatala. Maghintay ng pag-apruba ng Kalihim bago mag-login.', 'success');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-password-toggle]').forEach((button) => {
    setPasswordVisibility(button, false);
    button.addEventListener('click', () => setPasswordVisibility(button, button.getAttribute('aria-pressed') !== 'true'));
  });
  const staffForm = document.querySelector('[data-staff-role]');
  if (staffForm) initStaffLogin(staffForm);
  else initResidentLogin(document.getElementById('residentLoginForm'));
});
