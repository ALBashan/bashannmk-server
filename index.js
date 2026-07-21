// בשן רדיאטורים וחלפים — חנות B2B + שרת נתוני רכב
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const crypto = require('crypto');
const path = require('path');

const { CATEGORIES, MAKES, buildProducts } = require('./catalog');
const { db, save } = require('./store');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.TOKEN_SECRET || (db.secret || (db.secret = crypto.randomBytes(32).toString('hex'), save(), db.secret));
const VAT_RATE = 0.18;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PRODUCTS = buildProducts();
const BY_SKU = new Map(PRODUCTS.map((p) => [p.sku, p]));
console.log(`📦 קטלוג נטען: ${PRODUCTS.length} מוצרים ב-${CATEGORIES.length} קטגוריות`);

// ---------- אימות (B2B — סוחרים בלבד) ----------

function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 3600 * 1000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function authUser(req) {
  const header = req.headers.authorization || '';
  const payload = verifyToken(header.replace(/^Bearer\s+/i, ''));
  if (!payload) return null;
  return db.users.find((u) => u.id === payload.uid) || null;
}

function requireAuth(req, res, next) {
  const user = authUser(req);
  if (!user) return res.status(401).json({ success: false, error: 'נדרשת התחברות' });
  req.user = user;
  next();
}

function requireApproved(req, res, next) {
  if (req.user.status !== 'approved') {
    return res.status(403).json({ success: false, error: 'חשבונך ממתין לאישור. מחירים והזמנות זמינים לסוחרים מאושרים בלבד.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'אין הרשאה' });
  next();
}

function publicUser(u) {
  return { id: u.id, company: u.company, hp: u.hp, name: u.name, phone: u.phone, email: u.email, role: u.role, status: u.status, createdAt: u.createdAt };
}

// חשבון מנהל ראשוני
function seedAdmin() {
  if (db.users.some((u) => u.role === 'admin')) return;
  const password = process.env.ADMIN_PASSWORD || 'Bashan2026!';
  const { salt, hash } = hashPassword(password);
  db.users.push({
    id: ++db.seq.user, company: 'בשן רדיאטורים וחלפים', hp: '000000000', name: 'מנהל מערכת',
    phone: '', email: 'admin@bashan.co.il', salt, hash, role: 'admin', status: 'approved',
    createdAt: new Date().toISOString(),
  });
  save();
  console.log(`👤 נוצר חשבון מנהל: admin@bashan.co.il (סיסמה: ${process.env.ADMIN_PASSWORD ? 'מתוך ADMIN_PASSWORD' : 'Bashan2026! — יש להחליף!'})`);
}
seedAdmin();

// ---------- API כללי ----------

app.get('/api/meta', (req, res) => {
  res.json({
    success: true,
    categories: CATEGORIES.map(({ id, he, prefix, icon }) => ({ id, he, prefix, icon })),
    makes: MAKES.map(({ code, he, en, models }) => ({ code, he, en, models: models.map((m) => m.he) })),
  });
});

function productView(p, showPrice) {
  const { price, ...rest } = p;
  return showPrice ? { ...rest, price } : { ...rest, price: null };
}

app.get('/api/products', (req, res) => {
  const user = authUser(req);
  const showPrice = !!user && user.status === 'approved';
  const { category, make, model, q } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(60, Math.max(1, parseInt(req.query.limit) || 24));

  let list = PRODUCTS;
  if (category) list = list.filter((p) => p.category === category);
  if (make) list = list.filter((p) => p.make === make);
  if (model) list = list.filter((p) => p.model === model);
  if (q) {
    const needle = String(q).trim().toLowerCase();
    list = list.filter((p) =>
      p.sku.toLowerCase().includes(needle) ||
      p.name.toLowerCase().includes(needle) ||
      (p.oem && p.oem.includes(needle))
    );
  }

  const total = list.length;
  const items = list.slice((page - 1) * limit, page * limit).map((p) => productView(p, showPrice));
  res.json({ success: true, total, page, pages: Math.ceil(total / limit), pricesVisible: showPrice, items });
});

app.get('/api/products/:sku', (req, res) => {
  const p = BY_SKU.get(req.params.sku.toUpperCase());
  if (!p) return res.status(404).json({ success: false, error: 'מק"ט לא נמצא' });
  const user = authUser(req);
  res.json({ success: true, item: productView(p, !!user && user.status === 'approved') });
});

// ---------- הרשמה והתחברות ----------

app.post('/api/auth/register', (req, res) => {
  const { company, hp, name, phone, email, password } = req.body || {};
  if (!company || !hp || !name || !phone || !email || !password) {
    return res.status(400).json({ success: false, error: 'יש למלא את כל השדות' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ success: false, error: 'כתובת אימייל לא תקינה' });
  if (String(password).length < 6) return res.status(400).json({ success: false, error: 'סיסמה חייבת להכיל לפחות 6 תווים' });
  if (db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) {
    return res.status(409).json({ success: false, error: 'אימייל זה כבר רשום במערכת' });
  }
  const { salt, hash } = hashPassword(String(password));
  const user = {
    id: ++db.seq.user, company: String(company), hp: String(hp), name: String(name),
    phone: String(phone), email: String(email), salt, hash,
    role: 'dealer', status: 'pending', createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  save();
  res.json({ success: true, token: signToken({ uid: user.id }), user: publicUser(user), message: 'ההרשמה התקבלה! החשבון ממתין לאישור צוות בשן.' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase());
  if (!user) return res.status(401).json({ success: false, error: 'אימייל או סיסמה שגויים' });
  const { hash } = hashPassword(String(password || ''), user.salt);
  if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(user.hash))) {
    return res.status(401).json({ success: false, error: 'אימייל או סיסמה שגויים' });
  }
  res.json({ success: true, token: signToken({ uid: user.id }), user: publicUser(user) });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});

// ---------- הזמנות (סוחרים מאושרים בלבד) ----------

app.post('/api/orders', requireAuth, requireApproved, (req, res) => {
  const { items, notes } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'ההזמנה ריקה' });
  }
  const lines = [];
  for (const it of items) {
    const p = BY_SKU.get(String(it.sku || '').toUpperCase());
    const qty = parseInt(it.qty);
    if (!p) return res.status(400).json({ success: false, error: `מק"ט לא קיים: ${it.sku}` });
    if (!qty || qty < 1 || qty > 999) return res.status(400).json({ success: false, error: `כמות לא תקינה עבור ${p.sku}` });
    lines.push({ sku: p.sku, name: p.name, qty, unitPrice: p.price, total: p.price * qty });
  }
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const vat = Math.round(subtotal * VAT_RATE * 100) / 100;
  const order = {
    id: ++db.seq.order,
    number: `BS-${new Date().getFullYear()}-${String(db.seq.order).padStart(4, '0')}`,
    userId: req.user.id,
    company: req.user.company,
    items: lines,
    notes: String(notes || ''),
    subtotal, vat, total: Math.round((subtotal + vat) * 100) / 100,
    status: 'new',
    createdAt: new Date().toISOString(),
  };
  db.orders.push(order);
  save();
  res.json({ success: true, order });
});

app.get('/api/orders', requireAuth, (req, res) => {
  const orders = db.orders.filter((o) => o.userId === req.user.id).sort((a, b) => b.id - a.id);
  res.json({ success: true, orders });
});

// ---------- ניהול ----------

app.get('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
  res.json({ success: true, users: db.users.map(publicUser).sort((a, b) => b.id - a.id) });
});

app.post('/api/admin/users/:id/status', requireAuth, requireAdmin, (req, res) => {
  const user = db.users.find((u) => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ success: false, error: 'משתמש לא נמצא' });
  const { status } = req.body || {};
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ success: false, error: 'סטטוס לא תקין' });
  }
  user.status = status;
  save();
  res.json({ success: true, user: publicUser(user) });
});

app.get('/api/admin/orders', requireAuth, requireAdmin, (req, res) => {
  res.json({ success: true, orders: [...db.orders].sort((a, b) => b.id - a.id) });
});

app.post('/api/admin/orders/:id/status', requireAuth, requireAdmin, (req, res) => {
  const order = db.orders.find((o) => o.id === parseInt(req.params.id));
  if (!order) return res.status(404).json({ success: false, error: 'הזמנה לא נמצאה' });
  const { status } = req.body || {};
  if (!['new', 'processing', 'shipped', 'done', 'cancelled'].includes(status)) {
    return res.status(400).json({ success: false, error: 'סטטוס לא תקין' });
  }
  order.status = status;
  save();
  res.json({ success: true, order });
});

// ---------- איתור רכב לפי מספר לוחית (data.gov.il) ----------

async function vehicleLookup(req, res) {
  const plate = req.params.plate.replace(/[^0-9]/g, '');
  if (!plate || plate.length < 5 || plate.length > 8) {
    return res.status(400).json({ success: false, error: 'מספר לוחית לא תקין' });
  }
  try {
    let records = await searchGov(`filters={"mispar_rechev":"${plate}"}&limit=1`);
    if (!records || records.length === 0) {
      const all = await searchGov(`q=${plate}&limit=5`);
      records = (all || []).filter((r) => String(r['mispar_rechev'] || '').replace(/\D/g, '') === plate);
      if (!records.length) records = all || [];
    }
    if (!records || records.length === 0) {
      return res.status(404).json({ success: false, error: `לא נמצא רכב עם לוחית ${plate}` });
    }
    const r = records[0];
    return res.json({
      success: true,
      plate,
      source: 'data.gov.il — משרד התחבורה',
      data: {
        make: c(r['tozeret_nm']) || c(r['tozeret_cd']),
        model: c(r['kinuy_mishari']) || c(r['degem_nm']),
        model_code: c(r['degem_cd']),
        year: c(r['shnat_yitzur']),
        color: c(r['tzeva_rechev']),
        fuel: c(r['sug_delek_nm']),
        engine_cc: c(r['nefach_manoa']),
        doors: c(r['mispar_dlatot']),
        vin: c(r['misgeret']),
        last_test: d(r['mivchan_acharon_dt']),
        license_exp: d(r['tokef_dt']),
        first_road: d(r['moed_aliya_lakvish']),
      },
    });
  } catch (e) {
    console.error(e.message);
    return res.status(500).json({ success: false, error: 'שגיאה: ' + e.message });
  }
}

app.get('/vehicle/:plate', vehicleLookup);
app.get('/api/vehicle/:plate', vehicleLookup);

async function searchGov(params) {
  const url = `https://data.gov.il/api/3/action/datastore_search?resource_id=053cea08-09bc-40ec-8f7a-156f0677aff3&${params}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 BashanRadiators/3.0', Accept: 'application/json' }, timeout: 10000 });
  const data = await res.json();
  return data?.result?.records || [];
}

function c(v) { if (v == null) return null; const s = String(v).trim(); return s === '' || s === '0' || s === 'null' ? null : s; }
function d(v) { if (!v) return null; return String(v).replace('T00:00:00', '').split('T')[0].trim(); }

app.listen(PORT, () => console.log(`✅ בשן רדיאטורים וחלפים — שרת B2B פועל על פורט ${PORT}`));
