(function() {
'use strict';

const appState = {
  currentUser: null,
  currentView: 'dashboard',
  loginMode: 'staff',
  config: null,
  cadets: [],
  nrs: [],
  letters: [],
  attendance: [],
  volunteer: [],
  finance: [],
  drive: [],
  activity: [],
};

function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

function fmtMoney(value) {
  return '₹' + Number(value || 0).toLocaleString('en-IN');
}

function fmtDate(d) {
  return d ? d.split('-').reverse().join('-') : '';
}

async function renderApp() {
  const root = document.getElementById('app');

  if (!appState.currentUser) {
    root.innerHTML = renderLogin();
    bindLoginUI();
    return;
  }

  try {
    const settingsResp = await window.api.getSettings();
    appState.config = settingsResp.settings;
  } catch (error) {
    console.warn('Failed to fetch settings:', error.message);
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'nr', label: 'Create NR' },
    { id: 'letters', label: 'Letters' },
    { id: 'records', label: 'Records' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'volunteer', label: 'Volunteer Work' },
    { id: 'finance', label: 'Finance' },
    { id: 'drive', label: 'Drive' },
    { id: 'cadets', label: 'Cadets' },
    { id: 'admin', label: 'Admin' },
  ].filter((item) => currentRoleCan(item.id));

  root.innerHTML = `
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark"><span></span><span></span><span></span></div>
        <div>
          <div class="brand-title">${escapeHtml(appState.config?.portalName || 'NCC Army Wing')}</div>
          <small>${escapeHtml(appState.config?.portalSubtitle || 'Anna University Unit Portal')}</small>
        </div>
      </div>
      <div class="user-meta">
        <span>${escapeHtml(appState.currentUser.name)}</span>
        <span class="role-pill">${escapeHtml(appState.currentUser.role.toUpperCase())}</span>
        <button class="ghost" onclick="logout()">Logout</button>
      </div>
    </header>
    <div class="layout">
      <aside class="sidebar">
        ${navItems.map((item) => `
          <button class="nav-btn ${appState.currentView === item.id ? 'active' : ''}" data-nav="${item.id}">${escapeHtml(item.label)}</button>
        `).join('')}
      </aside>
      <main class="content" id="mainContent">
        Loading…
      </main>
    </div>
  `;

  bindNav();
  await updateMainContent();
}

async function updateMainContent() {
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;

  try {
    const html = await renderCurrentView();
    mainContent.innerHTML = html;
    bindViewUI();
  } catch (error) {
    mainContent.innerHTML = `<div class="card"><p class="error">Error loading view: ${escapeHtml(error.message)}</p></div>`;
  }
}

function currentRoleCan(viewId) {
  const role = appState.currentUser?.role ?? 'guest';
  const allowed = {
    dashboard: ['admin', 'senior', 'junior', 'ano', 'cadet'],
    nr: ['admin', 'senior', 'junior'],
    letters: ['admin', 'senior', 'junior'],
    records: ['admin', 'senior', 'junior', 'ano'],
    attendance: ['admin', 'senior', 'junior', 'ano', 'cadet'],
    volunteer: ['admin', 'senior', 'junior', 'cadet'],
    finance: ['admin', 'senior', 'ano'],
    drive: ['admin', 'senior', 'junior', 'ano', 'cadet'],
    cadets: ['admin', 'senior', 'junior', 'ano'],
    admin: ['admin'],
  };
  return allowed[viewId]?.includes(role) ?? false;
}

function renderLogin() {
  const staffUsers = appState.config?.users?.filter((u) => u.role !== 'cadet') || [
    { id: 'u-admin', name: 'Admin' },
  ];

  return `
    <div class="login-shell">
      <div class="login-box">
        <div class="login-header">
          <div class="brand-mark large"><span></span><span></span><span></span></div>
          <div>
            <h2>NCC Army Wing</h2>
            <small>Anna University Unit Portal</small>
          </div>
        </div>

        <div class="segmented">
          <button class="segment ${appState.loginMode === 'staff' ? 'active' : ''}" data-mode="staff">Staff / ANO</button>
          <button class="segment ${appState.loginMode === 'cadet' ? 'active' : ''}" data-mode="cadet">Cadet</button>
        </div>

        <div id="staff-login" class="login-panel ${appState.loginMode === 'staff' ? '' : 'hidden'}">
          <div class="field">
            <label>Login as</label>
            <select id="staffUser">
              ${staffUsers.map((u) => `<option value="${escapeHtml(u.id)}">${escapeHtml(u.name)} (${escapeHtml(u.role || 'staff')})</option>`).join('')}
            </select>
          </div>
        </div>

        <div id="cadet-login" class="login-panel ${appState.loginMode === 'cadet' ? '' : 'hidden'}">
          <div class="field">
            <label>Regimental No</label>
            <input id="cadetReg" type="text" placeholder="TN-01" />
          </div>
          <div class="field">
            <label>Cadet Name</label>
            <input id="cadetName" type="text" placeholder="Cadet Name" />
          </div>
        </div>

        <div class="field">
          <label>Password</label>
          <input id="loginPassword" type="password" placeholder="Password" />
        </div>

        <button class="primary wide" onclick="submitLogin()">Login</button>
      </div>
    </div>
  `;
}

function bindLoginUI() {
  document.querySelectorAll('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      appState.loginMode = button.dataset.mode;
      renderApp();
    });
  });
}

async function submitLogin() {
  const pass = document.getElementById('loginPassword').value;
  if (!pass) {
    alert('Please enter a password');
    return;
  }

  try {
    if (appState.loginMode === 'staff') {
      const selectedUserId = document.getElementById('staffUser').value;
      const user = await window.api.login(selectedUserId, pass);
      appState.currentUser = user;
    } else {
      const regNo = document.getElementById('cadetReg').value.trim();
      const name = document.getElementById('cadetName').value.trim();
      const user = await window.api.login(null, pass, regNo, name);
      appState.currentUser = user;
    }

    renderApp();
  } catch (error) {
    alert('Invalid credentials: ' + error.message);
  }
}

function logout() {
  window.api.clearToken();
  appState.currentUser = null;
  renderApp();
}

function bindNav() {
  document.querySelectorAll('[data-nav]').forEach((button) => {
    button.addEventListener('click', () => {
      appState.currentView = button.dataset.nav;
      updateMainContent();
    });
  });
}

async function renderCurrentView() {
  const map = {
    dashboard: renderDashboard,
    nr: renderNR,
    letters: renderLetters,
    records: renderRecords,
    attendance: renderAttendance,
    volunteer: renderVolunteer,
    finance: renderFinance,
    drive: renderDrive,
    cadets: renderCadets,
    admin: renderAdmin,
  };

  const renderer = map[appState.currentView] || renderDashboard;
  return await renderer();
}

async function renderDashboard() {
  try {
    const dashboard = await window.api.getDashboard();
    const activity = dashboard.recentActivity || [];

    return `
      <div class="card">
        <h2>Welcome, ${escapeHtml(appState.currentUser.name)}</h2>
        <p class="muted">NCC Army Wing portal for ${escapeHtml(appState.currentUser.role.toUpperCase())} role.</p>
      </div>
      <div class="grid three">
        <div class="stat-box">
          <div class="stat-value">${dashboard.cadets || 0}</div>
          <div class="stat-label">Cadets</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${dashboard.nrs || 0}</div>
          <div class="stat-label">NRs</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${dashboard.letters || 0}</div>
          <div class="stat-label">Letters</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${dashboard.attendance || 0}</div>
          <div class="stat-label">Attendance</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${dashboard.volunteer || 0}</div>
          <div class="stat-label">Volunteer</div>
        </div>
        <div class="stat-box">
          <div class="stat-value">${fmtMoney(dashboard.finance || 0)}</div>
          <div class="stat-label">Finance</div>
        </div>
      </div>
      <div class="card">
        <h3>Recent Activity</h3>
        ${activity.length ? activity.map((item) => `
          <div class="activity-item">
            <div class="activity-header">
              <strong>${escapeHtml(item.user)}</strong>
              <span>${new Date(item.timestamp).toLocaleString()}</span>
            </div>
            <div>${escapeHtml(item.type)}: ${escapeHtml(item.text)}</div>
          </div>
        `).join('') : '<p class="muted">No recent activity.</p>'}
      </div>
    `;
  } catch (error) {
    return `<div class="card"><p class="error">Error loading dashboard: ${escapeHtml(error.message)}</p></div>`;
  }
}

async function renderNR() {
  return `
    <div class="card">
      <h2>Create Nominal Roll</h2>
      <div class="two-col">
        <div class="field">
          <label>Event Type</label>
          <select id="nrType">
            <option>Camp</option>
            <option>Other</option>
          </select>
        </div>
        <div class="field">
          <label>Event Name</label>
          <input id="nrName" type="text" placeholder="Annual Training Camp" />
        </div>
        <div class="field">
          <label>Venue</label>
          <input id="nrVenue" type="text" placeholder="Venue" />
        </div>
        <div class="field">
          <label>From Date</label>
          <input id="nrFrom" type="date" />
        </div>
        <div class="field">
          <label>To Date</label>
          <input id="nrTo" type="date" />
        </div>
        <div class="field">
          <label>Reporting Time</label>
          <input id="nrTime" type="time" />
        </div>
      </div>
      <div class="actions-row">
        <button class="primary" onclick="saveNR()">Create NR</button>
      </div>
    </div>
  `;
}

async function saveNR() {
  try {
    const nr = {
      type: document.getElementById('nrType').value,
      name: document.getElementById('nrName').value || 'New event',
      venue: document.getElementById('nrVenue').value,
      from: document.getElementById('nrFrom').value,
      to: document.getElementById('nrTo').value,
      time: document.getElementById('nrTime').value,
      status: 'Draft',
    };

    await window.api.createNR(nr);
    alert('NR created successfully');
    updateMainContent();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function renderLetters() {
  const templates = appState.config?.templates || [];
  return `
    <div class="card">
      <h2>Letters</h2>
      <div class="two-col">
        <div class="field">
          <label>Template</label>
          <select id="letterTemplate">
            ${templates.map((t) => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Event Name</label>
          <input id="letterEvent" type="text" placeholder="Camp or event" />
        </div>
        <div class="field">
          <label>Date</label>
          <input id="letterDate" type="date" />
        </div>
        <div class="field">
          <label>Venue</label>
          <input id="letterVenue" type="text" placeholder="Venue" />
        </div>
      </div>
      <div class="actions-row">
        <button class="primary" onclick="saveLetter()">Save Letter</button>
      </div>
    </div>
  `;
}

async function saveLetter() {
  try {
    const letter = {
      name: 'Letter',
      event: document.getElementById('letterEvent').value || 'General event',
      date: document.getElementById('letterDate').value || new Date().toISOString().slice(0, 10),
      venue: document.getElementById('letterVenue').value || 'N/A',
      status: 'Draft',
    };

    await window.api.createLetter(letter);
    alert('Letter saved successfully');
    updateMainContent();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function renderRecords() {
  try {
    const nrsResp = await window.api.getNRs();
    const lettersResp = await window.api.getLetters();
    const all = [
      ...(nrsResp.nrs || []).map((n) => ({ ...n, type: 'NR' })),
      ...(lettersResp.letters || []).map((l) => ({ ...l, type: 'Letter' })),
    ].sort((a, b) => b.createdAt - a.createdAt);

    return `
      <div class="card">
        <h2>Records</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${all.length ? all.map((item) => `
                <tr>
                  <td>${escapeHtml(item.type)}</td>
                  <td>${escapeHtml(item.name || item.event)}</td>
                  <td><span class="badge ${item.status === 'Draft' ? 'warn' : ''}">${escapeHtml(item.status)}</span></td>
                  <td>${escapeHtml(item.createdBy)}</td>
                  <td><button class="danger small" onclick="deleteRecord('${item.type}','${item.id}')">Delete</button></td>
                </tr>
              `).join('') : '<tr><td colspan="5">No records yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (error) {
    return `<div class="card"><p class="error">Error: ${escapeHtml(error.message)}</p></div>`;
  }
}

async function deleteRecord(kind, id) {
  if (!confirm('Delete this record?')) return;
  try {
    // TODO: Add delete endpoints to backend
    alert('Delete functionality coming soon');
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function renderAttendance() {
  return `
    <div class="card">
      <h2>Attendance</h2>
      <div class="two-col">
        <div class="field">
          <label>Date</label>
          <input id="attendanceDate" type="date" value="${new Date().toISOString().slice(0, 10)}" />
        </div>
        <div class="field">
          <label>Session Type</label>
          <select id="attendanceType">
            ${(appState.config?.attendanceTypes || []).map((type) => `<option>${escapeHtml(type)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="actions-row">
        <button class="primary" onclick="saveAttendance()">Save Attendance</button>
      </div>
    </div>
  `;
}

async function saveAttendance() {
  try {
    const attendance = {
      date: document.getElementById('attendanceDate').value,
      type: document.getElementById('attendanceType').value,
    };

    await window.api.createAttendance(attendance);
    alert('Attendance saved successfully');
    updateMainContent();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function renderVolunteer() {
  return `
    <div class="card">
      <h2>Volunteer Work</h2>
      <div class="two-col">
        <div class="field">
          <label>Activity</label>
          <input id="volunteerEvent" type="text" placeholder="Event / Activity" />
        </div>
        <div class="field">
          <label>Date</label>
          <input id="volunteerDate" type="date" value="${new Date().toISOString().slice(0, 10)}" />
        </div>
        <div class="field">
          <label>Hours</label>
          <input id="volunteerHours" type="number" min="0" value="1" />
        </div>
        <div class="field">
          <label>Role</label>
          <input id="volunteerRole" type="text" placeholder="Role / duty" />
        </div>
      </div>
      <div class="actions-row">
        <button class="primary" onclick="saveVolunteer()">Add Volunteer</button>
      </div>
    </div>
  `;
}

async function saveVolunteer() {
  try {
    const volunteer = {
      event: document.getElementById('volunteerEvent').value || 'General activity',
      date: document.getElementById('volunteerDate').value,
      hours: Number(document.getElementById('volunteerHours').value || 0),
      role: document.getElementById('volunteerRole').value || 'Volunteer',
    };

    await window.api.createVolunteer(volunteer);
    alert('Volunteer work added successfully');
    updateMainContent();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function renderFinance() {
  try {
    const financeResp = await window.api.getFinance();
    const finance = financeResp.finance || [];
    const balance = finance.reduce((sum, item) => {
      return sum + (item.type === 'in' ? Number(item.amount || 0) : -Number(item.amount || 0));
    }, 0);

    return `
      <div class="card">
        <h2>Finance</h2>
        <div class="grid three small-gap">
          <div class="stat-box">
            <div class="stat-value">${fmtMoney(balance)}</div>
            <div class="stat-label">Balance</div>
          </div>
        </div>
        <div class="two-col" style="margin-top:16px;">
          <div class="field">
            <label>Type</label>
            <select id="financeType">
              <option value="in">Money Received</option>
              <option value="out">Money Spent</option>
            </select>
          </div>
          <div class="field">
            <label>Category</label>
            <select id="financeCategory">
              ${(appState.config?.financeCategories || []).map((cat) => `<option>${escapeHtml(cat)}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>Amount</label>
            <input id="financeAmount" type="number" min="0" value="0" />
          </div>
          <div class="field">
            <label>Reference / Bill</label>
            <input id="financeRef" type="text" placeholder="Bill no or reference" />
          </div>
        </div>
        <div class="actions-row">
          <button class="primary" onclick="saveFinance()">Add Entry</button>
        </div>
      </div>
    `;
  } catch (error) {
    return `<div class="card"><p class="error">Error: ${escapeHtml(error.message)}</p></div>`;
  }
}

async function saveFinance() {
  try {
    const finance = {
      type: document.getElementById('financeType').value,
      category: document.getElementById('financeCategory').value,
      amount: Number(document.getElementById('financeAmount').value || 0),
      reference: document.getElementById('financeRef').value || 'N/A',
    };

    await window.api.createFinance(finance);
    alert('Finance entry added successfully');
    updateMainContent();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function renderDrive() {
  return `
    <div class="card">
      <h2>Drive</h2>
      <div class="two-col">
        <div class="field">
          <label>Title</label>
          <input id="driveTitle" type="text" placeholder="Document title" />
        </div>
        <div class="field">
          <label>Category</label>
          <select id="driveCategory">
            ${(appState.config?.driveCategories || []).map((c) => `<option>${escapeHtml(c)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="actions-row">
        <button class="primary" onclick="saveDrive()">Add Document</button>
      </div>
    </div>
  `;
}

async function saveDrive() {
  try {
    const drive = {
      title: document.getElementById('driveTitle').value || 'Untitled document',
      category: document.getElementById('driveCategory').value,
    };

    await window.api.createDrive(drive);
    alert('Document added successfully');
    updateMainContent();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function renderCadets() {
  try {
    const cadetsResp = await window.api.getCadets();
    const cadets = cadetsResp.cadets || [];

    return `
      <div class="card">
        <h2>Cadets</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Regt. No</th>
                <th>Rank</th>
                <th>Name</th>
                <th>Department</th>
                <th>Year</th>
                <th>Platoon</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              ${cadets.length ? cadets.map((c) => `
                <tr>
                  <td>${escapeHtml(c.regNo)}</td>
                  <td>${escapeHtml(c.rank)}</td>
                  <td>${escapeHtml(c.name)}</td>
                  <td>${escapeHtml(c.dept)}</td>
                  <td>${escapeHtml(c.year)}</td>
                  <td>${escapeHtml(c.platoon)}</td>
                  <td>${escapeHtml(c.phone)}</td>
                </tr>
              `).join('') : '<tr><td colspan="7">No cadets yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (error) {
    return `<div class="card"><p class="error">Error: ${escapeHtml(error.message)}</p></div>`;
  }
}

async function renderAdmin() {
  try {
    const usersResp = await window.api.getUsers();
    const users = usersResp.users || [];

    return `
      <div class="card">
        <h2>Admin Settings</h2>

        <div class="admin-box">
          <h3>Portal</h3>
          <div class="two-col">
            <div class="field">
              <label>Portal Name</label>
              <input id="portalName" type="text" value="${escapeHtml(appState.config?.portalName || 'NCC Army Wing')}" />
            </div>
            <div class="field">
              <label>Portal Subtitle</label>
              <input id="portalSubtitle" type="text" value="${escapeHtml(appState.config?.portalSubtitle || 'Anna University Unit Portal')}" />
            </div>
          </div>
        </div>

        <div class="admin-box">
          <h3>Users</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Reg No</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                ${users.map((user) => `
                  <tr>
                    <td>${escapeHtml(user.name)}</td>
                    <td>${escapeHtml(user.role)}</td>
                    <td>${escapeHtml(user.regNo || '-')}</td>
                    <td><button class="danger small" onclick="deleteUser('${user.id}')">Delete</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="actions-row">
          <button class="primary" onclick="saveAdminSettings()">Save Settings</button>
          <button class="ghost" onclick="exportBackup()">Export Backup</button>
        </div>
      </div>
    `;
  } catch (error) {
    return `<div class="card"><p class="error">Error: ${escapeHtml(error.message)}</p></div>`;
  }
}

async function saveAdminSettings() {
  try {
    const settings = {
      portalName: document.getElementById('portalName').value || 'NCC Army Wing',
      portalSubtitle: document.getElementById('portalSubtitle').value || 'Anna University Unit Portal',
    };

    await window.api.updateSettings(settings);
    alert('Settings saved successfully');
    appState.config = { ...appState.config, ...settings };
    renderApp();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function exportBackup() {
  try {
    const backup = await window.api.getBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ncc-army-portal-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function deleteUser(id) {
  if (!confirm('Delete this user?')) return;
  try {
    await window.api.deleteUser(id);
    alert('User deleted successfully');
    updateMainContent();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

function bindViewUI() {
  // Bind any view-specific UI if needed
}

// Global functions for onclick handlers
window.logout = logout;
window.submitLogin = submitLogin;
window.saveNR = saveNR;
window.saveLetter = saveLetter;
window.deleteRecord = deleteRecord;
window.saveAttendance = saveAttendance;
window.saveVolunteer = saveVolunteer;
window.saveFinance = saveFinance;
window.saveDrive = saveDrive;
window.saveAdminSettings = saveAdminSettings;
window.exportBackup = exportBackup;
window.deleteUser = deleteUser;

// Fetch config and render
async function init() {
  try {
    const token = localStorage.getItem('ncc_token');
    if (token) {
      window.api.setToken(token);
      const dashboard = await window.api.getDashboard();
      appState.currentUser = { name: 'User', role: 'admin' };
    }
  } catch (error) {
    console.warn('Session check failed, requires new login');
  }

  renderApp();
}

init();
})();
