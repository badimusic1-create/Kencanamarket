const SUPABASE_URL = "https://supabase.co";
const SUPABASE_KEY = "sb_publishable_5ufmyrtQA91nZhDo5dRsaA_MFg_84aP";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const DEFAULT_ADM_HASH = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9";
let admHash = localStorage.getItem("km_pin_sha256") || DEFAULT_ADM_HASH;

let prods = [], posts = [], cmts = [], comps = [];
let users = JSON.parse(localStorage.getItem("km_users") || "[]");
let revs = JSON.parse(localStorage.getItem("km_revs") || "[]");
let reps = JSON.parse(localStorage.getItem("km_reps") || "[]");
let inter = JSON.parse(localStorage.getItem("km_inter") || "[]");
let bank = JSON.parse(localStorage.getItem("km_bk") || '{"bank":"","no":"","own":"","wa":"0812-0000-0000","mail":"admin@kencanamarket.id"}');
let user = JSON.parse(localStorage.getItem("km_cu") || "null");

let storeFilter = "", imgIdx = {}, activeCopyContact = "", failCount = 0, lockUntil = 0;

function esc(s) { return String(s || "").replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
function cekAman(t) { if (/(slot gacor|judol|judi online|togel|sbobet|bokep|porn)/i.test(t)) { alert("Konten terdeteksi melanggar ketentuan."); return false; } return true; }
function cekKunci() { if (Date.now() < lockUntil) { alert("Tunggu 30 detik."); return true; } return false; }
function catatSalah() { failCount++; if (failCount >= 5) { lockUntil = Date.now() + 30000; failCount = 0; } }
async function sha256(str) { const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)); return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join(""); }

function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = "sine"; osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.35);
  } catch (e) {}
}

function showNotif(msg) {
  playNotifSound();
  const el = document.getElementById("toastBox");
  if (!el) return;
  el.innerText = "🔔 " + msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 4500);
}

function om(id) { document.getElementById(id).classList.add("open"); }
function cm(id) { document.getElementById(id).classList.remove("open"); }
function tab(t, el) {
  document.querySelectorAll(".nb").forEach(b => b.classList.remove("act"));
  if (el) el.classList.add("act");
  ["t-home", "t-news", "t-rank", "t-priv"].forEach(id => document.getElementById(id).classList.add("hid"));
  if (t === "home" || t === "new") { document.getElementById("t-home").classList.remove("hid"); renProd(t === "new"); }
  else if (t === "news") { document.getElementById("t-news").classList.remove("hid"); loadPosts(); }
  else if (t === "rank") { document.getElementById("t-rank").classList.remove("hid"); renRank(); }
  else if (t === "priv") { document.getElementById("t-priv").classList.remove("hid"); }
}

function saveLocal() {
  localStorage.setItem("km_users", JSON.stringify(users));
  localStorage.setItem("km_revs", JSON.stringify(revs));
  localStorage.setItem("km_reps", JSON.stringify(reps));
  localStorage.setItem("km_inter", JSON.stringify(inter));
}

async function syncSupabase() {
  const [pRes, cRes] = await Promise.all([
    sb.from("products").select("*").order("created_at", { ascending: false }),
    sb.from("comments").select("*").order("created_at", { ascending: true })
  ]);
  if (!pRes.error && pRes.data) prods = pRes.data;
  if (!cRes.error && cRes.data) cmts = cRes.data;
  renProd();
}

function initRealtime() {
  sb.channel("km-live")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "products" }, payload => {
      syncSupabase();
      showNotif("Produk baru tayang: " + (payload.new.title || "Item baru"));
    })
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments" }, payload => {
      syncSupabase();
      showNotif("Pesan diskusi baru dari " + (payload.new.sender || "Pengguna"));
    })
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "reports" }, () => {
      showNotif("Laporan / pengaduan baru masuk ke Panel Admin");
    })
    .subscribe();
}

function filterStore(s) { storeFilter = s; document.getElementById("storeBanner").classList.remove("hid"); document.getElementById("storeBannerName").innerText = s; tab("home"); renProd(); }
function clearStoreFilter() { storeFilter = ""; document.getElementById("storeBanner").classList.add("hid"); renProd(); }
function rating(s) { const r = revs.filter(x => x.store == s); if (!r.length) return { a: "Baru", c: 0, sc: 0 }; const a = (r.reduce((x, y) => x + Number(y.star), 0) / r.length).toFixed(1); return { a, c: r.length, sc: Number(a) }; }
function nextImg(pid, tot) { imgIdx[pid] = ((imgIdx[pid] || 0) + 1) % tot; renProd(); }

function renProd(nw = false) {
  const q = document.getElementById("qIn").value.toLowerCase(), c = document.getElementById("cSel").value;
  let l = prods.filter(p => {
    const store = p.seller_name || "", title = p.title || "", loc = p.city || "", brand = p.brand || "";
    return (!storeFilter || store == storeFilter) &&
      (title.toLowerCase().includes(q) || store.toLowerCase().includes(q) || loc.toLowerCase().includes(q) || brand.toLowerCase().includes(q)) &&
      (c == "Semua" || p.category == c);
  });
  if (nw) l = l.slice(0, 12);
  document.getElementById("pCnt").innerText = l.length + " produk";
  if (!l.length) {
    document.getElementById("pGrid").innerHTML = `<div class="pcard" style="grid-column:1/-1;text-align:center">Belum ada produk yang tersedia. Klik "+ Jual" untuk mulai memasang iklan gratis.</div>`;
    return;
  }
  document.getElementById("pGrid").innerHTML = l.map(p => {
    const store = p.seller_name || "Penjual", rt = rating(store), can = inter.includes(store);
    const cc = cmts.filter(x => x.product_id == p.id).length;
    const isMine = user && user.name.toLowerCase() == store.toLowerCase();
    const pics = Array.isArray(p.images) ? p.images : [];
    const cur = pics[imgIdx[p.id] || 0];
    const s1 = esc(store).replace(/'/g, "\\'"), s2 = esc(p.title).replace(/'/g, "\\'");
    const topBtn = isMine
      ? `<div class="row"><button class="btn b-sold" onclick="togSold(${p.id},${!p.sold})">${p.sold ? '🔄 Buka Stok' : '✅ Tandai Terjual'}</button><button class="btn b-del" style="width:auto" onclick="delOwn(${p.id})">🗑️</button></div>`
      : (p.sold ? `<button class="btn b-off" disabled>Sudah Terjual</button>` : `<button class="btn b-wa" onclick="hubungiPenjual(${p.id})">📞 Hubungi Kontak Penjual</button>`);
    return `<div class="card">
      <div class="cimg-wrap">
        ${cur ? `<img src="${cur}" class="cimg" alt="${esc(p.title)}" loading="lazy"/>` : `<div class="cimg-empty">📦 ${esc(p.category)}</div>`}
        ${p.sold ? '<div class="sold-tag">TERJUAL</div>' : ''}
        ${pics.length > 1 ? `<button class="gal-btn" onclick="nextImg(${p.id},${pics.length})">📷 ${(imgIdx[p.id] || 0) + 1}/${pics.length}</button>` : ''}
      </div>
      <div class="cb">
        <div>${p.sold ? '<span class="bg bg-s">TERJUAL</span>' : ''}<span class="bg ${p.condition == 'Bekas' ? 'bg-b' : 'bg-c'}">${esc(p.condition || 'Baru')}</span>${p.nego && p.nego !== 'Harga Pas' && !p.sold ? '<span class="bg bg-n">🤝 NEGO</span>' : ''}</div>
        <div style="font-weight:700">${esc(p.title)}</div>
        <div class="pr">Rp ${Number(p.price || 0).toLocaleString('id-ID')}</div>
        <div style="font-size:.74rem;color:#475569">🏷️ ${esc(p.brand || '-')} • ${esc(p.item_type || p.category)}</div>
        <div style="font-size:.78rem;color:#64748b">🏪 <span class="slink" onclick="filterStore('${s1}')">${esc(store)}</span> • <span class="star">★ ${rt.a}</span></div>
        <div style="font-size:.75rem;color:#0f766e">📍 ${esc(p.city || 'Indonesia')}</div>
        <p style="font-size:.8rem;margin:5px 0">${esc(p.description)}</p>
        <div style="margin-top:auto">${topBtn}<div class="row"><button class="btn b-out" onclick="openCmt(${p.id})">💬 Diskusi (${cc})</button><button class="btn b-out" onclick="openRev('${s1}')">${can ? '★ Rating' : '🔒 Rating'}</button><button class="btn b-del" style="width:38px" onclick="lapor('${s2}','${s1}')">🚩</button></div></div>
      </div>
    </div>`;
  }).join("");
}

async function togSold(id, status) { await sb.from("products").update({ sold: status }).eq("id", id); syncSupabase(); }
async function delOwn(id) { if (confirm("Apakah Anda yakin ingin menghapus produk ini?")) { await sb.from("products").delete().eq("id", id); syncSupabase(); } }

function hubungiPenjual(id) {
  const p = prods.find(x => x.id == id); if (!p) return;
  const store = p.seller_name || "Penjual";
  if (!inter.includes(store)) { inter.push(store); saveLocal(); renProd(); }
  document.getElementById("ctProd").innerText = p.title;
  document.getElementById("ctStore").innerText = store;
  document.getElementById("ctLoc").innerText = p.city || "-";
  document.getElementById("ctNum").innerText = p.contact || "-";
  activeCopyContact = p.contact || "";
  om("mContact");
}
function copySellerNum() { if (!activeCopyContact) return; navigator.clipboard.writeText(activeCopyContact); alert("Nomor kontak penjual (" + activeCopyContact + ") berhasil disalin."); }
function copyAdmContact() { const c = document.getElementById("admContactShow").innerText; navigator.clipboard.writeText(c); alert("Kontak Admin (" + c + ") berhasil disalin."); }

