// בשן רדיאטורים וחלפים — לוגיקת צד לקוח
const API = '';
let META = { categories: [], makes: [] };
let USER = null;
let TOKEN = localStorage.getItem('bashan_token') || null;
let CART = JSON.parse(localStorage.getItem('bashan_cart') || '[]');
let FILTERS = { q: '', category: '', make: '', model: '', page: 1 };
let PRICES_VISIBLE = false;

const $ = (id) => document.getElementById(id);

function headers() {
  const h = { 'Content-Type': 'application/json' };
  if (TOKEN) h['Authorization'] = 'Bearer ' + TOKEN;
  return h;
}

async function api(path, opts = {}) {
  const res = await fetch(API + path, { headers: headers(), ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'שגיאת שרת');
  return data;
}

function toast(msg, isError) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast' + (isError ? ' error' : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), 3500);
}

function fmt(n) {
  return '₪' + Number(n).toLocaleString('he-IL', { maximumFractionDigits: 2 });
}

// ---------- אתחול ----------
async function init() {
  const meta = await api('/api/meta');
  META = meta;

  // קטגוריות
  const grid = $('category-grid');
  grid.innerHTML = meta.categories.map((c) => `
    <div class="category-card" onclick="pickCategory('${c.id}')">
      <span class="cat-icon">${c.icon}</span>
      <strong>${c.he}</strong>
      <small>מק"ט: ${c.prefix}-XXXX</small>
    </div>`).join('');

  const catSel = $('f-category');
  meta.categories.forEach((c) => catSel.add(new Option(`${c.he} (${c.prefix})`, c.id)));

  const makeSel = $('f-make');
  meta.makes.forEach((m) => makeSel.add(new Option(m.he, m.code)));

  $('stat-makes').textContent = meta.makes.length;

  if (TOKEN) {
    try {
      const me = await api('/api/auth/me');
      setUser(me.user);
    } catch {
      TOKEN = null;
      localStorage.removeItem('bashan_token');
    }
  }

  renderCartCount();
  loadProducts();
}

// ---------- מוצרים ----------
async function loadProducts() {
  const p = new URLSearchParams();
  if (FILTERS.q) p.set('q', FILTERS.q);
  if (FILTERS.category) p.set('category', FILTERS.category);
  if (FILTERS.make) p.set('make', FILTERS.make);
  if (FILTERS.model) p.set('model', FILTERS.model);
  p.set('page', FILTERS.page);
  p.set('limit', 24);

  const data = await api('/api/products?' + p.toString());
  PRICES_VISIBLE = data.pricesVisible;
  $('price-notice').classList.toggle('hidden', PRICES_VISIBLE);
  $('stat-products').textContent = FILTERS.q || FILTERS.category || FILTERS.make ? $('stat-products').textContent : data.total.toLocaleString('he-IL');

  const grid = $('product-grid');
  if (!data.items.length) {
    grid.innerHTML = '<div class="empty-msg">לא נמצאו מוצרים תואמים 🔍</div>';
  } else {
    grid.innerHTML = data.items.map(productCard).join('');
  }
  renderPagination(data.page, data.pages);
}

function productCard(p) {
  const stock = p.stock > 0
    ? `<span class="p-stock in">✔ במלאי</span>`
    : `<span class="p-stock out">⏳ בהזמנה מיוחדת</span>`;
  const price = PRICES_VISIBLE
    ? `<div class="p-price">${fmt(p.price)} <small>לא כולל מע"מ</small></div>
       <div class="p-buy">
         <input type="number" min="1" max="999" value="1" id="qty-${p.sku}">
         <button class="btn btn-primary" onclick="addToCart('${p.sku}')">הוסף לסל</button>
       </div>`
    : `<div class="p-price-locked">🔒 מחיר לסוחרים מאושרים — <a href="#" onclick="openAuth('login');return false;">התחברות</a></div>`;
  return `
    <div class="product-card">
      <span class="p-cat">${p.categoryHe}</span>
      <div class="p-name">${p.name}</div>
      <div class="p-sku">מק"ט: ${p.sku}</div>
      <div class="p-meta">${p.oem ? 'מספר יצרן (OEM): ' + p.oem : (p.desc || '')}</div>
      ${stock}
      ${price}
    </div>`;
}

function renderPagination(page, pages) {
  const el = $('pagination');
  if (pages <= 1) { el.innerHTML = ''; return; }
  const btns = [];
  const range = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 2) range.push(i);
  }
  let prev = 0;
  for (const i of range) {
    if (i - prev > 1) btns.push('<span>…</span>');
    btns.push(`<button class="${i === page ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`);
    prev = i;
  }
  el.innerHTML = btns.join('');
}

function goPage(p) {
  FILTERS.page = p;
  loadProducts();
  $('catalog').scrollIntoView();
}

function pickCategory(id) {
  FILTERS.category = id;
  FILTERS.page = 1;
  $('f-category').value = id;
  loadProducts();
  $('catalog').scrollIntoView({ behavior: 'smooth' });
}

// פילטרים
$('f-search').addEventListener('input', debounce(function () {
  FILTERS.q = this.value; FILTERS.page = 1; loadProducts();
}, 350));
$('f-category').addEventListener('change', function () {
  FILTERS.category = this.value; FILTERS.page = 1; loadProducts();
});
$('f-make').addEventListener('change', function () {
  FILTERS.make = this.value; FILTERS.model = ''; FILTERS.page = 1;
  const modelSel = $('f-model');
  modelSel.innerHTML = '<option value="">כל הדגמים</option>';
  const make = META.makes.find((m) => m.code === this.value);
  if (make) {
    make.models.forEach((mo) => modelSel.add(new Option(mo, mo)));
    modelSel.disabled = false;
  } else {
    modelSel.disabled = true;
  }
  loadProducts();
});
$('f-model').addEventListener('change', function () {
  FILTERS.model = this.value; FILTERS.page = 1; loadProducts();
});
$('f-clear').addEventListener('click', () => {
  FILTERS = { q: '', category: '', make: '', model: '', page: 1 };
  $('f-search').value = ''; $('f-category').value = ''; $('f-make').value = '';
  $('f-model').innerHTML = '<option value="">כל הדגמים</option>';
  $('f-model').disabled = true;
  loadProducts();
});

function debounce(fn, ms) {
  let t;
  return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
}

// ---------- חיפוש לפי לוחית ----------
$('plate-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const plate = $('plate-input').value.replace(/\D/g, '');
  const out = $('plate-result');
  if (plate.length < 5) { out.innerHTML = '<span style="color:#c92a2a">מספר לוחית קצר מדי</span>'; return; }
  out.innerHTML = '⏳ מאתר רכב…';
  try {
    const res = await api('/api/vehicle/' + plate);
    const d = res.data;
    out.innerHTML = `
      <div class="plate-card">
        <div class="row"><span>יצרן</span><strong>${d.make || '—'}</strong></div>
        <div class="row"><span>דגם</span><strong>${d.model || '—'}</strong></div>
        <div class="row"><span>שנה</span><strong>${d.year || '—'}</strong></div>
        <div class="row"><span>דלק</span><strong>${d.fuel || '—'}</strong></div>
        <div class="row"><span>נפח מנוע</span><strong>${d.engine_cc || '—'}</strong></div>
        <button class="btn btn-primary btn-block" style="margin-top:8px" onclick="filterByVehicle('${(d.make || '').replace(/'/g, '')}')">הצג חלקים ליצרן זה</button>
      </div>`;
  } catch (err) {
    out.innerHTML = `<span style="color:#c92a2a">${err.message}</span>`;
  }
});

function filterByVehicle(govMake) {
  const name = String(govMake);
  const match = META.makes.find((m) => name.includes(m.he) || m.he.includes(name.split(' ')[0]));
  if (match) {
    $('f-make').value = match.code;
    $('f-make').dispatchEvent(new Event('change'));
  }
  $('catalog').scrollIntoView({ behavior: 'smooth' });
}

// ---------- אימות ----------
function openAuth(tab) {
  $('auth-modal').classList.remove('hidden');
  switchTab(tab || 'login');
}
function closeModal(id) { $(id).classList.add('hidden'); }
function switchTab(tab) {
  $('tab-login').classList.toggle('active', tab === 'login');
  $('tab-register').classList.toggle('active', tab === 'register');
  $('login-form').classList.toggle('hidden', tab !== 'login');
  $('register-form').classList.toggle('hidden', tab !== 'register');
  $('auth-error').textContent = '';
}

$('btn-auth').addEventListener('click', () => {
  if (USER) { logout(); } else { openAuth('login'); }
});

$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  try {
    const res = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(f)) });
    TOKEN = res.token;
    localStorage.setItem('bashan_token', TOKEN);
    setUser(res.user);
    closeModal('auth-modal');
    toast('שלום, ' + res.user.name + '!');
    loadProducts();
  } catch (err) {
    $('auth-error').textContent = err.message;
  }
});

$('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  try {
    const res = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(Object.fromEntries(f)) });
    TOKEN = res.token;
    localStorage.setItem('bashan_token', TOKEN);
    setUser(res.user);
    closeModal('auth-modal');
    toast(res.message);
  } catch (err) {
    $('auth-error').textContent = err.message;
  }
});

function setUser(user) {
  USER = user;
  $('btn-auth').textContent = 'התנתקות (' + user.company + ')';
  $('btn-orders').classList.remove('hidden');
  const banner = $('account-banner');
  if (user.role === 'admin') {
    banner.className = 'account-banner approved';
    banner.innerHTML = '👑 מחובר כמנהל מערכת — <a href="/admin.html">מעבר לפאנל ניהול</a>';
    banner.classList.remove('hidden');
  } else if (user.status === 'pending') {
    banner.className = 'account-banner pending';
    banner.textContent = '⏳ חשבונך ממתין לאישור צוות בשן. מחירים והזמנות ייפתחו לאחר האישור.';
    banner.classList.remove('hidden');
  } else if (user.status === 'rejected') {
    banner.className = 'account-banner rejected';
    banner.textContent = '❌ בקשת החשבון נדחתה. לפרטים צרו קשר עם המשרד.';
    banner.classList.remove('hidden');
  } else {
    banner.className = 'account-banner approved';
    banner.textContent = '✅ חשבון סוחר מאושר — מחירי סיטונאות פעילים';
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 4000);
  }
}

function logout() {
  USER = null; TOKEN = null;
  localStorage.removeItem('bashan_token');
  $('btn-auth').textContent = 'כניסת סוחרים';
  $('btn-orders').classList.add('hidden');
  $('account-banner').classList.add('hidden');
  loadProducts();
  toast('התנתקת בהצלחה');
}

// ---------- סל ----------
function saveCart() {
  localStorage.setItem('bashan_cart', JSON.stringify(CART));
  renderCartCount();
}

function renderCartCount() {
  $('cart-count').textContent = CART.reduce((s, i) => s + i.qty, 0);
}

async function addToCart(sku) {
  const qty = parseInt($('qty-' + sku)?.value) || 1;
  let item = CART.find((i) => i.sku === sku);
  if (item) {
    item.qty += qty;
  } else {
    const res = await api('/api/products/' + sku);
    CART.push({ sku, name: res.item.name, price: res.item.price, qty });
  }
  saveCart();
  toast(`נוסף לסל: ${sku} × ${qty}`);
}

$('btn-cart').addEventListener('click', openCart);
function openCart() {
  renderCart();
  $('cart-drawer').classList.remove('hidden');
}
function closeCart() { $('cart-drawer').classList.add('hidden'); }

function renderCart() {
  const box = $('cart-items');
  if (!CART.length) {
    box.innerHTML = '<p class="empty-msg">הסל ריק</p>';
    $('cart-summary').innerHTML = '';
    $('btn-checkout').disabled = true;
    return;
  }
  $('btn-checkout').disabled = false;
  box.innerHTML = CART.map((i, idx) => `
    <div class="cart-line">
      <div class="cl-info">
        <div class="cl-name">${i.name}</div>
        <span class="cl-sku">${i.sku}</span>
      </div>
      <div class="cl-qty">
        <button onclick="cartQty(${idx},-1)">−</button>
        <span>${i.qty}</span>
        <button onclick="cartQty(${idx},1)">+</button>
      </div>
      <span class="cl-price">${i.price != null ? fmt(i.price * i.qty) : '—'}</span>
      <button class="cl-remove" onclick="cartRemove(${idx})">🗑</button>
    </div>`).join('');

  const hasPrices = CART.every((i) => i.price != null);
  if (hasPrices) {
    const subtotal = CART.reduce((s, i) => s + i.price * i.qty, 0);
    const vat = subtotal * 0.18;
    $('cart-summary').innerHTML = `
      <div class="sum-row"><span>סה"כ לפני מע"מ</span><span>${fmt(subtotal)}</span></div>
      <div class="sum-row"><span>מע"מ 18%</span><span>${fmt(vat)}</span></div>
      <div class="sum-row sum-total"><span>סה"כ לתשלום</span><span>${fmt(subtotal + vat)}</span></div>`;
  } else {
    $('cart-summary').innerHTML = '<p class="form-note">המחירים יחושבו לאחר אישור חשבון הסוחר.</p>';
  }
}

function cartQty(idx, delta) {
  CART[idx].qty = Math.max(1, CART[idx].qty + delta);
  saveCart();
  renderCart();
}
function cartRemove(idx) {
  CART.splice(idx, 1);
  saveCart();
  renderCart();
}

$('btn-checkout').addEventListener('click', async () => {
  if (!USER) { closeCart(); openAuth('login'); return; }
  try {
    const res = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ items: CART.map((i) => ({ sku: i.sku, qty: i.qty })), notes: $('cart-notes').value }),
    });
    CART = [];
    saveCart();
    $('cart-notes').value = '';
    closeCart();
    toast(`✅ ההזמנה נשלחה! מספר הזמנה: ${res.order.number}`);
  } catch (err) {
    toast(err.message, true);
  }
});

// ---------- הזמנות ----------
$('btn-orders').addEventListener('click', async () => {
  try {
    const res = await api('/api/orders');
    const list = $('orders-list');
    if (!res.orders.length) {
      list.innerHTML = '<p class="empty-msg">אין הזמנות עדיין</p>';
    } else {
      const stName = { new: 'חדשה', processing: 'בטיפול', shipped: 'נשלחה', done: 'הושלמה', cancelled: 'בוטלה' };
      list.innerHTML = res.orders.map((o) => `
        <div class="order-card">
          <div class="order-head">
            <span class="order-num">${o.number}</span>
            <span>${new Date(o.createdAt).toLocaleDateString('he-IL')}</span>
            <span class="order-status st-${o.status}">${stName[o.status] || o.status}</span>
          </div>
          <div class="order-items">
            ${o.items.map((i) => `<div><span>${i.sku} — ${i.name} × ${i.qty}</span><span>${fmt(i.total)}</span></div>`).join('')}
            <div style="font-weight:700;margin-top:6px"><span>סה"כ כולל מע"מ</span><span>${fmt(o.total)}</span></div>
          </div>
        </div>`).join('');
    }
    $('orders-modal').classList.remove('hidden');
  } catch (err) {
    toast(err.message, true);
  }
});

// סגירת מודאלים בלחיצה על רקע
document.querySelectorAll('.modal, .drawer').forEach((m) => {
  m.addEventListener('click', (e) => { if (e.target === m) m.classList.add('hidden'); });
});

init().catch((e) => toast('שגיאה בטעינת האתר: ' + e.message, true));
