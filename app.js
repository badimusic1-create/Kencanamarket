let prods = JSON.parse(localStorage.getItem("km_prods_cache") || "[]");
let cmts = JSON.parse(localStorage.getItem("km_cmts_cache") || "[]");
let users = JSON.parse(localStorage.getItem("km_users") || "[]");
let revs = JSON.parse(localStorage.getItem("km_revs") || "[]");
let reps = JSON.parse(localStorage.getItem("km_reps") || "[]");
let inter = JSON.parse(localStorage.getItem("km_inter") || "[]");
let user = JSON.parse(localStorage.getItem("km_cu") || "null");

let storeFilter = "", imgIdx = {}, activeCopyContact = "", activeProdId = null;

function esc(s) { return String(s || "").replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }
function cekAman(t) { if (/(slot gacor|judol|judi online|togel|sbobet|bokep|porn)/i.test(t)) { alert("Konten terdeteksi melanggar ketentuan."); return false; } return true; }

function om(id) { const el = document.getElementById(id); if (el) el.classList.add("open"); }
function cm(id) { const el = document.getElementById(id); if (el) el.classList.remove("open"); }

function tab(t, el) {
  document.querySelectorAll(".nb").forEach(b => b.classList.remove("act"));
  if (el) el.classList.add("act");
  ["t-home", "t-news", "t-rank", "t-priv"].forEach(id => {
    const e = document.getElementById(id);
    if (e) e.classList.add("hid");
  });
  if (t === "home" || t === "new") { document.getElementById("t-home").classList.remove("hid"); renProd(t === "new"); }
  else if (t === "news") { document.getElementById("t-news").classList.remove("hid"); }
  else if (t === "rank") { document.getElementById("t-rank").classList.remove("hid"); renRank(); }
  else if (t === "priv") { document.getElementById("t-priv").classList.remove("hid"); }
}

function saveLocal() {
  localStorage.setItem("km_users", JSON.stringify(users));
  localStorage.setItem("km_revs", JSON.stringify(revs));
  localStorage.setItem("km_reps", JSON.stringify(reps));
  localStorage.setItem("km_inter", JSON.stringify(inter));
  localStorage.setItem("km_prods_cache", JSON.stringify(prods));
  localStorage.setItem("km_cmts_cache", JSON.stringify(cmts));
}

function filterStore(s) {
  storeFilter = s;
  const sbEl = document.getElementById("storeBanner");
  if (sbEl) sbEl.classList.remove("hid");
  const snEl = document.getElementById("storeBannerName");
  if (snEl) snEl.innerText = s;
  tab("home");
  renProd();
}

function clearStoreFilter() {
  storeFilter = "";
  const sbEl = document.getElementById("storeBanner");
  if (sbEl) sbEl.classList.add("hid");
  renProd();
}

function rating(s) {
  const r = revs.filter(x => x.store == s);
  if (!r.length) return { a: "Baru", c: 0, sc: 0 };
  const a = (r.reduce((x, y) => x + Number(y.star), 0) / r.length).toFixed(1);
  return { a, c: r.length, sc: Number(a) };
}

function nextImg(pid, tot) { imgIdx[pid] = ((imgIdx[pid] || 0) + 1) % tot; renProd(); }

function renProd(nw = false) {
  const qEl = document.getElementById("qIn"), cEl = document.getElementById("cSel");
  const q = qEl ? qEl.value.toLowerCase() : "", c = cEl ? cEl.value : "Semua";
  let l = prods.filter(p => {
    const store = p.seller_name || "", title = p.title || "", loc = p.city || "", brand = p.brand || "";
    return (!storeFilter || store == storeFilter) &&
      (title.toLowerCase().includes(q) || store.toLowerCase().includes(q) || loc.toLowerCase().includes(q) || brand.toLowerCase().includes(q)) &&
      (c == "Semua" || p.category == c);
  });
  if (nw) l = l.slice(0, 12);
  const cntEl = document.getElementById("pCnt");
  if (cntEl) cntEl.innerText = l.length + " produk";
  const grid = document.getElementById("pGrid");
  if (!grid) return;

  if (!l.length) {
    grid.innerHTML = `<div class="pcard" style="grid-column:1/-1;text-align:center">Belum ada produk yang tersedia. Klik "+ Jual" untuk mulai memasang iklan gratis.</div>`;
    return;
  }

  grid.innerHTML = l.map(p => {
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
        ${cur ? `<img src="${cur}" class="cimg" alt="${esc(p.title)}"/>` : `<div class="cimg-empty">📦 ${esc(p.category)}</div>`}
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

function togSold(id, status) {
  prods = prods.map(p => p.id == id ? { ...p, sold: status } : p);
  saveLocal(); renProd();
}

function delOwn(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
  prods = prods.filter(p => p.id != id);
  saveLocal(); renProd();
}

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
function copyAdmContact() { const el = document.getElementById("admContactShow"); if (el) { navigator.clipboard.writeText(el.innerText); alert("Kontak Admin (" + el.innerText + ") berhasil disalin."); } }

function syncUserUI() {
  const uBtn = document.getElementById("uBtn"), inBox = document.getElementById("uInBox"), outBox = document.getElementById("uOutBox"), uNameEl = document.getElementById("uName");
  if (user) {
    if (uBtn) uBtn.innerText = "👤 " + user.name;
    if (inBox) inBox.classList.remove("hid");
    if (outBox) outBox.classList.add("hid");
    if (uNameEl) uNameEl.innerText = user.name;
  } else {
    if (uBtn) uBtn.innerText = "👤 Akun";
    if (inBox) inBox.classList.add("hid");
    if (outBox) outBox.classList.remove("hid");
  }
}

function authUser() {
  const name = (document.getElementById("aName")?.value || "").trim();
  const email = (document.getElementById("aMail")?.value || "").trim();
  const pass = (document.getElementById("aPass")?.value || "").trim();
  const city = (document.getElementById("aCity")?.value || "").trim();
  const contact = (document.getElementById("aWa")?.value || "").trim();
  if (!email) return alert("Harap isi alamat email Anda.");
  const exist = users.find(u => u.email === email);
  if (exist) {
    user = exist;
  } else {
    if (!name || !contact) return alert("Nama toko/lengkap dan nomor kontak wajib diisi saat pendaftaran baru.");
    user = { name, email, pass, city, contact };
    users.push(user);
    saveLocal();
  }
  localStorage.setItem("km_cu", JSON.stringify(user));
  syncUserUI();
  cm("mAuth");
  alert("Berhasil masuk sebagai " + user.name);
}

function logout() {
  user = null;
  localStorage.removeItem("km_cu");
  syncUserUI();
  cm("mAuth");
}

function openSell() {
  if (!user) { alert("Silakan masuk atau daftar akun terlebih dahulu sebelum memasang iklan."); return om("mAuth"); }
  const wEl = document.getElementById("pWa"), cEl = document.getElementById("pCity");
  if (wEl && !wEl.value) wEl.value = user.contact || "";
  if (cEl && !cEl.value) cEl.value = user.city || "";
  om("mSell");
}

function addProd() {
  if (!user) return om("mAuth");
  const title = (document.getElementById("pName")?.value || "").trim();
  const condition = document.getElementById("pCond")?.value || "Baru";
  const nego = document.getElementById("pNego")?.value || "Dapat Dinegosiasikan";
  const category = document.getElementById("pCat")?.value || "Lainnya";
  const item_type = (document.getElementById("pType")?.value || "").trim();
