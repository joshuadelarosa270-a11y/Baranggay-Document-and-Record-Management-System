const BDRMSUI = (() => {
  const pagers = new Map();

  function mountPagination(id, pageSize, render) {
    const element = document.getElementById(id);
    const state = { page: 1, pageSize, totalPages: 1, element };
    pagers.set(id, state);
    element.querySelectorAll('[data-page-step]').forEach(button => {
      button.addEventListener('click', () => {
        const next = state.page + Number(button.dataset.pageStep);
        if (next < 1 || next > state.totalPages) return;
        state.page = next;
        render();
        if (button.disabled) element.querySelector('[data-page-step]:not(:disabled)')?.focus();
      });
    });
  }

  function page(id, items) {
    const state = pagers.get(id);
    const { element, pageSize } = state;
    state.totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    state.page = Math.min(state.page, state.totalPages);
    const start = (state.page - 1) * pageSize;
    const end = Math.min(start + pageSize, items.length);
    element.hidden = items.length === 0;
    element.querySelector('[data-page-range]').textContent = items.length ? `${start + 1}–${end} sa ${items.length}` : '';
    element.querySelector('[data-page-controls]').hidden = state.totalPages === 1;
    element.querySelector('[data-page-position]').textContent = `${state.page} / ${state.totalPages}`;
    element.querySelector('[data-page-step="-1"]').disabled = state.page === 1;
    element.querySelector('[data-page-step="1"]').disabled = state.page === state.totalPages;
    return items.slice(start, end);
  }

  function resetPage(id) {
    pagers.get(id).page = 1;
  }

  function mountStaffNavigation(app, onChange) {
    const toggle = app.querySelector('.menu-toggle');
    const sidebar = app.querySelector('.admin-sidebar');
    const closeButton = sidebar.querySelector('.sidebar-close');
    const scrim = app.querySelector('.sidebar-scrim');
    const main = app.querySelector('.admin-main');
    const heading = app.querySelector('.topbar-title h1');
    const menu = Array.from(sidebar.querySelectorAll('[data-tab]'));
    const panes = app.querySelectorAll('.tab-pane');
    const mobile = window.matchMedia('(max-width: 1024px)');
    toggle.innerHTML = BDRMS.ICONS.menu;
    closeButton.innerHTML = BDRMS.ICONS.x;

    function syncSidebar(open = false) {
      sidebar.classList.toggle('open', open);
      sidebar.inert = mobile.matches && !open;
      main.inert = open;
      scrim.hidden = !open;
      toggle.setAttribute('aria-expanded', String(mobile.matches ? open : !app.classList.contains('sidebar-collapsed')));
    }

    function closeDrawer() {
      syncSidebar();
      toggle.focus();
    }

    toggle.addEventListener('click', () => {
      if (mobile.matches) {
        if (sidebar.classList.contains('open')) closeDrawer();
        else {
          syncSidebar(true);
          sidebar.querySelector('[aria-current="page"]').focus();
        }
      } else {
        app.classList.toggle('sidebar-collapsed');
        syncSidebar();
      }
    });
    scrim.addEventListener('click', closeDrawer);
    closeButton.addEventListener('click', closeDrawer);
    mobile.addEventListener('change', () => syncSidebar());
    app.addEventListener('keydown', event => {
      if (event.key === 'Escape' && sidebar.classList.contains('open')) closeDrawer();
    });

    menu.forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.tab;
      menu.forEach(item => {
        const selected = item === button;
        item.classList.toggle('active', selected);
        if (selected) item.setAttribute('aria-current', 'page');
        else item.removeAttribute('aria-current');
      });
      panes.forEach(pane => pane.classList.toggle('active', pane.id === id));
      heading.textContent = button.title;
      main.scrollTop = 0;
      if (sidebar.classList.contains('open')) closeDrawer();
      onChange(id);
    }));
    syncSidebar();
  }

  function bindRequestFilters(render) {
    const update = () => {
      resetPage('requestsPager');
      render();
    };
    document.getElementById('tableSearch').addEventListener('input', update);
    ['filterDocType', 'filterStatus', 'filterChannel'].forEach(id => {
      document.getElementById(id).addEventListener('change', update);
    });
  }

  function matchesResidentSearch(resident, query) {
    return [BDRMS.fullName(resident), resident.username, resident.purok, resident.contact]
      .some(value => String(value || '').toLowerCase().includes(query));
  }

  function residentDetails(resident, foot = '', onMount) {
    const fields = [
      ['Username', resident.username],
      ['Purok', resident.purok],
      ['Mobile number', resident.contact],
      ['Petsa ng kapanganakan', BDRMS.fmtDate(resident.birthdate)],
      ['Simula ng paninirahan', BDRMS.fmtDate(resident.residentSince)],
      ['Uri ng ID', resident.idType],
      ['Remarks', resident.remarks],
    ];
    return BDRMS.modal({
      title: BDRMS.esc(BDRMS.fullName(resident)),
      body: '<dl class="kv-list">' + fields.map(([label, value]) => `
        <div class="kv-row"><dt>${label}</dt><dd>${BDRMS.esc(value || '—')}</dd></div>
      `).join('') + '</dl>',
      foot: foot || '<button class="btn btn-ghost" data-close>Isara</button>',
      onMount,
    });
  }

  function requestText({ title, label, confirmText, multiline = false, danger = false, onSubmit }) {
    const control = multiline
      ? '<textarea class="textarea" name="value" id="dialogTextValue" required></textarea>'
      : '<input type="text" class="input" name="value" id="dialogTextValue" required>';
    BDRMS.modal({
      title,
      body: '<form id="dialogTextForm"><div class="field"><label for="dialogTextValue">' + BDRMS.esc(label) + '</label>' + control + '</div></form>',
      foot: `<button type="button" class="btn btn-ghost" data-close>Kanselahin</button>
        <button type="submit" form="dialogTextForm" class="btn ${danger ? 'btn-danger' : 'btn-primary'}">${BDRMS.esc(confirmText)}</button>`,
      onMount(dialog, close) {
        const form = dialog.querySelector('form');
        const input = form.elements.value;
        input.addEventListener('input', () => input.setCustomValidity(''));
        form.addEventListener('submit', event => {
          event.preventDefault();
          const value = input.value.trim();
          if (!value) {
            input.setCustomValidity('Kailangan ang field na ito.');
            input.reportValidity();
            return;
          }
          close();
          onSubmit(value);
        });
      },
    });
  }

  function renderRequests(actionLabel, action, emphasized = false) {
    const readFilter = id => document.getElementById(id).value;
    const query = readFilter('tableSearch').trim().toLowerCase();
    const type = readFilter('filterDocType');
    const status = readFilter('filterStatus');
    const channel = readFilter('filterChannel');
    const requests = BDRMS.data().requests.filter(req => {
      return (type === 'all' || req.docType === type) &&
        (status === 'all' || req.status === status) &&
        (channel === 'all' || req.channel === channel) &&
        (!query || [req.ref, BDRMS.fullName(req.applicant), req.applicant.purok, req.purpose]
          .some(value => String(value || '').toLowerCase().includes(query)));
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const tbody = document.getElementById('requestsTableBody');
    const visible = page('requestsPager', requests);
    if (!visible.length) {
      tbody.innerHTML = '<tr role="row"><td role="cell" colspan="5" class="table-empty">Walang nahanap na request.</td></tr>';
      return;
    }

    tbody.innerHTML = visible.map(req => `
      <tr role="row">
        <td role="cell" data-label="Dokumento">
          <strong>${BDRMS.esc(BDRMS.DOC_TYPES[req.docType]?.short || req.docType)}</strong>
          <span class="row-detail mono">${BDRMS.esc(req.ref)}</span>
        </td>
        <td role="cell" data-label="Aplikante">
          <strong>${BDRMS.esc(BDRMS.fullName(req.applicant))}</strong>
          <span class="row-detail">${BDRMS.esc(req.applicant.purok || '—')}</span>
        </td>
        <td role="cell" data-label="Katayuan">${BDRMS.statusBadge(req.status)}</td>
        <td role="cell" data-label="Isinumite">
          <span>${BDRMS.fmtDate(req.createdAt)}</span>
          <span class="row-detail">${BDRMS.esc(req.channel || '—')}</span>
        </td>
        <td role="cell" class="row-action">
          <button type="button" class="btn ${emphasized ? 'btn-primary' : 'btn-ghost'} btn-sm" data-request-id="${BDRMS.esc(req.id)}">${actionLabel}</button>
        </td>
      </tr>
    `).join('');
    tbody.onclick = event => {
      const button = event.target.closest('[data-request-id]');
      if (button) action(button.dataset.requestId);
    };
  }

  return { mountPagination, page, resetPage, mountStaffNavigation, bindRequestFilters, matchesResidentSearch, residentDetails, requestText, renderRequests };
})();
