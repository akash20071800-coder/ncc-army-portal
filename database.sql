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
