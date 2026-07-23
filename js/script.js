(function () {
  'use strict';

  const STORAGE_KEY = 'faiz_portfolio_custom_projects_v1';
  const THEME_KEY = 'faiz_portfolio_theme';

  let seedProjects = [];
  let customProjects = loadCustomProjects();
  let allProjects = [];

  const state = { difficulty: 'all', tool: 'all', business: 'all', search: '' };

  const grid = document.getElementById('projectsGrid');
  const resultsCount = document.getElementById('resultsCount');
  const emptyState = document.getElementById('emptyState');
  const heroProjectCount = document.getElementById('heroProjectCount');

  document.getElementById('year').textContent = new Date().getFullYear();

  // ---------- Theme ----------
  const themeToggle = document.getElementById('themeToggle');
  function applyTheme(theme) {
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
      themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
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

  // ---------- Mobile nav ----------
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

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

  fetch('data/projects.json')
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

  const DIFFICULTY_ORDER = { Easy: 0, Medium: 1, Hard: 2 };

  function render() {
    const filtered = allProjects.filter(matchesFilters);
    grid.innerHTML = '';
    resultsCount.textContent = `${filtered.length} project${filtered.length === 1 ? '' : 's'} shown`;
    emptyState.hidden = filtered.length !== 0;

    filtered.forEach(p => grid.appendChild(renderCard(p)));
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function renderCard(p) {
    const card = document.createElement('article');
    card.className = 'project-card';

    const toolsHtml = (p.tools || []).map(t => `<span class="tag tag-tool">${escapeHtml(t === 'SQL' ? 'MySQL/SQL' : t)}</span>`).join('');
    const tagsHtml = (p.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
    const isCustom = String(p.id || '').startsWith('custom-');

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
      <div class="card-footer">
        <span>${p.link ? `<a class="card-link" href="${escapeHtml(p.link)}" target="_blank" rel="noopener">View project ↗</a>` : ''}</span>
        ${isCustom ? `<span class="delete-wrap">
            <button class="delete-btn" type="button">Remove</button>
            <span class="delete-confirm" hidden>
              Remove? <button class="delete-yes" type="button">Yes</button> <button class="delete-no" type="button">No</button>
            </span>
          </span>` : (p.title && (p.title.match(/^(Academic|Automated|Learner)/) ) ? `<span class="card-badge-custom">Real work</span>` : `<span class="card-badge-custom">Sample</span>`)}
      </div>
    `;

    if (isCustom) {
      const delBtn = card.querySelector('.delete-btn');
      const confirmWrap = card.querySelector('.delete-confirm');
      const yesBtn = card.querySelector('.delete-yes');
      const noBtn = card.querySelector('.delete-no');

      delBtn.addEventListener('click', () => {
        delBtn.hidden = true;
        confirmWrap.hidden = false;
      });
      noBtn.addEventListener('click', () => {
        confirmWrap.hidden = true;
        delBtn.hidden = false;
      });
      yesBtn.addEventListener('click', () => {
        customProjects = customProjects.filter(cp => cp.id !== p.id);
        saveCustomProjects();
        rebuildProjects();
        render();
        showToast('Project removed');
      });
    }
    return card;
  }

  // ---------- Modal ----------
  const modalBackdrop = document.getElementById('modalBackdrop');
  const addProjectBtn = document.getElementById('addProjectBtn');
  const modalClose = document.getElementById('modalClose');
  const cancelBtn = document.getElementById('cancelBtn');
  const projectForm = document.getElementById('projectForm');
  const formError = document.getElementById('formError');

  function openModal() {
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
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  projectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('fTitle').value.trim();
    const description = document.getElementById('fDescription').value.trim();
    const difficulty = document.getElementById('fDifficulty').value;
    const businessCategory = document.getElementById('fBusiness').value;
    const link = document.getElementById('fLink').value.trim();
    const tags = document.getElementById('fTags').value.split(',').map(t => t.trim()).filter(Boolean);
    const tools = Array.from(document.querySelectorAll('input[name="fTools"]:checked')).map(cb => cb.value);

    if (!title || !description || tools.length === 0) {
      formError.textContent = 'Please fill in the title, description, and select at least one tool.';
      formError.hidden = false;
      return;
    }

    const newProject = {
      id: 'custom-' + Date.now(),
      title, description, difficulty, businessCategory, tools, link, tags,
      date: new Date().toISOString().slice(0, 10)
    };

    customProjects.push(newProject);
    saveCustomProjects();
    rebuildProjects();
    render();
    closeModal();
    showToast('Project added');
  });

  // ---------- Toast ----------
  let toastTimer;
  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }
})();
