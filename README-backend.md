require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'ncc-dev-secret';
const DATA_FILE = path.join(__dirname, 'data.json');

const DEFAULT_DATA = {
  users: [
    { id: 'u-admin', name: 'Admin', role: 'admin', password: 'admin123' },
    { id: 'u-senior', name: 'Senior Cadet 1', role: 'senior', password: 'senior123' },
    { id: 'u-junior', name: 'Junior Cadet 1', role: 'junior', password: 'junior123' },
    { id: 'u-ano', name: 'ANO 1', role: 'ano', password: 'ano123' },
    { id: 'u-cadet', name: 'Cadet 01', role: 'cadet', password: 'cadet123', regNo: 'TN-01' },
  ],
  cadets: [
    { id: 'c1', regNo: 'TN-01', rank: 'Cadet', name: 'Demo Cadet 1', dept: 'Mechanical', year: 'II', platoon: 'Engineers', phone: '0000000000' },
    { id: 'c2', regNo: 'TN-02', rank: 'Cadet', name: 'Demo Cadet 2', dept: 'EEE', year: 'II', platoon: 'EME', phone: '0000000001' },
    { id: 'c3', regNo: 'TN-03', rank: 'Cadet', name: 'Demo Cadet 3', dept: 'CSE', year: 'III', platoon: 'Signals', phone: '0000000002' },
  ],
  nrs: [],
  letters: [],
  attendance: [],
  volunteer: [],
  finance: [],
  drive: [],
  activity: [],
  settings: {
    portalName: 'NCC Army Wing',
    portalSubtitle: 'Anna University Unit Portal',
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
    attendanceTypes: ['Daily parade', 'Drill', 'Training class', 'Camp', 'Other'],
    financeCategories: ['Camp', 'Event', 'Equipment', 'Refreshments', 'Stationery', 'Travel', 'Other'],
    driveCategories: ['Nominal Roll', 'Letter', 'Signed copy', 'Bill', 'Certificate', 'Other'],
    statuses: ['Draft', 'Sent for signature', 'Signed', 'Submitted'],
    theme: { primary: '#123b7a', accent: '#c2212b' }
  }
};

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
  }
}

function readDataStore() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (!raw.trim()) return structuredClone(DEFAULT_DATA);
    return JSON.parse(raw);
  } catch (error) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
    return structuredClone(DEFAULT_DATA);
  }
}

function writeDataStore(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const dataStore = readDataStore();
let pgClient = null;

async function initPostgres() {
  if (!process.env.DATABASE_URL) {
    console.log('PostgreSQL not configured; using JSON file storage.');
    return null;
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        password TEXT NOT NULL,
        reg_no TEXT
      );
      CREATE TABLE IF NOT EXISTS cadets (
        id TEXT PRIMARY KEY,
        reg_no TEXT NOT NULL,
        rank TEXT,
        name TEXT NOT NULL,
        dept TEXT,
        year TEXT,
        platoon TEXT,
        phone TEXT
      );
      CREATE TABLE IF NOT EXISTS nrs (
        id TEXT PRIMARY KEY,
        name TEXT,
        type TEXT,
        venue TEXT,
        from_date TEXT,
        to_date TEXT,
        time TEXT,
        status TEXT,
        created_by TEXT,
        created_at BIGINT
      );
      CREATE TABLE IF NOT EXISTS letters (
        id TEXT PRIMARY KEY,
        name TEXT,
        event TEXT,
        date TEXT,
        venue TEXT,
        status TEXT,
        created_by TEXT,
        created_at BIGINT
      );
      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        date TEXT,
        type TEXT,
        created_by TEXT,
        created_at BIGINT
      );
      CREATE TABLE IF NOT EXISTS volunteer (
        id TEXT PRIMARY KEY,
        event TEXT,
        date TEXT,
        hours REAL,
        role TEXT,
        user_id TEXT,
        user_name TEXT,
        verified BOOLEAN,
        created_at BIGINT
      );
      CREATE TABLE IF NOT EXISTS finance (
        id TEXT PRIMARY KEY,
        type TEXT,
        category TEXT,
        amount REAL,
        reference TEXT,
        created_by TEXT,
        created_at BIGINT
      );
      CREATE TABLE IF NOT EXISTS drive (
        id TEXT PRIMARY KEY,
        title TEXT,
        category TEXT,
        uploaded_by TEXT,
        created_at BIGINT
      );
      CREATE TABLE IF NOT EXISTS activity (
        id TEXT PRIMARY KEY,
        type TEXT,
        text TEXT,
        timestamp BIGINT,
        user_name TEXT
      );
    `);

    pgClient = client;
    console.log('PostgreSQL connected successfully.');
  } catch (error) {
    console.warn('PostgreSQL connection failed, falling back to file storage.');
    console.warn(error.message);
  }
}

function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function issueToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, role: user.role, regNo: user.regNo || null },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function addActivity(type, text, userName) {
  dataStore.activity.unshift({
    id: uid('act'),
    type,
    text,
    timestamp: Date.now(),
    user: userName || 'System',
  });
  writeDataStore(dataStore);
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return res.status(401).json({ message: 'Missing token' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function roleCheck(roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: pgClient ? 'postgres' : 'json-file',
    timestamp: Date.now(),
    database: process.env.DATABASE_URL ? 'configured' : 'not-configured',
  });
});

app.post('/api/auth/login', (req, res) => {
  const { user, password, regNo, name } = req.body;

  let account = null;
  if (regNo && name) {
    account = dataStore.users.find((u) => u.role === 'cadet' && u.regNo === regNo && u.name === name);
  } else if (user) {
    account = dataStore.users.find((u) => u.id === user || u.name === user);
  }

  if (!account || account.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = issueToken(account);
  res.json({
    token,
    user: { id: account.id, name: account.name, role: account.role, regNo: account.regNo || null },
  });
});

app.post('/api/auth/register', authMiddleware, roleCheck(['admin']), (req, res) => {
  const { name, role, password, regNo } = req.body;
  if (!name || !role || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const existing = dataStore.users.find((u) => u.name === name || (regNo && u.regNo === regNo));
  if (existing) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const user = {
    id: uid('u'),
    name,
    role,
    password,
    regNo: role === 'cadet' ? regNo || `TN-${String(dataStore.cadets.length + 1).padStart(2, '0')}` : undefined,
  };

  dataStore.users.push(user);
  writeDataStore(dataStore);
  addActivity('User', `Added ${user.name} (${user.role})`, req.user.name);

  res.status(201).json({ user: { id: user.id, name: user.name, role: user.role, regNo: user.regNo || null } });
});

app.get('/api/dashboard', authMiddleware, (req, res) => {
  const summary = {
    cadets: dataStore.cadets.length,
    nrs: dataStore.nrs.length,
    letters: dataStore.letters.length,
    attendance: dataStore.attendance.length,
    volunteer: dataStore.volunteer.length,
    finance: dataStore.finance.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    drive: dataStore.drive.length,
    recentActivity: dataStore.activity.slice(0, 10),
  };
  res.json(summary);
});

app.get('/api/settings', authMiddleware, (req, res) => {
  res.json({ settings: dataStore.settings });
});

app.put('/api/settings', authMiddleware, roleCheck(['admin']), (req, res) => {
  dataStore.settings = { ...dataStore.settings, ...req.body };
  writeDataStore(dataStore);
  addActivity('Settings', 'Updated portal settings', req.user.name);
  res.json({ settings: dataStore.settings });
});

app.get('/api/backup', authMiddleware, roleCheck(['admin']), (req, res) => {
  const backup = {
    users: dataStore.users,
    cadets: dataStore.cadets,
    nrs: dataStore.nrs,
    letters: dataStore.letters,
    attendance: dataStore.attendance,
    volunteer: dataStore.volunteer,
    finance: dataStore.finance,
    drive: dataStore.drive,
    activity: dataStore.activity,
    settings: dataStore.settings,
  };
  res.json(backup);
});

app.post('/api/settings/import', authMiddleware, roleCheck(['admin']), (req, res) => {
  const imported = req.body;
  if (!imported || !imported.settings) {
    return res.status(400).json({ message: 'Invalid backup payload' });
  }

  Object.assign(dataStore, {
    users: imported.users || dataStore.users,
    cadets: imported.cadets || dataStore.cadets,
    nrs: imported.nrs || dataStore.nrs,
    letters: imported.letters || dataStore.letters,
    attendance: imported.attendance || dataStore.attendance,
    volunteer: imported.volunteer || dataStore.volunteer,
    finance: imported.finance || dataStore.finance,
    drive: imported.drive || dataStore.drive,
    activity: imported.activity || dataStore.activity,
    settings: imported.settings || dataStore.settings,
  });

  writeDataStore(dataStore);
  addActivity('Settings', 'Imported portal backup', req.user.name);
  res.json({ message: 'Backup imported successfully', settings: dataStore.settings });
});

app.get('/api/cadets', authMiddleware, (req, res) => {
  res.json({ cadets: dataStore.cadets });
});

app.post('/api/cadets', authMiddleware, roleCheck(['admin', 'senior']), (req, res) => {
  const cadet = { id: uid('c'), ...req.body };
  dataStore.cadets.push(cadet);
  writeDataStore(dataStore);
  addActivity('Cadet', `Added cadet ${cadet.name}`, req.user.name);
  res.status(201).json({ cadet });
});

app.put('/api/cadets/:id', authMiddleware, roleCheck(['admin', 'senior']), (req, res) => {
  const index = dataStore.cadets.findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Cadet not found' });

  dataStore.cadets[index] = { ...dataStore.cadets[index], ...req.body };
  writeDataStore(dataStore);
  res.json({ cadet: dataStore.cadets[index] });
});

app.delete('/api/cadets/:id', authMiddleware, roleCheck(['admin']), (req, res) => {
  dataStore.cadets = dataStore.cadets.filter((c) => c.id !== req.params.id);
  writeDataStore(dataStore);
  res.json({ deleted: true });
});

app.get('/api/nrs', authMiddleware, (req, res) => {
  res.json({ nrs: dataStore.nrs });
});

app.post('/api/nrs', authMiddleware, roleCheck(['admin', 'senior', 'junior']), (req, res) => {
  const payload = { id: uid('nr'), ...req.body, createdAt: Date.now(), createdBy: req.user.name };
  dataStore.nrs.unshift(payload);
  writeDataStore(dataStore);
  addActivity('NR', `Created NR ${payload.name || 'New Event'}`, req.user.name);
  res.status(201).json({ nr: payload });
});

app.get('/api/letters', authMiddleware, (req, res) => {
  res.json({ letters: dataStore.letters });
});

app.post('/api/letters', authMiddleware, roleCheck(['admin', 'senior', 'junior']), (req, res) => {
  const payload = { id: uid('letter'), ...req.body, createdAt: Date.now(), createdBy: req.user.name };
  dataStore.letters.unshift(payload);
  writeDataStore(dataStore);
  addActivity('Letter', `Created letter ${payload.name || 'Letter'}`, req.user.name);
  res.status(201).json({ letter: payload });
});

app.get('/api/attendance', authMiddleware, (req, res) => {
  res.json({ attendance: dataStore.attendance });
});

app.post('/api/attendance', authMiddleware, roleCheck(['admin', 'senior', 'junior', 'ano']), (req, res) => {
  const payload = { id: uid('attendance'), ...req.body, createdAt: Date.now(), createdBy: req.user.name };
  dataStore.attendance.unshift(payload);
  writeDataStore(dataStore);
  addActivity('Attendance', `Saved ${payload.type || 'session'} for ${payload.date || 'today'}`, req.user.name);
  res.status(201).json({ attendance: payload });
});

app.get('/api/volunteer', authMiddleware, (req, res) => {
  res.json({ volunteer: dataStore.volunteer });
});

app.post('/api/volunteer', authMiddleware, roleCheck(['admin', 'senior', 'junior', 'cadet']), (req, res) => {
  const payload = {
    id: uid('volunteer'),
    ...req.body,
    userId: req.user.id,
    userName: req.user.name,
    createdAt: Date.now(),
  };
  dataStore.volunteer.unshift(payload);
  writeDataStore(dataStore);
  addActivity('Volunteer', `${payload.event || 'Volunteer work'} logged by ${req.user.name}`, req.user.name);
  res.status(201).json({ volunteer: payload });
});

app.get('/api/finance', authMiddleware, (req, res) => {
  res.json({ finance: dataStore.finance });
});

app.post('/api/finance', authMiddleware, roleCheck(['admin', 'senior', 'ano']), (req, res) => {
  const payload = { id: uid('finance'), ...req.body, createdAt: Date.now(), createdBy: req.user.name };
  dataStore.finance.unshift(payload);
  writeDataStore(dataStore);
  addActivity('Finance', `Saved ${payload.category || 'finance'} entry`, req.user.name);
  res.status(201).json({ finance: payload });
});

app.get('/api/drive', authMiddleware, (req, res) => {
  res.json({ drive: dataStore.drive });
});

app.post('/api/drive', authMiddleware, roleCheck(['admin', 'senior', 'junior', 'ano', 'cadet']), (req, res) => {
  const payload = { id: uid('drive'), ...req.body, uploadedBy: req.user.name, createdAt: Date.now() };
  dataStore.drive.unshift(payload);
  writeDataStore(dataStore);
  addActivity('Drive', `Uploaded ${payload.title || 'document'}`, req.user.name);
  res.status(201).json({ drive: payload });
});

app.get('/api/activity', authMiddleware, (req, res) => {
  res.json({ activity: dataStore.activity.slice(0, 50) });
});

app.get('/api/users', authMiddleware, roleCheck(['admin']), (req, res) => {
  const safeUsers = dataStore.users.map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    regNo: u.regNo || null,
  }));
  res.json({ users: safeUsers });
});

app.delete('/api/users/:id', authMiddleware, roleCheck(['admin']), (req, res) => {
  const countBefore = dataStore.users.length;
  dataStore.users = dataStore.users.filter((u) => u.id !== req.params.id);
  if (dataStore.users.length === countBefore) {
    return res.status(404).json({ message: 'User not found' });
  }
  writeDataStore(dataStore);
  addActivity('User', `Removed user ${req.params.id}`, req.user.name);
  res.json({ deleted: true });
});

app.post('/api/admin/reset-demo', authMiddleware, roleCheck(['admin']), (req, res) => {
  Object.assign(dataStore, structuredClone(DEFAULT_DATA));
  writeDataStore(dataStore);
  addActivity('Admin', 'Reset portal demo data', req.user.name);
  res.json({ message: 'Demo data restored successfully' });
});

async function startServer() {
  await initPostgres();
  app.listen(PORT, () => {
    console.log(`NCC portal API running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Startup failed:', error);
  process.exit(1);
});

module.exports = { app, authMiddleware, roleCheck };
