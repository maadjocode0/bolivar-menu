const LANGS = ["fr", "en"];
const LANG_KEY = "bolivar-lang";
const MENU_CACHE_KEY = "bolivar-menu-v1";
const INFO_CACHE_KEY = "bolivar-info-v1";
const FALLBACK_AFTER_MS = 6000;
const DB_TIMEOUT_MS = 30000;
const DB_READY = typeof SUPABASE_URL === "string" && SUPABASE_URL !== "" &&
  typeof SUPABASE_KEY === "string" && SUPABASE_KEY !== "";
const DEFAULT_CATEGORY_IMAGE = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80";

let menu = null;
let shownJson = null;
let firstRender = true;
let lang = "fr";
const ITEMS = new Map();
const openCategories = new Set();
let scrollSpy = null;

const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch {} },
  remove(key) { try { localStorage.removeItem(key); } catch {} }
};

function slugify(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
}

function formatPrice(price) {
  return `${Number(price).toFixed(2)} DT`;
}

function t(key, values) {
  let text = TEXT[lang][key] ?? TEXT.fr[key] ?? key;
  for (const name in values) text = text.replace("{" + name + "}", () => values[name]);
  return text;
}

function pick(value) {
  if (!value) return "";
  return typeof value === "string" ? value : (value[lang] || value.fr);
}
function isText(value) {
  return typeof value === "string" || (value !== null && typeof value === "object" && typeof value.fr === "string");
}

function el(tag, props, ...children) {
  const node = document.createElement(tag);
  for (const key in props) {
    if (key === "attrs") for (const name in props.attrs) node.setAttribute(name, props.attrs[name]);
    else if (key === "dataset") Object.assign(node.dataset, props.dataset);
    else node[key] = props[key];
  }
  node.append(...children.filter((child) => child !== null && child !== undefined));
  return node;
}

function getCategoryImage(category) {
  return category.image || DEFAULT_CATEGORY_IMAGE;
}

function smallPhoto(url) {
  return url && url.includes("-800.") ? url.replace("-800.", "-480.") : url;
}

function fromMenuData(data) {
  const both = (fr, en) => (en ? { fr, en } : fr);
  return data.map((block) => ({
    id: slugify(block.category),
    name: both(block.category, block.en),
    image: block.image && block.image.trim() !== "" ? block.image : CATEGORY_PLACEHOLDERS[block.category] || null,
    items: block.items.map((item) => ({
      id: slugify(block.category) + "/" + slugify(item.name),
      name: both(item.name, item.en),
      price: item.price,
      desc: item.desc ? both(item.desc, item.descEn) : "",
      image: null,
      available: true
    }))
  }));
}

function fromDatabase(rows) {
  const both = (fr, en) => (en ? { fr, en } : fr);
  return rows.map((category) => ({
    id: category.id,
    name: both(category.name_fr, category.name_en),
    image: category.image_url || CATEGORY_PLACEHOLDERS[category.name_fr] || null,
    items: (category.items || []).map((item) => ({
      id: item.id,
      name: both(item.name_fr, item.name_en),
      price: Number(item.price),
      desc: item.description_fr ? both(item.description_fr, item.description_en) : "",
      image: item.image_url || null,
      available: item.available !== false
    }))
  }));
}

function isMenu(data) {
  return Array.isArray(data) &&
    data.some((category) => category && Array.isArray(category.items) && category.items.length > 0) &&
    data.every((category) => category && typeof category.id === "string" && isText(category.name) &&
      Array.isArray(category.items) &&
      category.items.every((item) => item && typeof item.id === "string" && isText(item.name) &&
        typeof item.price === "number" && Number.isFinite(item.price)));
}

async function fetchMenuFromDatabase() {
  const columns = "id,name_fr,name_en,image_url,position," +
    "items(id,name_fr,name_en,description_fr,description_en,price,image_url,available,position)";
  const url = SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/categories?select=" + encodeURIComponent(columns) +
    "&order=position.asc&items.order=position.asc";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DB_TIMEOUT_MS);
  try {
    const response = await fetch(url, { headers: { apikey: SUPABASE_KEY }, signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error("Supabase answered " + response.status);
    const rows = await response.json();
    const data = Array.isArray(rows) ? fromDatabase(rows) : [];
    if (!isMenu(data)) throw new Error("Supabase sent no menu");
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function readCachedMenu() {
  let data;
  try { data = JSON.parse(storage.get(MENU_CACHE_KEY) || "null"); } catch { data = undefined; }
  if (data !== null && !isMenu(data)) {
    storage.remove(MENU_CACHE_KEY);
    return null;
  }
  return data;
}

async function loadMenu() {
  if (!DB_READY) {
    showMenu(fromMenuData(MENU_DATA));
    return;
  }
  const cached = readCachedMenu();
  if (cached) {
    try {
      showMenu(cached);
      shownJson = JSON.stringify(cached);
    } catch (error) {
      console.warn("The saved menu could not be shown and was thrown away:", error);
      storage.remove(MENU_CACHE_KEY);
      menu = null;
    }
  }
  if (!menu) showLoading();
  const slow = setTimeout(() => {
    if (menu) return;
    showMenu(fromMenuData(MENU_DATA));
    setStale(true);
  }, FALLBACK_AFTER_MS);
  await refreshMenu();
  clearTimeout(slow);
}

async function refreshMenu() {
  try {
    const fresh = await fetchMenuFromDatabase();
    const json = JSON.stringify(fresh);
    if (json !== shownJson) {
      showMenu(fresh);
      shownJson = json;
      storage.set(MENU_CACHE_KEY, json);
    }
    setStale(false);
  } catch (error) {
    console.warn("Could not load the menu from Supabase:", error);
    if (!menu) showMenu(fromMenuData(MENU_DATA));
    setStale(true);
    window.addEventListener("online", refreshMenu, { once: true });
  }
}

function setStale(isStale) {
  document.getElementById("menuStale").hidden = !isStale;
}

function showLoading() {
  document.getElementById("menuContainer").replaceChildren(
    el("p", { className: "menu-loading" }, t("menu.loading")));
}

function showMenu(data) {
  menu = data.filter((category) => category.items.length > 0);
  const oldKeys = new Map();
  for (const [id, { item, category }] of ITEMS) oldKeys.set(id, itemKey(category, item));
  ITEMS.clear();
  const idByKey = new Map();
  for (const category of menu) {
    for (const item of category.items) {
      ITEMS.set(item.id, { item, category });
      const key = itemKey(category, item);
      if (!idByKey.has(key)) idByKey.set(key, item.id);
    }
  }
  for (const [id, qty] of [...selection]) {
    if (ITEMS.has(id)) continue;
    const sameProduct = idByKey.get(oldKeys.get(id) || id);
    if (!sameProduct) continue;
    selection.delete(id);
    selection.set(sameProduct, Math.min((selection.get(sameProduct) || 0) + qty, MAX_QTY));
  }
  for (const id of [...selection.keys()]) {
    const entry = ITEMS.get(id);
    if (!entry || !entry.item.available) selection.delete(id);
  }
  saveSelection();
  drawMenu();
  renderSelection();
  if (searchDialog().open) renderSearch();
  if (firstRender) {
    firstRender = false;
    jumpToSharedLink();
  }
}

function detectLanguage() {
  const fromUrl = new URLSearchParams(location.search).get("lang");
  if (LANGS.includes(fromUrl)) return fromUrl;
  const saved = storage.get(LANG_KEY);
  if (LANGS.includes(saved)) return saved;
  const preferred = (navigator.languages || [navigator.language || ""])
    .find((code) => /^(fr|en)/i.test(code));
  return preferred ? preferred.slice(0, 2).toLowerCase() : "fr";
}

function applyLanguage(newLang) {
  lang = newLang;
  document.documentElement.lang = lang;
  document.title = t("meta.title");

  for (const node of document.querySelectorAll("[data-i18n]")) {
    node.textContent = t(node.dataset.i18n);
  }
  for (const node of document.querySelectorAll("[data-i18n-attr]")) {
    for (const pair of node.dataset.i18nAttr.split(";")) {
      const [attr, key] = pair.split(":").map((part) => part.trim());
      node.setAttribute(attr, t(key));
    }
  }
  for (const button of document.querySelectorAll("[data-lang]")) {
    button.setAttribute("aria-pressed", String(button.dataset.lang === lang));
  }

  if (menu) {
    drawMenu();
    renderSelection();
  }
  else if (document.querySelector("#menuContainer .menu-loading")) showLoading();
  if (searchDialog().open) renderSearch();
  renderInfo();
}

function setupLanguage() {
  for (const button of document.querySelectorAll("[data-lang]")) {
    button.addEventListener("click", () => {
      const chosen = button.dataset.lang;
      if (chosen === lang) return;
      storage.set(LANG_KEY, chosen);
      const url = new URL(location.href);
      if (url.searchParams.has("lang")) {
        url.searchParams.set("lang", chosen);
        history.replaceState(null, "", url);
      }
      applyLanguage(chosen);
    });
  }
}

function drawMenu() {
  renderNavbar();
  renderMenu();
  setupScrollSpy();
  updateSteppers();
}

function renderNavbar() {
  const nav = document.getElementById("categoryNav");
  if (!nav) return;
  nav.replaceChildren(...menu.map((category) =>
    el("a", { className: "nav-pill", href: `#${category.id}` }, pick(category.name))));
}

function renderItem(item) {
  return el("div", { className: "menu-item" + (item.available ? "" : " is-unavailable"), dataset: { item: item.id } },
    item.image ? el("img", {
      className: "menu-item-photo", alt: "", width: 48, height: 48,
      loading: "lazy", decoding: "async", src: smallPhoto(item.image)
    }) : null,
    el("div", { className: "menu-item-left" },
      el("h4", {}, pick(item.name)),
      item.available ? null : el("span", { className: "item-badge" }, t("menu.unavailable")),
      item.desc ? el("div", { className: "menu-item-desc" }, pick(item.desc)) : null),
    el("span", { className: "item-price" }, formatPrice(item.price)),
    item.available ? stepper(item) : null);
}

function stepper(item) {
  const name = pick(item.name);
  return el("div", { className: "stepper", dataset: { stepper: item.id } },
    el("button", {
      type: "button", className: "add-btn", hidden: true,
      dataset: { less: item.id }, attrs: { "aria-label": t("sel.less", { name }) }
    }, icon("minus")),
    el("span", { className: "stepper-qty", hidden: true }),
    el("button", {
      type: "button", className: "add-btn",
      dataset: { add: item.id }, attrs: { "aria-label": t("sel.add", { name }) }
    }, icon("plus")));
}

function renderCategory(category) {
  const open = openCategories.has(category.id);
  return el("article", { className: "menu-category", id: category.id, dataset: { category: category.id } },
    el("button", {
      className: "category-toggle",
      dataset: { toggle: category.id },
      attrs: { "aria-expanded": String(open), "aria-controls": `${category.id}-items` }
    },
      el("img", { className: "category-bg", alt: "", loading: "lazy", src: getCategoryImage(category) }),
      el("div", { className: "category-overlay" }),
      el("div", { className: "category-toggle-inner" },
        el("h3", {}, pick(category.name)),
        el("span", { className: "toggle-arrow" + (open ? " open" : ""), attrs: { "aria-hidden": "true" } }, "▼"))),
    el("div", { className: "category-items" + (open ? "" : " collapsed"), id: `${category.id}-items` },
      el("div", { className: "menu-list" }, ...category.items.map(renderItem))));
}

function renderMenu() {
  const menuContainer = document.getElementById("menuContainer");
  if (!menuContainer) return;
  menuContainer.replaceChildren(...menu.map(renderCategory));
}

function categorySection(id) {
  return document.querySelector(`.menu-category[data-category="${CSS.escape(id)}"]`);
}

function setCategoryOpen(id, open, animate = true) {
  const section = categorySection(id);
  if (!section) return;
  if (open) openCategories.add(id);
  else openCategories.delete(id);
  if (!animate) section.classList.add("no-anim");
  section.querySelector(".category-items").classList.toggle("collapsed", !open);
  section.querySelector(".toggle-arrow").classList.toggle("open", open);
  section.querySelector(".category-toggle").setAttribute("aria-expanded", String(open));
  if (!animate) {
    void section.offsetHeight;
    section.classList.remove("no-anim");
  }
}

function setupMenuClicks() {
  const menuContainer = document.getElementById("menuContainer");
  if (!menuContainer) return;

  menuContainer.addEventListener("click", (event) => {
    if (event.target.closest(".stepper")) return;
    const btn = event.target.closest("[data-toggle]");
    if (btn) {
      const id = btn.dataset.toggle;
      setCategoryOpen(id, !openCategories.has(id));
      return;
    }

    const item = event.target.closest(".menu-item");
    if (item) {
      const isExpanded = item.classList.contains("expanded");
      const siblings = item.closest(".menu-list").querySelectorAll(".menu-item");
      siblings.forEach((s) => s.classList.remove("expanded"));
      if (!isExpanded) item.classList.add("expanded");
    }
  });
}

function jumpToSharedLink() {
  let id = "";
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  if (!id || !menu.some((category) => category.id === id)) return;
  const target = categorySection(id);
  if (target) target.scrollIntoView({ behavior: "instant" });
}

function setupScrollSpy() {
  if (scrollSpy) scrollSpy.disconnect();
  const pills = document.querySelectorAll(".nav-pill");
  const categories = document.querySelectorAll(".menu-category");

  scrollSpy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        pills.forEach((pill) => {
          pill.classList.toggle("active", pill.getAttribute("href") === `#${id}`);
        });
      }
    });
  }, { rootMargin: "-40% 0px -55% 0px" });

  categories.forEach((cat) => scrollSpy.observe(cat));
}

function searchDialog() {
  return document.getElementById("searchDialog");
}

function normalize(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/(.)\1+/g, "$1");
}
function wordsOf(text) {
  return normalize(text).split(/[^a-z0-9]+/).filter(Boolean);
}
function bothLanguages(value) {
  if (!value) return "";
  return typeof value === "string" ? value : value.fr + " " + (value.en || "");
}

function findItems(query) {
  const typed = wordsOf(query);
  if (!typed.length) return [];
  const results = [];
  for (const [id, { item, category }] of ITEMS) {
    const nameWords = wordsOf(bothLanguages(item.name));
    const allWords = nameWords.concat(wordsOf(bothLanguages(item.desc) + " " + bothLanguages(category.name)));
    if (!typed.every((word) => allWords.some((w) => w.startsWith(word)))) continue;
    const score = normalize(pick(item.name)).startsWith(typed[0]) ? 0
      : nameWords.some((w) => w.startsWith(typed[0])) ? 1 : 2;
    results.push({ id, score });
  }
  return results.sort((a, b) => a.score - b.score).slice(0, 40);
}

function renderSearch() {
  const list = document.getElementById("searchResults");
  const status = document.getElementById("searchStatus");
  const query = document.getElementById("searchInput").value.trim();
  if (!menu || !query) {
    list.replaceChildren();
    status.textContent = menu ? t("search.hint") : t("menu.loading");
    return;
  }
  const results = findItems(query);
  status.textContent = results.length === 0 ? t("search.none", { q: query })
    : results.length === 1 ? t("search.one") : t("search.count", { n: results.length });
  list.replaceChildren(...results.map(({ id }) => {
    const { item, category } = ITEMS.get(id);
    return el("li", {}, el("button", {
      type: "button",
      className: "search-result" + (item.available ? "" : " is-unavailable"),
      dataset: { goto: id }
    },
      el("span", { className: "search-result-main" },
        el("span", { className: "search-result-name" }, pick(item.name)),
        el("span", { className: "search-result-where" }, pick(category.name))),
      item.available
        ? el("span", { className: "item-price" }, formatPrice(item.price))
        : el("span", { className: "item-badge" }, t("menu.unavailable"))));
  }));
}

function openSearch() {
  const dialog = searchDialog();
  const input = document.getElementById("searchInput");
  renderSearch();
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  input.focus();
  input.select();
}
function closeSearch() {
  const dialog = searchDialog();
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

let foundTimer = null;
function goToItem(id) {
  closeSearch();
  if (!ITEMS.has(id)) return;
  setCategoryOpen(ITEMS.get(id).category.id, true, false);
  const row = document.querySelector(`.menu-item[data-item="${CSS.escape(id)}"]`);
  if (!row) return;
  row.scrollIntoView({ block: "center", behavior: "instant" });
  document.querySelectorAll(".menu-item.is-found").forEach((node) => node.classList.remove("is-found"));
  void row.offsetWidth;
  row.classList.add("is-found");
  clearTimeout(foundTimer);
  foundTimer = setTimeout(() => row.classList.remove("is-found"), 2500);
  row.tabIndex = -1;
  row.focus({ preventScroll: true });
}

function setupSearch() {
  const dialog = searchDialog();
  const input = document.getElementById("searchInput");
  document.getElementById("searchOpen").addEventListener("click", openSearch);
  document.getElementById("searchClose").addEventListener("click", closeSearch);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeSearch();
  });
  input.addEventListener("input", renderSearch);
  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
      return;
    }
    if (event.key !== "Enter") return;
    const first = document.querySelector("#searchResults [data-goto]");
    if (first) {
      event.preventDefault();
      goToItem(first.dataset.goto);
    }
  });
  document.getElementById("searchResults").addEventListener("click", (event) => {
    const result = event.target.closest("[data-goto]");
    if (result) goToItem(result.dataset.goto);
  });
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAPS_LINK = /^https:\/\/((www\.)?google\.[a-z.]{2,8}\/maps|maps\.google\.[a-z.]{2,8}|maps\.app\.goo\.gl|goo\.gl\/maps)\//i;
const PHONE = /^\+?[0-9][0-9 .-]{5,18}$/;
const HOURS_KEYS = ["hours_week_open", "hours_week_close", "hours_weekend_open", "hours_weekend_close"];

let info = {};
let defaultMaps = "";
let copyTimer = null;

function hasInfo(key) {
  return typeof info[key] === "string";
}
function infoText(key, maxLength) {
  return hasInfo(key) ? info[key].trim().slice(0, maxLength) : "";
}

function openingHours() {
  const span = (days) => {
    const open = infoText("hours_" + days + "_open", 5);
    const close = infoText("hours_" + days + "_close", 5);
    return TIME.test(open) && TIME.test(close) ? [open, close] : null;
  };
  const week = span("week");
  const weekend = span("weekend");
  if (week && weekend && week.join() === weekend.join()) return [["hours.everyday", ...week]];
  return [["hours.week", week], ["hours.weekend", weekend]].filter(([, time]) => time)
    .map(([key, time]) => [key, ...time]);
}

function setRowText(node, text) {
  node.replaceChildren(node.querySelector("i"), " " + text);
}

function renderInfo() {
  const hours = openingHours();
  document.getElementById("hoursRows").replaceChildren(...hours.map(([key, open, close]) =>
    el("div", {}, el("dt", {}, t(key)), el("dd", { className: "side-time" }, open + " – " + close))));
  document.getElementById("sideHours").hidden = hours.length === 0;
  const footerHours = document.getElementById("footerHours");
  if (!HOURS_KEYS.some(hasInfo)) {
    setRowText(footerHours, t("footer.hours"));
  } else {
    footerHours.closest("li").hidden = hours.length === 0;
    setRowText(footerHours, hours.map(([key, open, close]) => t(key + "Short") + ", " + open + " - " + close).join(" · "));
  }

  const wifiName = infoText("wifi_name", 60);
  const wifiPassword = infoText("wifi_password", 100);
  document.getElementById("sideWifi").hidden = !wifiName;
  document.getElementById("wifiName").textContent = wifiName;
  document.getElementById("wifiPassword").textContent = wifiPassword;
  document.getElementById("wifiPasswordRow").hidden = !wifiPassword;
  document.getElementById("wifiCopy").hidden = !wifiPassword;

  const mapsUrl = infoText("maps_url", 300);
  for (const link of document.querySelectorAll("[data-maps]")) link.href = MAPS_LINK.test(mapsUrl) ? mapsUrl : defaultMaps;

  const address = infoText("address", 120);
  document.getElementById("findAddress").textContent = address;
  document.getElementById("findAddressRow").hidden = !address;
  if (hasInfo("address")) {
    const row = document.getElementById("footerAddress");
    row.closest("li").hidden = !address;
    if (address) setRowText(row, address);
  }

  const phone = infoText("phone", 20);
  const hasPhone = PHONE.test(phone);
  const findPhone = document.getElementById("findPhone");
  document.getElementById("findPhoneRow").hidden = !hasPhone;
  findPhone.textContent = hasPhone ? phone : "";
  if (hasPhone) findPhone.href = "tel:" + phone.replace(/[^+0-9]/g, "");
  else findPhone.removeAttribute("href");
  if (hasInfo("phone")) {
    const link = document.getElementById("footerPhone");
    link.closest("li").hidden = !hasPhone;
    if (hasPhone) {
      link.href = "tel:" + phone.replace(/[^+0-9]/g, "");
      setRowText(link, phone);
    }
  }
}

async function loadInfo() {
  if (!DB_READY) return;
  try {
    const saved = JSON.parse(storage.get(INFO_CACHE_KEY) || "null");
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      info = saved;
      renderInfo();
    }
  } catch {}

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DB_TIMEOUT_MS);
  try {
    const url = SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/settings?select=key,value";
    const response = await fetch(url, { headers: { apikey: SUPABASE_KEY }, signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error("Supabase answered " + response.status);
    const rows = await response.json();
    if (!Array.isArray(rows)) throw new Error("Supabase sent no details");
    info = Object.fromEntries(rows.filter((row) => row && typeof row.key === "string" && typeof row.value === "string")
      .map((row) => [row.key, row.value]));
    storage.set(INFO_CACHE_KEY, JSON.stringify(info));
    renderInfo();
  } catch (error) {
    console.warn("Could not load the café details from Supabase:", error);
    window.addEventListener("online", loadInfo, { once: true });
  } finally {
    clearTimeout(timer);
  }
}

async function copyWifiPassword() {
  const password = infoText("wifi_password", 100);
  let copied = false;
  try {
    await navigator.clipboard.writeText(password);
    copied = true;
  } catch {
    const field = el("textarea", { value: password, readOnly: true, className: "visually-hidden" });
    document.getElementById("sideMenu").append(field);
    field.select();
    try { copied = document.execCommand("copy"); } catch {}
    field.remove();
    document.getElementById("wifiCopy").focus();
  }
  const status = document.getElementById("wifiStatus");
  status.textContent = t(copied ? "wifi.copied" : "wifi.copyFailed");
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => { status.textContent = ""; }, 4000);
}

function setupSideMenu() {
  const sideMenu = document.getElementById("sideMenu");
  const close = () => {
    if (typeof sideMenu.close === "function") sideMenu.close();
    else sideMenu.removeAttribute("open");
  };
  document.getElementById("sideMenuOpen").addEventListener("click", () => {
    if (typeof sideMenu.showModal === "function") sideMenu.showModal();
    else sideMenu.setAttribute("open", "");
  });
  document.getElementById("sideMenuClose").addEventListener("click", close);
  sideMenu.addEventListener("click", (event) => {
    if (event.target === sideMenu) close();
  });
  document.getElementById("wifiCopy").addEventListener("click", copyWifiPassword);

  const instagram = document.getElementById("findInstagram");
  instagram.textContent = "@" + new URL(instagram.href).pathname.split("/").filter(Boolean)[0];

  defaultMaps = document.querySelector("[data-maps]").getAttribute("href");
}

const SELECTION_KEY = "bolivar-selection";
const MAX_QTY = 99;
const selection = new Map();

const ICONS = {
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M5 12h14"/></svg>'
};
function icon(name) {
  const holder = document.createElement("span");
  holder.innerHTML = ICONS[name];
  return holder.firstElementChild;
}

function itemKey(category, item) {
  const name = typeof item.name === "string" ? item.name : item.name.fr;
  return category.id + "/" + slugify(name);
}

function loadSelection() {
  try {
    const saved = JSON.parse(storage.get(SELECTION_KEY) || "[]");
    if (!Array.isArray(saved)) return;
    for (const pair of saved) {
      if (!Array.isArray(pair)) continue;
      const [id, qty] = pair;
      if (typeof id === "string" && Number.isInteger(qty) && qty > 0) selection.set(id, Math.min(qty, MAX_QTY));
    }
  } catch {}
}

function saveSelection() {
  storage.set(SELECTION_KEY, JSON.stringify([...selection]));
}

function selectionName(id) {
  const entry = ITEMS.get(id);
  return entry ? pick(entry.item.name) : "";
}

function updateSteppers() {
  for (const box of document.querySelectorAll("[data-stepper]")) {
    const id = box.dataset.stepper;
    const qty = selection.get(id) || 0;
    const name = selectionName(id);
    const less = box.querySelector("[data-less]");
    const count = box.querySelector(".stepper-qty");
    const add = box.querySelector("[data-add]");
    less.hidden = qty === 0;
    count.hidden = qty === 0;
    count.textContent = String(qty);
    add.disabled = qty >= MAX_QTY;
    add.setAttribute("aria-label", t(qty ? "sel.more" : "sel.add", { name }));
  }
}

function renderSelection() {
  let count = 0;
  let total = 0;
  const rows = [];
  for (const [id, qty] of selection) {
    const entry = ITEMS.get(id);
    if (!entry) continue;
    count += qty;
    total += qty * entry.item.price;
    const name = pick(entry.item.name);
    rows.push(el("li", { className: "sel-row" },
      el("p", { className: "sel-row-name" }, name, el("span", { className: "sel-row-cat" }, pick(entry.category.name))),
      el("div", { className: "sel-row-side" },
        el("div", { className: "sel-qty" },
          el("button", { type: "button", className: "add-btn", dataset: { qty: id, delta: "-1" }, attrs: { "aria-label": t("sel.less", { name }) } }, icon("minus")),
          el("span", { className: "stepper-qty" }, String(qty)),
          el("button", {
            type: "button", className: "add-btn", disabled: qty >= MAX_QTY,
            dataset: { qty: id, delta: "1" }, attrs: { "aria-label": t("sel.more", { name }) }
          }, icon("plus"))),
        el("span", { className: "item-price" }, formatPrice(qty * entry.item.price)))));
  }
  document.getElementById("selectionList").replaceChildren(...rows);
  document.getElementById("selectionEmpty").hidden = rows.length > 0;
  document.getElementById("selectionClear").hidden = rows.length === 0;
  document.getElementById("selectionSum").textContent = formatPrice(total);

  const pill = document.getElementById("selectionOpen");
  pill.hidden = count === 0;
  document.getElementById("selectionCount").textContent = String(count);
  document.getElementById("selectionTotal").textContent = formatPrice(total);
  pill.setAttribute("aria-label", t("sel.openLabel", { n: count, price: formatPrice(total) }));
  document.body.classList.toggle("has-selection", count > 0);
  updateSteppers();
}

let toastTimer = null;
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function addToSelection(id, button) {
  if (!ITEMS.has(id)) return;
  const qty = selection.get(id) || 0;
  if (qty >= MAX_QTY) return;
  selection.set(id, qty + 1);
  saveSelection();
  renderSelection();
  showToast(t("sel.added", { name: selectionName(id) }));
  if (button) {
    button.classList.add("is-added");
    setTimeout(() => button.classList.remove("is-added"), 700);
  }
  const pill = document.getElementById("selectionOpen");
  pill.classList.remove("bump");
  void pill.offsetWidth;
  pill.classList.add("bump");
}

function removeFromSelection(id) {
  const qty = selection.get(id) || 0;
  if (!qty) return;
  if (qty > 1) selection.set(id, qty - 1);
  else selection.delete(id);
  saveSelection();
  renderSelection();
  showToast(t("sel.removed", { name: selectionName(id) }));
  if (qty === 1) {
    const add = document.querySelector(`[data-stepper="${CSS.escape(id)}"] [data-add]`);
    if (add) add.focus();
  }
}

function changeQuantity(id, delta) {
  const qty = Math.min((selection.get(id) || 0) + delta, MAX_QTY);
  if (qty <= 0) selection.delete(id);
  else selection.set(id, qty);
  saveSelection();
  renderSelection();
}

function setupSelection() {
  const dialog = document.getElementById("selectionDialog");
  const closeButton = document.getElementById("selectionClose");
  const close = () => {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  };
  document.getElementById("selectionOpen").addEventListener("click", () => {
    renderSelection();
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  });
  closeButton.addEventListener("click", close);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });
  document.getElementById("selectionClear").addEventListener("click", () => {
    selection.clear();
    saveSelection();
    renderSelection();
    closeButton.focus();
  });

  document.addEventListener("click", (event) => {
    const add = event.target.closest("[data-add]");
    if (add) {
      addToSelection(add.dataset.add, add);
      return;
    }
    const less = event.target.closest("[data-less]");
    if (less) {
      removeFromSelection(less.dataset.less);
      return;
    }
    const qtyButton = event.target.closest("[data-qty]");
    if (qtyButton) {
      const { qty: id, delta } = qtyButton.dataset;
      changeQuantity(id, Number(delta));
      const buttons = [...document.querySelectorAll("#selectionList [data-qty]")].filter((button) => button.dataset.qty === id);
      const same = buttons.find((button) => button.dataset.delta === delta);
      (same && !same.disabled ? same : buttons.find((button) => !button.disabled) || closeButton).focus();
    }
  });
}

function init() {
  if (typeof MENU_DATA === "undefined" || typeof TEXT === "undefined") {
    console.error("menu-data.js or translations.js did not load.");
    return;
  }
  setupMenuClicks();
  setupSearch();
  setupSideMenu();
  setupSelection();
  setupLanguage();
  loadSelection();
  applyLanguage(detectLanguage());
  loadMenu();
  loadInfo();
}

document.addEventListener("DOMContentLoaded", init);
