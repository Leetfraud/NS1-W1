/* ═══════════════════════════════════════════
   NexioSol — Dashboard
   Password gate + lead table fetch/render.
   The password is checked server-side; the
   token returned is held in memory only.
   ═══════════════════════════════════════════ */
(function () {
  let token = null;
  let allLeads = [];

  const loginView = document.getElementById('loginView');
  const dashView = document.getElementById('dashView');
  const loginForm = document.getElementById('loginForm');
  const pwInput = document.getElementById('pwInput');
  const loginErr = document.getElementById('loginErr');
  const loginBtn = document.getElementById('loginBtn');

  const tbody = document.getElementById('leadRows');
  const searchInput = document.getElementById('dashSearch');
  const statTotal = document.getElementById('statTotal');
  const statWeek = document.getElementById('statWeek');
  const statToday = document.getElementById('statToday');
  const statTop = document.getElementById('statTop');

  /* ── Login ── */
  loginBtn.addEventListener('click', doLogin);
  pwInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

  async function doLogin() {
    const pw = pwInput.value;
    if (!pw) { loginErr.textContent = 'Enter the password.'; return; }
    loginErr.textContent = '';
    loginBtn.classList.add('loading');
    loginBtn.textContent = 'Checking…';
    try {
      const res = await fetch('/api/leads', {
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + pw },
      });
      if (res.status === 401) throw new Error('Wrong password.');
      if (!res.ok) throw new Error('Something went wrong.');
      const data = await res.json();
      token = pw;
      allLeads = Array.isArray(data.leads) ? data.leads : [];
      loginView.style.display = 'none';
      dashView.style.display = 'block';
      document.body.classList.add('dash-active');
      renderStats();
      renderRows(allLeads);
    } catch (err) {
      loginErr.textContent = err.message || 'Login failed.';
    } finally {
      loginBtn.classList.remove('loading');
      loginBtn.textContent = 'Enter dashboard';
    }
  }

  /* ── Logout ── */
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => location.reload());

  /* ── Search ── */
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      if (!q) { renderRows(allLeads); return; }
      const filtered = allLeads.filter(l =>
        (l.name || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.service || '').toLowerCase().includes(q) ||
        (l.details || '').toLowerCase().includes(q)
      );
      renderRows(filtered);
    });
  }

  /* ── Stats ── */
  function renderStats() {
    const now = Date.now();
    const day = 86400000;
    const total = allLeads.length;
    const week = allLeads.filter(l => now - new Date(l.createdAt).getTime() < 7 * day).length;
    const today = allLeads.filter(l => now - new Date(l.createdAt).getTime() < day).length;

    const counts = {};
    allLeads.forEach(l => { if (l.service) counts[l.service] = (counts[l.service] || 0) + 1; });
    let top = '—';
    let max = 0;
    for (const k in counts) { if (counts[k] > max) { max = counts[k]; top = k; } }

    statTotal.textContent = total;
    statWeek.textContent = week;
    statToday.textContent = today;
    statTop.textContent = top;
  }

  /* ── Render table ── */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  function renderRows(leads) {
    if (!leads.length) {
      tbody.innerHTML = '<tr><td colspan="5"><div class="dash-empty">No leads yet. New submissions from the site will appear here.</div></td></tr>';
      return;
    }
    tbody.innerHTML = leads.map(l => `
      <tr>
        <td>
          <div class="lead-name">${esc(l.name) || '—'}</div>
          <a class="lead-email" href="mailto:${esc(l.email)}">${esc(l.email) || '—'}</a>
        </td>
        <td>${l.service ? `<span class="lead-badge">${esc(l.service)}</span>` : '<span style="color:var(--faint)">—</span>'}</td>
        <td class="lead-budget">${esc(l.budget) || '—'}</td>
        <td><div class="lead-msg">${esc(l.details) || '<span style="color:var(--faint)">No details</span>'}</div></td>
        <td class="lead-date">${fmtDate(l.createdAt)}</td>
      </tr>
    `).join('');
  }
})();
