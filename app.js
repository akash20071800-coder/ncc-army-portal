const STORAGE_KEY = 'ncc_army_portal_v2';

const DEFAULT_CONFIG = {
  portalName: 'NCC Army Wing',
  portalSubtitle: 'Anna University Unit Portal',
  users: [
    { id: 'u-admin', name: 'Admin', role: 'admin', password: 'admin123' },
    { id: 'u-senior', name: 'Senior Cadet 1', role: 'senior', password: 'senior123' },
    { id: 'u-junior', name: 'Junior Cadet 1', role: 'junior', password: 'junior123' },
    { id: 'u-ano', name: 'ANO 1', role: 'ano', password: 'ano123' },
    { id: 'u-cadet', name: 'Cadet 01', role: 'cadet', password: 'cadet123', regNo: 'TN-01' },
  ],
  colleges: [
    { id: 'ceg', name: 'College of Engineering, Guindy', deanTitle: 'The Dean', platoons: ['Engineers', 'EME'] },
    { id: 'act', name: 'Alagappa College of Technology', deanTitle: 'The Dean', platoons: ['Signals'] },
  ],
  anos: [
    { id: 'ano-1', name: 'ANO 1', collegeId: 'ceg' },
    { id: 'ano-2', name: 'ANO 2', collegeId: 'ceg' },
    { id: 'ano-3', name: 'ANO 3', collegeId: 'act' },
  ],
  templates: [
    { id: 'od', name: 'OD Letter', group: 'dean', subject: 'OD permission for {event}', body: 'This is to request permission for {event} on {when} at {venue}.\n\nWe request the necessary approval and oblige.' },
    { id: 'gate', name: 'Gate Opening', group: 'dean', subject: 'Gate opening permission for {event}', body: 'We request permission to open the gate for {event} on {when} at {venue}.\n\nKindly accord permission and oblige.' },
    { id: 'co-general', name: 'CO Letter', group: 'co', subject: '{event}', body: 'We request your permission for {event} on {when} at {venue}.\n\nKindly consider and oblige.' },
  ],
  letterheads: {
    common: 'NCC ARMY WING\nAnna University\nTamil Nadu',
    ano: 'NCC ARMY WING\nOffice of the ANO\nAnna University',
    ceg: 'COLLEGE OF ENGINEERING, GUINDY\nAnna University\nTamil Nadu',
    act: 'ALAGAPPA COLLEGE OF TECHNOLOGY\nAnna University\nTamil Nadu',
  },
  attendanceTypes: ['Daily parade', 'Drill', 'Training class', 'Camp', 'Other'],
  financeCategories: ['Camp', 'Event', 'Equipment', 'Refreshments', 'Stationery', 'Travel', 'Other'],
  driveCategories: ['Nominal Roll', 'Letter', 'Signed copy', 'Bill', 'Certificate', 'Other'],
  statuses: ['Draft', 'Sent for signature', 'Signed', 'Submitted'],
  theme: { primary: '#123b7a', accent: '#c2212b' }
};

const defaultCadets = [
  { id: 'c1', regNo: 'TN-01', rank: 'Cadet', name: 'Demo Cadet 1', dept: 'Mechanical', year: 'II', platoon: 'Engineers', phone: '0000000000' },
  { id: 'c2', regNo: 'TN-02', rank: 'Cadet', name: 'Demo Cadet 2', dept: 'EEE', year: 'II', platoon: 'EME', phone: '0000000001' },
  { id: 'c3', regNo: 'TN-03', rank: 'Cadet', name: 'Demo Cadet 3', dept: 'CSE', year: 'III', platoon: 'Signals', phone: '0000000002' },
  { id: 'c4', regNo: 'TN-04', rank: 'Cadet', name: 'Demo Cadet 4', dept: 'ECE', year: 'II', platoon: 'Engineers', phone: '0000000003' },
];

const appState = {
  currentUser: null,
  currentView: 'dashboard',
  loginMode: 'staff',
  config: loadConfig(),
  cadets: loadCadets(),
  nrs: readStorage('nrs', []),
  letters: readStorage('letters', []),
  attendance: readStorage('attendance', []),
  volunteer: readStorage('volunteer', []),
  finance: readStorage('finance', []),
  drive: readStorage('drive', []),
  activity: readStorage('activity', []),
};

function loadConfig() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) return structuredClone(DEFAULT_CONFIG);
  try {
    const parsed = JSON.parse(existing);
    return { ...structuredClone(DEFAULT_CONFIG), ...parsed };
  } catch {
    return structuredClone(DEFAULT_CONFIG);
  }
}

function persistConfig() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.config));
}

function loadCadets() {
  const existing = localStorage.getItem(`${STORAGE_KEY}-cadets`);
  if (!existing) return structuredClone(defaultCadets);
  try {
    return JSON.parse(existing);
  } catch {
    return structuredClone(defaultCadets);
  }
}

function persistCadets() {
  localStorage.setItem(`${STORAGE_KEY}-cadets`, JSON.stringify(appState.cadets));
}

function readStorage(key, fallback) {
  const value = localStorage.getItem(`${STORAGE_KEY}-${key}`);
  if (!value) return structuredClone(fallback);
  try {
    return JSON.parse(value);
  } catch {
    return structuredClone(fallback);
  }
}

function writeStorage(key, value) {
  localStorage.setItem(`${STORAGE_KEY}-${key}`, JSON.stringify(value));
}

function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function fmtMoney(value) {
  return '₹' + Number(value || 0).toLocaleString('en-IN');
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function addActivity(type, text) {
  appState.activity.unshift({
    id: uid('act'),
    type,
    text,
    timestamp: Date.now(),
    user: appState.currentUser ? appState.currentUser.name : 'System',
  });
  writeStorage('activity', appState.activity);
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

function renderApp() {
  const root = document.getElementById('app');
  if (!appState.currentUser) {
    root.innerHTML = renderLogin();
    bindLoginUI();
    return;
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
  ].filter(item => currentRoleCan(item.id));

  root.innerHTML = `
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark"><span></span><span></span><span></span></div>
        <div>
          <div class="brand-title">${escapeHtml(appState.config.portalName)}</div>
          <small>${escapeHtml(appState.config.portalSubtitle)}</small>
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
        ${navItems.map(item => `
          <button class="nav-btn ${appState.currentView === item.id ? 'active' : ''}" data-nav="${item.id}">${escapeHtml(item.label)}</button>
        `).join('')}
      </aside>
      <main class="content">
        ${renderCurrentView()}
      </main>
    </div>
  `;

  bindNav();
}

function renderLogin() {
  const staffUsers = appState.config.users.filter(u => u.role !== 'cadet');
  return `
    <div class="login-shell">
      <div class="login-box">
        <div class="login-header">
          <div class="brand-mark large"><span></span><span></span><span></span></div>
          <div>
            <h2>${escapeHtml(appState.config.portalName)}</h2>
            <small>${escapeHtml(appState.config.portalSubtitle)}</small>
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
              ${staffUsers.map(u => `<option value="${u.id}">${escapeHtml(u.name)} (${escapeHtml(u.role)})</option>`).join('')}
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
  document.querySelectorAll('[data-mode]').forEach(button => {
    button.addEventListener('click', () => {
      appState.loginMode = button.dataset.mode;
      renderApp();
    });
  });
}

function submitLogin() {
  const pass = document.getElementById('loginPassword').value;

  if (appState.loginMode === 'staff') {
    const selectedUserId = document.getElementById('staffUser').value;
    const user = appState.config.users.find(u => u.id === selectedUserId);
    if (user && user.password === pass) {
      appState.currentUser = user;
      renderApp();
      return;
    }
  } else {
    const regNo = document.getElementById('cadetReg').value.trim();
    const name = document.getElementById('cadetName').value.trim();
    const user = appState.config.users.find(u => u.role === 'cadet' && u.regNo === regNo && u.name === name);
    const cadet = appState.cadets.find(c => c.regNo === regNo && c.name.toLowerCase() === name.toLowerCase());
    if (user && cadet && user.password === pass) {
      appState.currentUser = user;
      appState.currentUser.cadetId = cadet.id;
      renderApp();
      return;
    }
  }

  alert('Invalid user or password');
}

function logout() {
  appState.currentUser = null;
  renderApp();
}

function bindNav() {
  document.querySelectorAll('[data-nav]').forEach(button => {
    button.addEventListener('click', () => {
      appState.currentView = button.dataset.nav;
      renderApp();
    });
  });
}

function renderCurrentView() {
  if (!appState.currentUser) return '';

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

  return (map[appState.currentView] || renderDashboard)();
}

function renderDashboard() {
  const role = appState.currentUser.role;
  const cards = (() => {
    if (role === 'admin') {
      return [
        { label: 'Cadets', value: appState.cadets.length },
        { label: 'NRs', value: appState.nrs.length },
        { label: 'Letters', value: appState.letters.length },
        { label: 'Finance Balance', value: fmtMoney(getFinanceBalance()) },
      ];
    }
    if (role === 'senior') {
      return [
        { label: 'Cadets', value: appState.cadets.length },
        { label: 'Junior Records', value: appState.nrs.length + appState.letters.length },
        { label: 'Volunteer Entries', value: appState.volunteer.length },
        { label: 'Attendance Sessions', value: appState.attendance.length },
      ];
    }
    if (role === 'junior') {
      return [
        { label: 'My NRs', value: appState.nrs.filter(n => n.createdBy === appState.currentUser.name).length },
        { label: 'My Letters', value: appState.letters.filter(l => l.createdBy === appState.currentUser.name).length },
        { label: 'Volunteer', value: appState.volunteer.filter(v => v.userId === appState.currentUser.id).length },
        { label: 'Files', value: appState.drive.filter(d => d.uploadedBy === appState.currentUser.name).length },
      ];
    }
    if (role === 'ano') {
      return [
        { label: 'Attendance %', value: '87%' },
        { label: 'NRs', value: appState.nrs.length },
        { label: 'Letters', value: appState.letters.length },
        { label: 'Finance Balance', value: fmtMoney(getFinanceBalance()) },
      ];
    }
    return [
      { label: 'Attendance', value: '92%' },
      { label: 'Volunteer Hours', value: totalVolunteerHoursForUser(appState.currentUser.id) + 'h' },
      { label: 'Uploaded Files', value: appState.drive.filter(f => f.uploadedBy === appState.currentUser.name).length },
      { label: 'My Records', value: appState.nrs.filter(n => n.createdBy === appState.currentUser.name).length + appState.letters.filter(l => l.createdBy === appState.currentUser.name).length },
    ];
  })();

  const recent = appState.activity.slice(0, 8);

  return `
    <div class="card">
      <h2>Welcome, ${escapeHtml(appState.currentUser.name)}</h2>
      <p class="muted">${escapeHtml(appState.config.portalName)} dashboard for ${escapeHtml(role.toUpperCase())} role.</p>
    </div>
    <div class="grid three">
      ${cards.map(card => `
        <div class="stat-box">
          <div class="stat-value">${escapeHtml(String(card.value))}</div>
          <div class="stat-label">${escapeHtml(card.label)}</div>
        </div>
      `).join('')}
    </div>
    <div class="card">
      <h3>Recent Activity</h3>
      ${recent.length ? recent.map(item => `
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
}

function renderNR() {
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
        <button class="primary" onclick="createNR()">Create NR</button>
      </div>
    </div>
  `;
}

function createNR() {
  const payload = {
    id: uid('nr'),
    type: document.getElementById('nrType').value,
    name: document.getElementById('nrName').value || 'New event',
    venue: document.getElementById('nrVenue').value,
    from: document.getElementById('nrFrom').value,
    to: document.getElementById('nrTo').value,
    time: document.getElementById('nrTime').value,
    status: 'Draft',
    createdBy: appState.currentUser.name,
    createdAt: Date.now(),
    rows: appState.cadets.slice(0, 5).map(c => ({ ...c })),
  };

  appState.nrs.unshift(payload);
  writeStorage('nrs', appState.nrs);
  addActivity('NR', `Created NR for ${payload.name}`);
  renderApp();
}

function renderLetters() {
  const templates = appState.config.templates.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
  return `
    <div class="card">
      <h2>Letters</h2>
      <div class="two-col">
        <div class="field">
          <label>Template</label>
          <select id="letterTemplate">${templates}</select>
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

function saveLetter() {
  const templateId = document.getElementById('letterTemplate').value;
  const template = appState.config.templates.find(t => t.id === templateId);
  const payload = {
    id: uid('letter'),
    templateId,
    name: template ? template.name : 'Letter',
    event: document.getElementById('letterEvent').value || 'General event',
    date: document.getElementById('letterDate').value || new Date().toISOString().slice(0, 10),
    venue: document.getElementById('letterVenue').value || 'N/A',
    status: 'Draft',
    createdBy: appState.currentUser.name,
    createdAt: Date.now(),
  };

  appState.letters.unshift(payload);
  writeStorage('letters', appState.letters);
  addActivity('Letter', `Created ${payload.name} for ${payload.event}`);
  renderApp();
}

function renderRecords() {
  const all = [...appState.nrs.map(n => ({ ...n, type: 'NR' })), ...appState.letters.map(l => ({ ...l, type: 'Letter' }))]
    .sort((a, b) => b.createdAt - a.createdAt);

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
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            ${all.length ? all.map(item => `
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
}

function deleteRecord(kind, id) {
  if (kind === 'NR') {
    appState.nrs = appState.nrs.filter(n => n.id !== id);
    writeStorage('nrs', appState.nrs);
  } else {
    appState.letters = appState.letters.filter(l => l.id !== id);
    writeStorage('letters', appState.letters);
  }
  addActivity('Record', `Deleted ${kind} record`);
  renderApp();
}

function renderAttendance() {
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
            ${appState.config.attendanceTypes.map(type => `<option>${escapeHtml(type)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="actions-row">
        <button class="primary" onclick="saveAttendance()">Save Attendance</button>
      </div>
    </div>
  `;
}

function saveAttendance() {
  const payload = {
    id: uid('attendance'),
    date: document.getElementById('attendanceDate').value,
    type: document.getElementById('attendanceType').value,
    createdBy: appState.currentUser.name,
    createdAt: Date.now(),
    records: Object.fromEntries(appState.cadets.map(c => [c.id, 'P'])),
  };

  appState.attendance.unshift(payload);
  writeStorage('attendance', appState.attendance);
  addActivity('Attendance', `Saved ${payload.type} for ${payload.date}`);
  renderApp();
}

function renderVolunteer() {
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

function saveVolunteer() {
  const entry = {
    id: uid('volunteer'),
    event: document.getElementById('volunteerEvent').value || 'General activity',
    date: document.getElementById('volunteerDate').value,
    hours: Number(document.getElementById('volunteerHours').value || 0),
    role: document.getElementById('volunteerRole').value || 'Volunteer',
    userId: appState.currentUser.id,
    userName: appState.currentUser.name,
    verified: false,
    createdAt: Date.now(),
  };

  appState.volunteer.unshift(entry);
  writeStorage('volunteer', appState.volunteer);
  addActivity('Volunteer', `${entry.event} logged by ${entry.userName}`);
  renderApp();
}

function totalVolunteerHoursForUser(userId) {
  return appState.volunteer.filter(v => v.userId === userId).reduce((sum, item) => sum + Number(item.hours || 0), 0);
}

function renderFinance() {
  return `
    <div class="card">
      <h2>Finance</h2>
      <div class="grid three small-gap">
        <div class="stat-box">
          <div class="stat-value">${fmtMoney(getFinanceBalance())}</div>
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
            ${appState.config.financeCategories.map(cat => `<option>${escapeHtml(cat)}</option>`).join('')}
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
}

function getFinanceBalance() {
  const income = appState.finance.filter(f => f.type === 'in').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expense = appState.finance.filter(f => f.type === 'out').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return income - expense;
}

function saveFinance() {
  const entry = {
    id: uid('finance'),
    type: document.getElementById('financeType').value,
    category: document.getElementById('financeCategory').value,
    amount: Number(document.getElementById('financeAmount').value || 0),
    reference: document.getElementById('financeRef').value || 'N/A',
    createdBy: appState.currentUser.name,
    createdAt: Date.now(),
  };

  appState.finance.unshift(entry);
  writeStorage('finance', appState.finance);
  addActivity('Finance', `Saved ${entry.category} entry ${fmtMoney(entry.amount)}`);
  renderApp();
}

function renderDrive() {
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
            ${appState.config.driveCategories.map(c => `<option>${escapeHtml(c)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="actions-row">
        <button class="primary" onclick="saveDrive()">Add Document</button>
      </div>
    </div>
  `;
}

function saveDrive() {
  const item = {
    id: uid('drive'),
    title: document.getElementById('driveTitle').value || 'Untitled document',
    category: document.getElementById('driveCategory').value,
    uploadedBy: appState.currentUser.name,
    createdAt: Date.now(),
  };

  appState.drive.unshift(item);
  writeStorage('drive', appState.drive);
  addActivity('Drive', `Uploaded ${item.title}`);
  renderApp();
}

function renderCadets() {
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
            ${appState.cadets.length ? appState.cadets.map(c => `
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
}

function renderAdmin() {
  return `
    <div class="card">
      <h2>Admin Settings</h2>

      <div class="admin-box">
        <h3>Portal</h3>
        <div class="two-col">
          <div class="field">
            <label>Portal Name</label>
            <input id="portalName" type="text" value="${escapeHtml(appState.config.portalName)}" />
          </div>
          <div class="field">
            <label>Portal Subtitle</label>
            <input id="portalSubtitle" type="text" value="${escapeHtml(appState.config.portalSubtitle)}" />
          </div>
        </div>
      </div>

      <div class="admin-box">
        <h3>Colleges</h3>
        ${appState.config.colleges.map(college => `
          <div class="inline-grid">
            <div class="field">
              <label>College Name</label>
              <input data-college-name="${escapeHtml(college.id)}" value="${escapeHtml(college.name)}" />
            </div>
            <div class="field">
              <label>Dean Title</label>
              <input data-college-dean="${escapeHtml(college.id)}" value="${escapeHtml(college.deanTitle)}" />
            </div>
          </div>
        `).join('')}
      </div>

      <div class="admin-box">
        <h3>Users</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Password</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              ${appState.config.users.map(user => `
                <tr>
                  <td>${escapeHtml(user.name)}</td>
                  <td>${escapeHtml(user.role)}</td>
                  <td>${escapeHtml(user.password || '')}</td>
                  <td><button class="danger small" onclick="deleteUser('${user.id}')">Delete</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="actions-row">
          <button class="primary" onclick="addDemoUser()">Add Demo User</button>
        </div>
      </div>

      <div class="admin-box">
        <h3>Templates</h3>
        <ul class="template-list">
          ${appState.config.templates.map(t => `<li>${escapeHtml(t.name)} — ${escapeHtml(t.group)}</li>`).join('')}
        </ul>
      </div>

      <div class="actions-row">
        <button class="primary" onclick="saveAdminSettings()">Save Settings</button>
      </div>
    </div>
  `;
}

function deleteUser(id) {
  appState.config.users = appState.config.users.filter(u => u.id !== id);
  persistConfig();
  renderApp();
}

function addDemoUser() {
  const name = prompt('User name?', 'New User');
  if (!name) return;
  const role = prompt('Role (admin/senior/junior/ano/cadet)?', 'junior');
  if (!role) return;
  const password = prompt('Password?', '123456');
  if (!password) return;

  appState.config.users.push({
    id: uid('u'),
    name,
    role,
    password,
    regNo: role === 'cadet' ? 'TN-' + (appState.cadets.length + 1).toString().padStart(2, '0') : undefined,
  });

  persistConfig();
  renderApp();
}

function saveAdminSettings() {
  const portalName = document.getElementById('portalName').value.trim() || 'NCC Army Wing';
  const portalSubtitle = document.getElementById('portalSubtitle').value.trim() || 'Anna University Unit Portal';
  appState.config.portalName = portalName;
  appState.config.portalSubtitle = portalSubtitle;

  document.querySelectorAll('[data-college-name]').forEach(input => {
    const id = input.getAttribute('data-college-name');
    const college = appState.config.colleges.find(c => c.id === id);
    if (college) college.name = input.value.trim() || college.name;
  });

  document.querySelectorAll('[data-college-dean]').forEach(input => {
    const id = input.getAttribute('data-college-dean');
    const college = appState.config.colleges.find(c => c.id === id);
    if (college) college.deanTitle = input.value.trim() || college.deanTitle;
  });

  persistConfig();
  addActivity('Admin', 'Updated portal settings');
  renderApp();
}

function exportSettings() {
  const payload = {
    config: appState.config,
    cadets: appState.cadets,
    nrs: appState.nrs,
    letters: appState.letters,
    attendance: appState.attendance,
    volunteer: appState.volunteer,
    finance: appState.finance,
    drive: appState.drive,
    activity: appState.activity,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ncc-army-portal-backup.json';
  a.click();
  URL.revokeObjectURL(url);
}

window.exportSettings = exportSettings;
window.logout = logout;
window.submitLogin = submitLogin;
window.createNR = createNR;
window.saveLetter = saveLetter;
window.deleteRecord = deleteRecord;
window.saveAttendance = saveAttendance;
window.saveVolunteer = saveVolunteer;
window.saveFinance = saveFinance;
window.saveDrive = saveDrive;
window.saveAdminSettings = saveAdminSettings;
window.deleteUser = deleteUser;
window.addDemoUser = addDemoUser;

renderApp();
