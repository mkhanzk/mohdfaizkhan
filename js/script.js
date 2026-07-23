(function () {
  'use strict';

  const STORAGE_KEY = 'faiz_portfolio_custom_projects_v1';
  const THEME_KEY = 'faiz_portfolio_theme';
  const OWNER_SESSION_KEY = 'faiz_owner_authed';
  // SHA-256 hash of the owner access code. Never store the plain password here.
  const OWNER_HASH = '4e7ce45771e596315605af08708dce86fe7d4e28b180a291cbb428d60d4ee910';

  let seedProjects = [];
  let customProjects = loadCustomProjects();
  let allProjects = [];
  let isOwner = sessionStorage.getItem(OWNER_SESSION_KEY) === '1';

  const state = { difficulty: 'all', tool: 'all', business: 'all', search: '' };

  const grid = document.getElementById('projectsGrid');
  const resultsCount = document.getElementById('resultsCount');
  const emptyState = document.getElementById('emptyState');
  const heroProjectCount = document.getElementById('heroProjectCount');
  const addProjectBtn = document.getElementById('addProjectBtn');
  const ownerLoginBtn = document.getElementById('ownerLoginBtn');

  document.getElementById('year').textContent = new Date().getFullYear();

  // ---------- Theme ----------
  const themeToggle = document.getElementById('themeToggle');
  const SUN_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
  const MOON_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  function applyTheme(theme) {
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
      themeToggle.innerHTML = theme === 'dark' ? SUN_ICON : MOON_ICON;
    }
  }
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) applyTheme(savedTheme);
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });

  // ---------- Scroll reveal ----------
  const revealTargets = document.querySelectorAll(
    '.section > .container > *, .timeline-item, .cert-card, .skill-group'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(el => revealObserver.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('in-view'));
  }

  // ---------- Mobile nav ----------
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

  // ---------- Owner auth ----------
  async function sha256Hex(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function updateOwnerUI() {
    addProjectBtn.hidden = !isOwner;
    ownerLoginBtn.textContent = isOwner ? '🔓 Log out' : '🔒 Owner Login';
  }
  updateOwnerUI();

  ownerLoginBtn.addEventListener('click', () => {
    if (isOwner) {
      isOwner = false;
      sessionStorage.removeItem(OWNER_SESSION_KEY);
      updateOwnerUI();
      render();
      showToast('Logged out');
    } else {
      openOwnerModal();
    }
  });

  const ownerModalBackdrop = document.getElementById('ownerModalBackdrop');
  const ownerModalClose = document.getElementById('ownerModalClose');
  const ownerCancelBtn = document.getElementById('ownerCancelBtn');
  const ownerLoginForm = document.getElementById('ownerLoginForm');
  const ownerFormError = document.getElementById('ownerFormError');
  const ownerPasswordInput = document.getElementById('ownerPassword');

  function openOwnerModal() {
    ownerModalBackdrop.classList.add('open');
    ownerFormError.hidden = true;
    ownerLoginForm.reset();
    ownerPasswordInput.focus();
  }
  function closeOwnerModal() {
    ownerModalBackdrop.classList.remove('open');
  }
  ownerModalClose.addEventListener('click', closeOwnerModal);
  ownerCancelBtn.addEventListener('click', closeOwnerModal);
  ownerModalBackdrop.addEventListener('click', (e) => { if (e.target === ownerModalBackdrop) closeOwnerModal(); });

  ownerLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const entered = ownerPasswordInput.value;
    const hash = await sha256Hex(entered);
    if (hash === OWNER_HASH) {
      isOwner = true;
      sessionStorage.setItem(OWNER_SESSION_KEY, '1');
      updateOwnerUI();
      closeOwnerModal();
      render();
      showToast('Owner mode unlocked');
    } else {
      ownerFormError.textContent = 'Incorrect access code.';
      ownerFormError.hidden = false;
    }
  });

  // ---------- Data loading ----------
  function loadCustomProjects() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
  function saveCustomProjects() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customProjects));
  }

  fetch('data/projects.json', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : [])
    .catch(() => [])
    .then(data => {
      seedProjects = Array.isArray(data) ? data : [];
      rebuildProjects();
      buildBusinessFilters();
      render();
    });

  function rebuildProjects() {
    allProjects = [...seedProjects, ...customProjects];
    heroProjectCount.textContent = allProjects.length;
  }

  function buildBusinessFilters() {
    const container = document.querySelector('.filter-options[data-filter="business"]');
    const categories = ['E-commerce', 'IT', 'Finance', 'Healthcare', 'Retail', 'Education', 'Other'];
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-chip';
      btn.dataset.value = cat;
      btn.textContent = cat;
      container.appendChild(btn);
    });
  }

  // ---------- Filters ----------
  document.querySelectorAll('.filter-options').forEach(group => {
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-chip');
      if (!btn) return;
      const filterKey = group.dataset.filter;
      group.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      state[filterKey] = btn.dataset.value;
      render();
    });
  });

  document.getElementById('searchInput').addEventListener('input', (e) => {
    state.search = e.target.value.trim().toLowerCase();
    render();
  });

  function matchesFilters(p) {
    if (state.difficulty !== 'all' && p.difficulty !== state.difficulty) return false;
    if (state.tool !== 'all' && !(p.tools || []).includes(state.tool)) return false;
    if (state.business !== 'all' && p.businessCategory !== state.business) return false;
    if (state.search) {
      const haystack = [p.title, p.description, ...(p.tags || [])].join(' ').toLowerCase();
      if (!haystack.includes(state.search)) return false;
    }
    return true;
  }

  function render() {
    const filtered = allProjects.filter(matchesFilters);
    grid.innerHTML = '';

    if (allProjects.length === 0) {
      resultsCount.textContent = '';
      emptyState.textContent = '🚧 New projects coming soon — check back shortly!';
      emptyState.hidden = false;
    } else {
      resultsCount.textContent = `${filtered.length} project${filtered.length === 1 ? '' : 's'} shown`;
      emptyState.textContent = 'No projects match these filters yet.';
      emptyState.hidden = filtered.length !== 0;
    }

    filtered.forEach(p => grid.appendChild(renderCard(p)));
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function isSafeUrl(url) {
    try {
      const u = new URL(url, window.location.href);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  function renderCard(p) {
    const card = document.createElement('article');
    card.className = 'project-card';

    const toolsHtml = (p.tools || []).map(t => `<span class="tag tag-tool">${escapeHtml(t === 'SQL' ? 'MySQL/SQL' : t)}</span>`).join('');
    const tagsHtml = (p.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
    const isCustom = String(p.id || '').startsWith('custom-');
    const hasEmbed = p.embedLink && isSafeUrl(p.embedLink);

    card.innerHTML = `
      <div class="card-top">
        <h3 class="card-title">${escapeHtml(p.title)}</h3>
        <span class="difficulty-badge difficulty-${escapeHtml(p.difficulty)}">${escapeHtml(p.difficulty)}</span>
      </div>
      <p class="card-desc">${escapeHtml(p.description)}</p>
      <div class="card-meta-row">
        <span class="tag tag-business">${escapeHtml(p.businessCategory)}</span>
        ${toolsHtml}
      </div>
      ${tagsHtml ? `<div class="card-meta-row">${tagsHtml}</div>` : ''}
      ${hasEmbed ? `<div><button class="dashboard-btn" type="button">▦ Open Dashboard</button></div>` : ''}
      <div class="card-footer">
        <span>${p.link && isSafeUrl(p.link) ? `<a class="card-link" href="${escapeHtml(p.link)}" target="_blank" rel="noopener">View project ↗</a>` : ''}</span>
        ${isCustom && !isOwner ? `<span class="draft-badge">Draft</span>` : ''}
      </div>
      ${isOwner ? `<div class="card-publish-row"></div>` : ''}
    `;

    const dashBtn = card.querySelector('.dashboard-btn');
    if (dashBtn) {
      dashBtn.addEventListener('click', () => openEmbedModal(p.title, p.embedLink));
    }

    if (isOwner) {
      const row = card.querySelector('.card-publish-row');
      if (isCustom) {
        const draftLabel = document.createElement('span');
        draftLabel.className = 'draft-badge';
        draftLabel.textContent = 'Draft — only visible to you';
        row.appendChild(draftLabel);

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.type = 'button';
        copyBtn.textContent = '📋 Copy JSON to publish';
        copyBtn.addEventListener('click', () => {
          const { id, ...publishable } = p;
          navigator.clipboard.writeText(JSON.stringify(publishable, null, 2))
            .then(() => showToast('Copied — paste it in chat to publish live'));
        });
        row.appendChild(copyBtn);

        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.type = 'button';
        delBtn.textContent = 'Discard draft';
        delBtn.addEventListener('click', () => {
          customProjects = customProjects.filter(cp => cp.id !== p.id);
          saveCustomProjects();
          rebuildProjects();
          render();
          showToast('Draft discarded');
        });
        row.appendChild(delBtn);
      } else {
        const liveLabel = document.createElement('span');
        liveLabel.className = 'card-badge-custom';
        liveLabel.textContent = 'Live for everyone';
        row.appendChild(liveLabel);

        const removeReqBtn = document.createElement('button');
        removeReqBtn.className = 'copy-btn';
        removeReqBtn.type = 'button';
        removeReqBtn.textContent = '🗑 Copy removal request';
        removeReqBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(`Please remove this project from the live site: "${p.title}"`)
            .then(() => showToast('Copied — paste it in chat to remove live'));
        });
        row.appendChild(removeReqBtn);
      }
    }

    return card;
  }

  // ---------- Embed modal ----------
  const embedModalBackdrop = document.getElementById('embedModalBackdrop');
  const embedModalClose = document.getElementById('embedModalClose');
  const embedModalTitle = document.getElementById('embedModalTitle');
  const embedIframe = document.getElementById('embedIframe');

  function openEmbedModal(title, url) {
    if (!isSafeUrl(url)) return;
    embedModalTitle.textContent = title;
    embedIframe.src = url;
    embedModalBackdrop.classList.add('open');
  }
  function closeEmbedModal() {
    embedModalBackdrop.classList.remove('open');
    embedIframe.src = 'about:blank';
  }
  embedModalClose.addEventListener('click', closeEmbedModal);
  embedModalBackdrop.addEventListener('click', (e) => { if (e.target === embedModalBackdrop) closeEmbedModal(); });

  // ---------- Add Project modal ----------
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalClose = document.getElementById('modalClose');
  const cancelBtn = document.getElementById('cancelBtn');
  const projectForm = document.getElementById('projectForm');
  const formError = document.getElementById('formError');

  function openModal() {
    if (!isOwner) return;
    modalBackdrop.classList.add('open');
    formError.hidden = true;
    projectForm.reset();
  }
  function closeModal() {
    modalBackdrop.classList.remove('open');
  }

  addProjectBtn.addEventListener('click', openModal);
  modalClose.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModal(); closeOwnerModal(); closeEmbedModal(); }
  });

  projectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isOwner) return;

    const title = document.getElementById('fTitle').value.trim();
    const description = document.getElementById('fDescription').value.trim();
    const difficulty = document.getElementById('fDifficulty').value;
    const businessCategory = document.getElementById('fBusiness').value;
    const link = document.getElementById('fLink').value.trim();
    const embedLink = document.getElementById('fEmbed').value.trim();
    const tags = document.getElementById('fTags').value.split(',').map(t => t.trim()).filter(Boolean);
    const tools = Array.from(document.querySelectorAll('input[name="fTools"]:checked')).map(cb => cb.value);

    if (!title || !description || tools.length === 0) {
      formError.textContent = 'Please fill in the title, description, and select at least one tool.';
      formError.hidden = false;
      return;
    }
    if (link && !isSafeUrl(link)) {
      formError.textContent = 'Project link must be a valid http(s) URL.';
      formError.hidden = false;
      return;
    }
    if (embedLink && !isSafeUrl(embedLink)) {
      formError.textContent = 'Dashboard embed link must be a valid http(s) URL.';
      formError.hidden = false;
      return;
    }

    const newProject = {
      id: 'custom-' + Date.now(),
      title, description, difficulty, businessCategory, tools, link, embedLink, tags,
      date: new Date().toISOString().slice(0, 10)
    };

    customProjects.push(newProject);
    saveCustomProjects();
    rebuildProjects();
    render();
    closeModal();
    showToast('Draft added — copy its JSON to publish it live');
  });

  // ---------- Toast ----------
  let toastTimer;
  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }
})();
