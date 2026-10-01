const STORAGE_KEY = 'ncc_portal_v1';

const DEFAULT_CONFIG = {
  portalName: 'NCC Army Wing',
  portalSubtitle: 'Anna University Unit Portal',
  users: [
    { id: 'admin-1', name: 'Admin', role: 'admin', password: 'admin123' },
    { id: 'senior-1', name: 'Senior Cadet 1', role: 'senior', password: 'senior123' },
    { id: 'junior-1', name: 'Junior Cadet 1', role: 'junior', password: 'junior123' },
    { id: 'ano-1', name: 'ANO 1', role: 'ano', password: 'ano123' },
    { id: 'cadet-1', name: 'Cadet 01', role: 'cadet', password: 'cadet123', regNo: 'TN-01' },
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
  letterheads: {
    common: 'NCC ARMY WING\nAnna University\nTamil Nadu',
    ano: 'NCC ARMY WING\nOffice of the ANO\nAnna University',
    ceg: 'COLLEGE OF ENGINEERING, GUINDY\nAnna University\nTamil Nadu',
    act: 'ALAGAPPA COLLEGE OF TECHNOLOGY\nAnna University\nTamil Nadu',
  },
  templates: [
    {
      id: 'od',
      name: 'OD Letter',
      group: 'dean',
      subject: 'OD permission for {event}',
      body: 'This is to request permission for {event} on {when} at {venue}.\n\nWe request the necessary approval and oblige.'
    },
    {
      id: 'gate',
      name: 'Gate Opening',
      group: 'dean',
      subject: 'Gate opening permission for {event}',
      body: 'We request permission to open the gate for {event} on {when} at {venue}.\n\nKindly accord permission and oblige.'
    },
    {
      id: 'co-general',
      name: 'Commanding Officer Letter',
      group: 'co',
      subject: '{event}',
      body: 'We request your permission for {event} on {when} at {venue}.\n\nKindly consider and oblige.'
    },
  ],
  nrColumns: ['Regt. No', 'Rank', 'Name', 'Department', 'Year', 'Platoon', 'Phone'],
  attendanceTypes: ['Daily Parade', 'Drill', 'Training class', 'Camp', 'Other'],
  financeCategories: ['Camp', 'Event', 'Equipment', 'Refreshments', 'Stationery', 'Travel', 'Other'],
  driveCategories: ['Nominal Roll', 'Letter', 'Signed Copy', 'Bill', 'Certificate', 'Other'],
  statuses: ['Draft', 'Sent for signature', 'Signed', 'Submitted'],
  theme: {
    primary: '#123b7a',
    accent: '#c2212b',
  }
};

const state = {
  currentUser: null,
  currentView: 'dashboard',
  config: loadConfig(),
  cadets: loadCadets(),
  nrs: loadData('nrs', []),
  letters: loadData('letters', []),
  attendance: loadData('attendance', []),
  volunteer: loadData('volunteer', []),
  finance: loadData('finance', []),
  drive: loadData('drive', []),
  activity: loadData('activity', []),
};

function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function loadConfig() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return structuredClone(DEFAULT_CONFIG);

  try {
    const parsed = JSON.parse(stored);
    return { ...structuredClone(DEFAULT_CONFIG), ...parsed };
  } catch {
    return structuredClone(DEFAULT_CONFIG);
  }
}

function saveConfig() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.config));
}

function loadCadets() {
  const stored = localStorage.getItem(`${STORAGE_KEY}-cadets`);
  if (!stored) return [
    { id: 'c1', regNo: 'TN-01', rank: 'Cadet', name: 'Demo Cadet 1', dept: 'Mechanical', year: 'II', platoon: 'Engineers', phone: '0000000000' },
    { id: 'c2', regNo: 'TN-02', rank: 'Cadet', name: 'Demo Cadet 2', dept: 'EEE', year: 'II', platoon: 'EME', phone: '0000000001' },
    { id: 'c3', regNo: 'TN-03', rank: 'Cadet', name: 'Demo Cadet 3', dept: 'CSE', year: 'III', platoon: 'Signals', phone: '0000000002' },
  ];
  try { return JSON.parse(stored); } catch { return []; }
}

function saveCadets() {
  localStorage.setItem(`${STORAGE_KEY}-cadets`, JSON.stringify(state.cadets));
}

function loadData(key, fallback) {
  const stored = localStorage.getItem(`${STORAGE_KEY}-${key}`);
  if (!stored) return fallback;
  try { return JSON.parse(stored); } catch { return fallback; }
}

function saveData(key, value) {
  localStorage.setItem(`${STORAGE_KEY}-${key}`, JSON.stringify(value));
}

function logActivity(type, text) {
  state.activity.unshift({
    id: uid('act'),
    type,
    text,
    timestamp: Date.now(),
    user: state.currentUser ? state.currentUser.name : 'System',
  });
  saveData('activity', state.activity);
}

function renderApp() {
  const app = document.getElementById('app');

  if (!state.currentUser) {
    app.innerHTML = renderLoginScreen();
    bindLoginEvents();
    return;
  }

  app.innerHTML = `
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">
          <span></span><span></span><span></span>
        </div>
        <div>
          <div>${escapeHtml(state.config.portalName)}</div>
          <small>${escapeHtml(state.config.portalSubtitle)}</small>
        </div>
      </div>
      <div class="user-box">
        <span>${escapeHtml(state.currentUser.name)}</span>
        <span class="role-pill">${state.currentUser.role.toUpperCase()}</span>
        <button class="ghost" onclick="logout()">Logout</button>
      </div>
    </header>
    <div class="layout">
      <aside class="sidebar">
        ${renderNav()}
      </aside>
      <main class="content">
        ${renderCurrentView()}
      </main>
    </div>
  `;

  bindViewActions();
}

function renderLoginScreen() {
  return `
    <div class="login-box">
      <h2>Login</h2>
      <div class="switcher">
        <button class="active" data-role-switch="staff">Staff</button>
        <button data-role-switch="cadet">Cadet</button>
      </div>
      <div id="staff-login-box">
        <div class="field">
          <label>User</label>
          <select id="loginUser">
            ${state.config.users.filter(u => u.role !== 'cadet').map(u => `<option value="${u.id}">${escapeHtml(u.name)} (${u.role})</option>`).join('')}
          </select>
        </div>
      </div>
      <div id="cadet-login-box" class="hidden">
        <div class="field">
          <label>Regimental No</label>
          <input id="cadetReg" type="text" placeholder="TN-01" />
        </div>
        <div class="field">
          <label>Cadet Name</label>
          <input id="cadetName" type="text" placeholder="Name" />
        </div>
      </div>
      <div class="field">
        <label>Password</label>
        <input id="loginPassword" type="password" placeholder="Password" />
      </div>
      <button class="primary" style="width:100%; margin-top: 10px;" onclick="submitLogin()">Login</button>
    </div>
  `;
}

function bindLoginEvents() {
  document.querySelectorAll('[data-role-switch]').forEach(btn => {
    btn.onclick = () => {
      const mode = btn.getAttribute('data-role-switch');
      const staffBox = document.getElementById('staff-login-box');
      const cadetBox = document.getElementById('cadet-login-box');

      if (mode === 'staff') {
        staffBox.classList.remove('hidden');
        cadetBox.classList.add('hidden');
        btn.classList.add('active');
        btn.parentElement.querySelector('[data-role-switch="cadet"]').classList.remove('active');
      } else {
        cadetBox.classList.remove('hidden');
        staffBox.classList.add('hidden');
        btn.classList.add('active');
        btn.parentElement.querySelector('[data-role-switch="staff"]').classList.remove('active');
      }
    };
  });
}

function submitLogin() {
  const staffMode = !document.getElementById('cadet-login-box').classList.contains('hidden');
  const password = document.getElementById('loginPassword').value;

  if (staffMode) {
    const id = document.getElementById('loginUser').value;
    const user = state.config.users.find(u => u.id === id);

    if (user && user.password === password) {
      state.currentUser = user;
      renderApp();
      return;
    }
  } else {
    const regNo = document.getElementById('cadetReg').value.trim();
    const name = document.getElementById('cadetName').value.trim();
    const cadet = state.cadets.find(c => c.regNo === regNo && c.name.toLowerCase() === name.toLowerCase());
    const user = state.config.users.find(u => u.role === 'cadet' && u.regNo === regNo && u.name === name);

    if (cadet && user && user.password === password) {
      state.currentUser = user;
      state.currentUser.cadetId = cadet.id;
      renderApp();
      return;
    }
  }

  alert('Invalid login');
}

function logout() {
  state.currentUser = null;
  renderApp();
}

function renderNav() {
  const nav = [
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
  ];

  return nav.map(item => {
    const role = state.currentUser.role;
    if ((role === 'cadet' && ['admin', 'cadets'].includes(item.id)) || (role === 'ano' && ['admin', 'nr', 'letters', 'finance'].includes(item.id))) {
      return '';
    }

    return `<button class="nav-btn ${state.currentView === item.id ? 'active' : ''}" data-nav="${item.id}">${item.label}</button>`;
  }).join('');
}

function renderCurrentView() {
  switch (state.currentView) {
    case 'dashboard': return renderDashboard();
    case 'nr': return renderNR();
    case 'letters': return renderLetters();
    case 'records': return renderRecords();
    case 'attendance': return renderAttendance();
    case 'volunteer': return renderVolunteer();
    case 'finance': return renderFinance();
    case 'drive': return renderDrive();
    case 'cadets': return renderCadets();
    case 'admin': return renderAdmin();
    default: return renderDashboard();
  }
}

function renderDashboard() {
  const role = state.currentUser.role;
  let cards = [];

  if (role === 'cadet') {
    cards = [
      { label: 'Attendance', value: '92%' },
      { label: 'Volunteer Hours', value: '14.5h' },
      { label: 'Docs Uploaded', value: '4' },
    ];
  } else if (role === 'junior') {
    cards = [
      { label: 'NR Created', value: String(state.nrs.length) },
      { label: 'Letters', value: String(state.letters.length) },
      { label: 'Volunteer Entries', value: String(state.volunteer.filter(v => v.userId === state.currentUser.id).length) },
      { label: 'Attendance', value: '85%' },
    ];
  } else if (role === 'senior' || role === 'admin') {
    cards = [
      { label: 'Cadets', value: String(state.cadets.length) },
      { label: 'NRs', value: String(state.nrs.length) },
      { label: 'Letters', value: String(state.letters.length) },
      { label: 'Finance', value: '₹' + getFinanceBalance() },
    ];
  } else if (role === 'ano') {
    cards = [
      { label: 'Attendance %', value: '87%' },
      { label: 'NRs', value: String(state.nrs.length) },
      { label: 'Letters', value: String(state.letters.length) },
      { label: 'Balance', value: '₹' + getFinanceBalance() },
    ];
  }

  return `
    <div class="card">
      <h2>Welcome, ${escapeHtml(state.currentUser.name)}</h2>
      <p class="muted">${escapeHtml(state.config.portalName)} dashboard for ${role.toUpperCase()} role.</p>
    </div>
    <div class="grid">
      ${cards.map(c => `
        <div class="stat">
          <div class="stat-value">${escapeHtml(c.value)}</div>
          <div>${escapeHtml(c.label)}</div>
        </div>
      `).join('')}
    </div>
    <div class="card">
      <h3>Recent Activity</h3>
      ${state.activity.length ? state.activity.slice(0, 6).map(item => `
        <div class="row" style="margin-bottom: 8px; justify-content: space-between;">
          <span>${escapeHtml(item.user)}</span>
          <span class="muted">${new Date(item.timestamp).toLocaleString()}</span>
        </div>
        <div>${escapeHtml(item.type)}: ${escapeHtml(item.text)}</div>
      `).join('<hr>') : '<p class="muted">No recent activity.</p>'}
    </div>
  `;
}

function renderNR() {
  return `
    <div class="card">
      <h2>Create Nominal Roll</h2>
      <div class="col-2">
        <div>
          <label>Event Type</label>
          <select id="nrType">
            <option>Camp</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label>Event Name</label>
          <input id="nrName" type="text" placeholder="Annual Training Camp" />
        </div>
        <div>
          <label>Venue</label>
          <input id="nrVenue" type="text" placeholder="Venue" />
        </div>
        <div>
          <label>From Date</label>
          <input id="nrFrom" type="date" />
        </div>
        <div>
          <label>To Date</label>
          <input id="nrTo" type="date" />
        </div>
        <div>
          <label>Reporting Time</label>
          <input id="nrTime" type="time" />
        </div>
      </div>
      <div style="margin-top: 18px;">
        <button class="primary" onclick="createNR()">Create NR</button>
      </div>
    </div>
  `;
}

function createNR() {
  const payload = {
    id: uid('nr'),
    type: document.getElementById('nrType').value,
    name: document.getElementById('nrName').value || 'New Event',
    venue: document.getElementById('nrVenue').value,
    from: document.getElementById('nrFrom').value,
    to: document.getElementById('nrTo').value,
    time: document.getElementById('nrTime').value,
    status: 'Draft',
    createdBy: state.currentUser.name,
    createdAt: Date.now(),
    rows: state.cadets.slice(0, 5).map(c => ({ ...c }))
  };

  state.nrs.unshift(payload);
  saveData('nrs', state.nrs);
  logActivity('NR', `Created NR for ${payload.name}`);
  renderApp();
}

function renderLetters() {
  const templateOptions = state.config.templates.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');

  return `
    <div class="card">
      <h2>Letters</h2>
      <div class="col-2">
        <div>
          <label>Template</label>
          <select id="letterTemplate">
            ${templateOptions}
          </select>
        </div>
        <div>
          <label>Event Name</label>
          <input id="letterEvent" type="text" placeholder="Camp or event" />
        </div>
        <div>
          <label>Date</label>
          <input id="letterDate" type="date" />
        </div>
        <div>
          <label>Venue</label>
          <input id="letterVenue" type="text" placeholder="Venue" />
        </div>
      </div>
      <div style="margin-top: 18px;">
        <button class="primary" onclick="saveLetter()">Save Letter</button>
      </div>
    </div>
  `;
}

function saveLetter() {
  const templateId = document.getElementById('letterTemplate').value;
  const template = state.config.templates.find(t => t.id === templateId);
  const payload = {
    id: uid('letter'),
    templateId,
    name: template ? template.name : 'Letter',
    event: document.getElementById('letterEvent').value || 'General event',
    date: document.getElementById('letterDate').value || new Date().toISOString().slice(0, 10),
    venue: document.getElementById('letterVenue').value || 'N/A',
    status: 'Draft',
    createdBy: state.currentUser.name,
    createdAt: Date.now(),
  };

  state.letters.unshift(payload);
  saveData('letters', state.letters);
  logActivity('Letter', `Created ${payload.name} for ${payload.event}`);
  renderApp();
}

function renderRecords() {
  const allRecords = [...state.nrs.map(r => ({ ...r, kind: 'NR' })), ...state.letters.map(r => ({ ...r, kind: 'Letter' }))]
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${allRecords.length ? allRecords.map(r => `
              <tr>
                <td>${escapeHtml(r.kind)}</td>
                <td>${escapeHtml(r.name || r.event)}</td>
                <td><span class="badge ${r.status === 'Draft' ? 'warn' : r.status === 'Signed' || r.status === 'Submitted' ? '' : 'warn'}">${escapeHtml(r.status)}</span></td>
                <td>${escapeHtml(r.createdBy)}</td>
                <td><button class="ghost" onclick="deleteRecord('${r.id}', '${r.kind}')">Delete</button></td>
              </tr>
            `).join('') : '<tr><td colspan="5">No records yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function deleteRecord(id, kind) {
  if (kind === 'NR') {
    state.nrs = state.nrs.filter(item => item.id !== id);
    saveData('nrs', state.nrs);
  } else {
    state.letters = state.letters.filter(item => item.id !== id);
    saveData('letters', state.letters);
  }

  renderApp();
}

function renderAttendance() {
  return `
    <div class="card">
      <h2>Attendance</h2>
      <div class="col-2">
        <div>
          <label>Date</label>
          <input id="attendanceDate" type="date" value="${new Date().toISOString().slice(0, 10)}" />
        </div>
        <div>
          <label>Session Type</label>
          <select id="attendanceType">
            ${state.config.attendanceTypes.map(v => `<option>${escapeHtml(v)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="margin-top: 18px;">
        <button class="primary" onclick="saveAttendance()">Save Attendance</button>
      </div>
    </div>
  `;
}

function saveAttendance() {
  const date = document.getElementById('attendanceDate').value;
  const type = document.getElementById('attendanceType').value;

  const payload = {
    id: uid('attendance'),
    date,
    type,
    createdBy: state.currentUser.name,
    createdAt: Date.now(),
    records: state.cadets.reduce((acc, cadet) => {
      acc[cadet.id] = 'P';
      return acc;
    }, {}),
  };

  state.attendance.unshift(payload);
  saveData('attendance', state.attendance);
  logActivity('Attendance', `Saved ${type} for ${date}`);
  renderApp();
}

function renderVolunteer() {
  return `
    <div class="card">
      <h2>Volunteer Work</h2>
      <div class="col-2">
        <div>
          <label>Activity</label>
          <input id="volunteerEvent" type="text" placeholder="Event / Activity" />
        </div>
        <div>
          <label>Date</label>
          <input id="volunteerDate" type="date" value="${new Date().toISOString().slice(0, 10)}" />
        </div>
        <div>
          <label>Hours</label>
          <input id="volunteerHours" type="number" min="1" value="1" />
        </div>
        <div>
          <label>Role</label>
          <input id="volunteerRole" type="text" placeholder="Role / duty" />
        </div>
      </div>
      <div style="margin-top: 18px;">
        <button class="primary" onclick="saveVolunteer()">Add Volunteer Work</button>
      </div>
    </div>
  `;
}

function saveVolunteer() {
  const entry = {
    id: uid('volunteer'),
    event: document.getElementById('volunteerEvent').value || 'General activity',
    date: document.getElementById('volunteerDate').value,
    hours: Number(document.getElementById('volunteerHours').value || 1),
    role: document.getElementById('volunteerRole').value || 'Volunteer',
    userId: state.currentUser.id,
    userName: state.currentUser.name,
    verified: false,
  };

  state.volunteer.unshift(entry);
  saveData('volunteer', state.volunteer);
  logActivity('Volunteer', `${entry.event} logged by ${entry.userName}`);
  renderApp();
}

function renderFinance() {
  return `
    <div class="card">
      <h2>Finance</h2>
      <div class="grid">
        <div class="stat">
          <div class="stat-value">₹${getFinanceBalance()}</div>
          <div>Balance</div>
        </div>
      </div>
      <div class="col-2" style="margin-top: 18px;">
        <div>
          <label>Type</label>
          <select id="financeType">
            <option value="in">Money Received</option>
            <option value="out">Money Spent</option>
          </select>
        </div>
        <div>
          <label>Category</label>
          <select id="financeCategory">
            ${state.config.financeCategories.map(v => `<option>${escapeHtml(v)}</option>`).join('')}
          </select>
        </div>
        <div>
          <label>Amount</label>
          <input id="financeAmount" type="number" min="0" value="0" />
        </div>
        <div>
          <label>Reference / Bill</label>
          <input id="financeRef" type="text" placeholder="Bill no or reference" />
        </div>
      </div>
      <div style="margin-top: 18px;">
        <button class="primary" onclick="saveFinance()">Add Entry</button>
      </div>
    </div>
  `;
}

function getFinanceBalance() {
  const income = state.finance.filter(item => item.type === 'in').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expense = state.finance.filter(item => item.type === 'out').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return Math.max(0, income - expense);
}

function saveFinance() {
  const entry = {
    id: uid('finance'),
    type: document.getElementById('financeType').value,
    category: document.getElementById('financeCategory').value,
    amount: Number(document.getElementById('financeAmount').value || 0),
    reference: document.getElementById('financeRef').value || 'N/A',
    createdBy: state.currentUser.name,
    createdAt: Date.now(),
  };

  state.finance.unshift(entry);
  saveData('finance', state.finance);
  logActivity('Finance', `Finance entry: ${entry.category} ${entry.amount}`);
  renderApp();
}

function renderDrive() {
  return `
    <div class="card">
      <h2>Drive</h2>
      <div class="col-2">
        <div>
          <label>Title</label>
          <input id="driveTitle" type="text" placeholder="Document title" />
        </div>
        <div>
          <label>Category</label>
          <select id="driveCategory">
            ${state.config.driveCategories.map(v => `<option>${escapeHtml(v)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="margin-top: 18px;">
        <button class="primary" onclick="saveDrive()">Add Document</button>
      </div>
    </div>
  `;
}

function saveDrive() {
  const item = {
    id: uid('drive'),
    title: document.getElementById('driveTitle').value || 'Document',
    category: document.getElementById('driveCategory').value,
    uploadedBy: state.currentUser.name,
    createdAt: Date.now(),
  };

  state.drive.unshift(item);
  saveData('drive', state.drive);
  logActivity('Drive', `Uploaded ${item.title}`);
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
            ${state.cadets.map(c => `
              <tr>
                <td>${escapeHtml(c.regNo)}</td>
                <td>${escapeHtml(c.rank)}</td>
                <td>${escapeHtml(c.name)}</td>
                <td>${escapeHtml(c.dept)}</td>
                <td>${escapeHtml(c.year)}</td>
                <td>${escapeHtml(c.platoon)}</td>
                <td>${escapeHtml(c.phone)}</td>
              </tr>
            `).join('')}
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
      <div class="admin-editor-box">
        <h3>Portal Details</h3>
        <div class="col-2">
          <div>
            <label>Portal Name</label>
            <input id="portalName" type="text" value="${escapeHtml(state.config.portalName)}" />
          </div>
          <div>
            <label>Portal Subtitle</label>
            <input id="portalSubtitle" type="text" value="${escapeHtml(state.config.portalSubtitle)}" />
          </div>
        </div>
      </div>

      <div class="admin-editor-box">
        <h3>Colleges</h3>
        ${state.config.colleges.map(college => `
          <div class="col-2" style="margin-bottom: 10px;">
            <div>
              <label>College Name</label>
              <input value="${escapeHtml(college.name)}" data-edit-college-name="${college.id}" />
            </div>
            <div>
              <label>Dean Title</label>
              <input value="${escapeHtml(college.deanTitle)}" data-edit-college-dean="${college.id}" />
            </div>
          </div>
        `).join('')}
      </div>

      <div class="admin-editor-box">
        <h3>Letter Templates</h3>
        ${state.config.templates.map(t => `
          <div style="margin-bottom: 10px; border-bottom: 1px solid var(--line); padding-bottom: 8px;">
            <strong>${escapeHtml(t.name)}</strong>
            <p class="muted small">${escapeHtml(t.subject)}</p>
          </div>
        `).join('')}
      </div>

      <div style="margin-top: 18px;">
        <button class="primary" onclick="saveAdminSettings()">Save Admin Settings</button>
      </div>
    </div>
  `;
}

function saveAdminSettings() {
  state.config.portalName = document.getElementById('portalName').value || 'NCC Army Wing';
  state.config.portalSubtitle = document.getElementById('portalSubtitle').value || 'Anna University Unit Portal';

  document.querySelectorAll('[data-edit-college-name]').forEach(input => {
    const id = input.getAttribute('data-edit-college-name');
    const college = state.config.colleges.find(c => c.id === id);
    if (college) college.name = input.value;
  });

  document.querySelectorAll('[data-edit-college-dean]').forEach(input => {
    const id = input.getAttribute('data-edit-college-dean');
    const college = state.config.colleges.find(c => c.id === id);
    if (college) college.deanTitle = input.value;
  });

  saveConfig();
  logActivity('Admin', 'Updated portal admin settings');
  renderApp();
}

function bindViewActions() {
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.onclick = () => {
      state.currentView = btn.getAttribute('data-nav');
      renderApp();
    };
  });
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

renderApp();
