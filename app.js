async function loadJSON(path){ const r = await fetch(path); if(!r.ok) throw new Error("Can't load "+path); return r.json(); }
function qs(sel){ return document.querySelector(sel); }
function esc(s){ return (s||"").toString().replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function waLink(phone, text){
  const p = (phone||"").replace(/[^\d]/g,'');
  const t = encodeURIComponent(text||"Здравствуйте! Хочу заказать.");
  return `https://wa.me/${p}?text=${t}`;
}
function renderCards(items, mountSel, cfg){
  const mount = qs(mountSel); if(!mount) return;
  mount.innerHTML = items.map(it => {
    const badgeHTML = (it.badges||[]).slice(0,4).map(b=>`<span class="badge">${esc(b)}</span>`).join("");
    const msg = it.whatsAppText || `${cfg.defaultMsg}\n\n${it.title}\nКатегория: ${it.category}\nЦена: ${it.price_from || it.price || ""} AZN`;
    const buyHref = it.payment_link ? it.payment_link : waLink(cfg.whatsapp, msg);
    const compareHref = it.compare_anchor ? `compare.html#${encodeURIComponent(it.compare_anchor)}` : `compare.html`;
    return `
      <div class="item">
        <h3>${esc(it.title)}</h3>
        <div class="badges">${badgeHTML}</div>
        <div class="price">
          <b>${esc((it.price_from ?? it.price) ?? "—")} AZN</b>
          <span>${esc(it.price_note||"")}</span>
        </div>
        <div class="small">${esc(it.desc||"")}</div>
        <div class="actions" style="margin-top:10px">
          <a class="btn primary" href="${buyHref}" target="_blank" rel="noopener">Купить / Заказать</a>
          <a class="btn" href="${compareHref}">Сравнить</a>
        </div>
      </div>`;
  }).join("");
}
function filterItems(items, q, cat){
  const qq = (q||"").trim().toLowerCase();
  return items.filter(it=>{
    const inCat = !cat || cat==="all" || it.category===cat;
    if(!inCat) return false;
    if(!qq) return true;
    const hay = `${it.title} ${it.desc||""} ${it.category} ${(it.badges||[]).join(" ")}`.toLowerCase();
    return hay.includes(qq);
  });
}
async function initProducts(){
  const cfg = await loadJSON("config.json");
  const all = await loadJSON("products.json");
  const cats = [...new Set(all.map(x=>x.category))].sort();
  const sel = qs("#category"); 
  if(sel){ sel.innerHTML = `<option value="all">Все категории</option>` + cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join(""); }
  const qEl = qs("#q");
  const update = ()=>{
    const items = filterItems(all, qEl?.value, sel?.value);
    renderCards(items, "#list", {...cfg, defaultMsg:"Здравствуйте! Хочу купить/заказать товар."});
    qs("#count").textContent = items.length.toString();
  };
  qEl?.addEventListener("input", update);
  sel?.addEventListener("change", update);
  update();
}
async function initServices(){
  const cfg = await loadJSON("config.json");
  const all = await loadJSON("services.json");
  const cats = [...new Set(all.map(x=>x.category))].sort();
  const sel = qs("#category"); 
  if(sel){ sel.innerHTML = `<option value="all">Все услуги</option>` + cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join(""); }
  const qEl = qs("#q");
  const update = ()=>{
    const items = filterItems(all, qEl?.value, sel?.value);
    renderCards(items, "#list", {...cfg, defaultMsg:"Здравствуйте! Хочу заказать услугу."});
    qs("#count").textContent = items.length.toString();
  };
  qEl?.addEventListener("input", update);
  sel?.addEventListener("change", update);
  update();
}
async function initCompare(){
  const cfg = await loadJSON("config.json");
  const all = await loadJSON("compare.json");
  const mount = qs("#compare");
  const hash = decodeURIComponent((location.hash||"").replace(/^#/, ""));
  const filtered = hash ? all.filter(x=>x.anchor===hash) : all;
  const rows = filtered.map(p=>{
    const storeRows = (p.offers||[]).map(o=>{
      const go = o.link || waLink(cfg.whatsapp, `Здравствуйте! Хочу купить ${p.title}. Вижу цену ${o.price} AZN в ${o.store}.`);
      return `<tr>
        <td>${esc(o.store)}</td>
        <td>${esc(o.price)} AZN</td>
        <td>${esc(o.note||"—")}</td>
        <td><a class="btn primary" target="_blank" rel="noopener" href="${go}">Перейти / Купить</a></td>
      </tr>`;
    }).join("");
    return `<div class="card" style="margin-top:14px">
      <h3 style="margin:0 0 8px">${esc(p.title)}</h3>
      <div class="small">${esc(p.desc||"")}</div>
      <div style="margin-top:10px;overflow:auto">
        <table class="table">
          <thead><tr><th>Магазин</th><th>Цена</th><th>Доставка/условия</th><th></th></tr></thead>
          <tbody>${storeRows}</tbody>
        </table>
      </div>
    </div>`;
  }).join("");
  mount.innerHTML = rows || `<div class="notice">Пока нет сравнений. Добавь позиции в <b>compare.json</b>.</div>`;
}
async function initContact(){
  const cfg = await loadJSON("config.json");
  const wa = qs("#waLink");
  if(wa){
    wa.href = waLink(cfg.whatsapp, "Здравствуйте! Хочу уточнить по заказу.");
    wa.textContent = `WhatsApp: ${cfg.whatsapp}`;
  }
  const pay = qs("#payLinks");
  if(pay){
    const links = (cfg.payment_links||[]).map(l=>`<li><a class="btn primary" target="_blank" rel="noopener" href="${l.url}">${esc(l.title)}</a></li>`).join("");
    pay.innerHTML = links || `<li class="small">Добавь платёжные ссылки в <b>config.json</b></li>`;
  }
}
window.Site = { initProducts, initServices, initCompare, initContact };