// אחסון נתונים פשוט בקובץ JSON — משתמשים (סוחרים) והזמנות
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const EMPTY = { users: [], orders: [], sessions: [], logins: [], seq: { user: 0, order: 0 } };

function load() {
  try {
    return { ...EMPTY, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) };
  } catch {
    return JSON.parse(JSON.stringify(EMPTY));
  }
}

const db = load();

function save() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

module.exports = { db, save };
