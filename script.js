/*
  Bolivar — page script (plain JavaScript, no libraries)

  1. Menu data   comes from Supabase when supabase-config.js is filled in (what the owner edits on
                 admin.html). The last menu loaded is kept on the phone, so the page still works if
                 Supabase is unreachable; an older copy on screen carries a "could not be updated"
                 note. Without Supabase, or before it has ever answered: menu-data.js.
  2. Language    French / English switch in the header, remembered in the browser (?lang=en forces it)
  3. Menu        category bar and price lists; categories open when their photo banner is tapped
  4. Search      the magnifier in the header finds a product and jumps to it
  5. ☰ menu      opening hours, Wi-Fi, address and phone from the "Infos" tab of admin.html;
                 the footer shows the same details (until they are loaded, it keeps its own text)

  Loaded before this file: menu-data.js (MENU_DATA, CATEGORY_PLACEHOLDERS), translations.js (TEXT),
  supabase-config.js.
*/

const LANGS = ["fr", "en"];
const LANG_KEY = "bolivar-lang";
const MENU_CACHE_KEY = "bolivar-menu-v1";
const INFO_CACHE_KEY = "bolivar-info-v1";
const FALLBACK_AFTER_MS = 6000; // Supabase slower than this: show the built-in menu meanwhile…
const DB_TIMEOUT_MS = 30000;    // …and keep waiting this long for the real one
const DB_READY = typeof SUPABASE_URL === "string" && SUPABASE_URL !== "" &&
  typeof SUPABASE_KEY === "string" && SUPABASE_KEY !== "";
const DEFAULT_CATEGORY_IMAGE = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80";

// The menu on screen, whatever its source:
//   [{ id, name, image, items: [{ id, name, price, desc, image, available }] }]
// name / desc: "same in both languages" or { fr, en } (empty en → French)
let menu = null;
let shownJson = null; // the Supabase or saved menu on screen, to redraw only when it changed
let firstRender = true;
let lang = "fr";
const ITEMS = new Map();          // item id -> { item, category }
const openCategories = new Set(); // categories the customer opened, kept open after a redraw
let scrollSpy = null;

// localStorage can be blocked (private browsing, strict settings): never let that break the page
const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* ignore */ } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } }
};

/* ---------- Helpers ---------- */

function slugify(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
}

function formatPrice(price) {
  return `${Number(price).toFixed(2)} DT`;
}

// Interface text from translations.js, with {placeholders} filled in
function t(key, values) {
  let text = TEXT[lang][key] ?? TEXT.fr[key] ?? key;
  // A function, so "$&" typed in the search is shown as typed (not read as a replace() pattern)
  for (const name in values) text = text.replace("{" + name + "}", () => values[name]);
  return text;
}

// A menu text in the current language
function pick(value) {
  if (!value) return "";
  return typeof value === "string" ? value : (value[lang] || value.fr);
}
function isText(value) {
  return typeof value === "string" || (value !== null && typeof value === "object" && typeof value.fr === "string");
}

// Build an element; text is always inserted as text, never as HTML
// (names and descriptions come from the database, typed on the admin page)
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

// Photos uploaded on the admin page have a small copy next to them ("-800." → "-480.")
function smallPhoto(url) {
  return url && url.includes("-800.") ? url.replace("-800.", "-480.") : url;
}

/* ---------- 1. Menu data ---------- */

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

// A usable menu: at least one product, and every part in the expected shape
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
    // An empty answer is a fault (rules or data), never a real menu: keep what we have
    if (!isMenu(data)) throw new Error("Supabase sent no menu");
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// The copy saved on this phone; a damaged one is thrown away (it would never be replaced otherwise)
function readCachedMenu() {
  let data;
  try { data = JSON.parse(storage.get(MENU_CACHE_KEY) || "null"); } catch { data = undefined; } // damaged
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
  // Show the copy saved on this phone straight away, then refresh it from Supabase
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
  // Supabase is slow: show the built-in menu meanwhile; the real one replaces it when it arrives
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
      storage.set(MENU_CACHE_KEY, json); // saved only once it was shown without a problem
    }
    setStale(false);
  } catch (error) {
    console.warn("Could not load the menu from Supabase:", error);
    if (!menu) showMenu(fromMenuData(MENU_DATA)); // nothing better available
    setStale(true);
    window.addEventListener("online", refreshMenu, { once: true }); // try again when the phone is back online
  }
}

// "The menu could not be updated" note, while an older copy is on screen
function setStale(isStale) {
  document.getElementById("menuStale").hidden = !isStale;
}

function showLoading() {
  document.getElementById("menuContainer").replaceChildren(
    el("p", { className: "menu-loading" }, t("menu.loading")));
}

function showMenu(data) {
  // Empty categories are not shown
  menu = data.filter((category) => category.items.length > 0);
  ITEMS.clear();
  for (const category of menu) {
    for (const item of category.items) ITEMS.set(item.id, { item, category });
  }
  drawMenu();
  if (searchDialog().open) renderSearch();
  if (firstRender) {
    firstRender = false;
    jumpToSharedLink();
  }
}

/* ---------- 2. Language ---------- */

function detectLanguage() {
  const fromUrl = new URLSearchParams(location.search).get("lang");
  if (LANGS.includes(fromUrl)) return fromUrl;
  const saved = storage.get(LANG_KEY);
  if (LANGS.includes(saved)) return saved;
  // First visit: French, unless the phone's first French or English language is English
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

  if (menu) drawMenu();
  else if (document.querySelector("#menuContainer .menu-loading")) showLoading();
  if (searchDialog().open) renderSearch();
  renderInfo(); // after the loop above: the footer's hours may come from Supabase
}

function setupLanguage() {
  for (const button of document.querySelectorAll("[data-lang]")) {
    button.addEventListener("click", () => {
      const chosen = button.dataset.lang;
      if (chosen === lang) return;
      storage.set(LANG_KEY, chosen);
      // Keep a shared link like ?lang=en in step with the choice
      const url = new URL(location.href);
      if (url.searchParams.has("lang")) {
        url.searchParams.set("lang", chosen);
        history.replaceState(null, "", url);
      }
      applyLanguage(chosen);
    });
  }
}

/* ---------- 3. Menu ---------- */

function drawMenu() {
  renderNavbar();
  renderMenu();
  setupScrollSpy();
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
    el("span", { className: "item-price" }, formatPrice(item.price)));
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

// Opens or closes a category. Without animation (search, shared link), the panel has its
// final height at once, so a jump into it lands on the right row.
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
    void section.offsetHeight; // apply the final height before transitions come back
    section.classList.remove("no-anim");
  }
}

function setupMenuClicks() {
  const menuContainer = document.getElementById("menuContainer");
  if (!menuContainer) return;

  menuContainer.addEventListener("click", (event) => {
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

// A shared link like "#nos-cafes": the category did not exist yet when the browser read it
function jumpToSharedLink() {
  let id = "";
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; } // e.g. "#%E0"
  if (!id || !menu.some((category) => category.id === id)) return;
  const target = categorySection(id);
  if (target) target.scrollIntoView({ behavior: "instant" });
}

function setupScrollSpy() {
  if (scrollSpy) scrollSpy.disconnect(); // the menu was redrawn
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

/* ---------- 4. Search ---------- */

function searchDialog() {
  return document.getElementById("searchDialog");
}

// "Cappuccino Spéculoos" -> "capucino speculos": lower case, no accents and no doubled
// letters, so "creme" finds "Crème" and "capucino" or "capu" finds "Cappuccino"
function normalize(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/(.)\1+/g, "$1");
}
function wordsOf(text) {
  return normalize(text).split(/[^a-z0-9]+/).filter(Boolean);
}
// Both languages of a text, so a French or an English word finds the product
function bothLanguages(value) {
  if (!value) return "";
  return typeof value === "string" ? value : value.fr + " " + (value.en || "");
}

// Every word typed must be the start of a word in the product's names, description or category:
// "capu" finds "Cappuccino", and "nut" finds "Nutella" but not "Coconut"
function findItems(query) {
  const typed = wordsOf(query);
  if (!typed.length) return [];
  const results = [];
  for (const [id, { item, category }] of ITEMS) {
    const nameWords = wordsOf(bothLanguages(item.name));
    const allWords = nameWords.concat(wordsOf(bothLanguages(item.desc) + " " + bothLanguages(category.name)));
    if (!typed.every((word) => allWords.some((w) => w.startsWith(word)))) continue;
    // Best first: the shown name starts with the first word, then a word of the name does, then the rest
    const score = normalize(pick(item.name)).startsWith(typed[0]) ? 0
      : nameWords.some((w) => w.startsWith(typed[0])) ? 1 : 2;
    results.push({ id, score });
  }
  return results.sort((a, b) => a.score - b.score).slice(0, 40); // same score: menu order
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

// Close the search, open the product's category, scroll to the product and light it up for a moment
let foundTimer = null;
function goToItem(id) {
  closeSearch();
  if (!ITEMS.has(id)) return;
  setCategoryOpen(ITEMS.get(id).category.id, true, false);
  const row = document.querySelector(`.menu-item[data-item="${CSS.escape(id)}"]`);
  if (!row) return;
  // A jump, not a smooth scroll: the product can be thousands of pixels away
  row.scrollIntoView({ block: "center", behavior: "instant" });
  document.querySelectorAll(".menu-item.is-found").forEach((node) => node.classList.remove("is-found"));
  void row.offsetWidth; // restart the highlight
  row.classList.add("is-found");
  clearTimeout(foundTimer);
  foundTimer = setTimeout(() => row.classList.remove("is-found"), 2500);
  // Keyboard and screen-reader users continue from the product they chose
  row.tabIndex = -1;
  row.focus({ preventScroll: true });
}

function setupSearch() {
  const dialog = searchDialog();
  const input = document.getElementById("searchInput");
  document.getElementById("searchOpen").addEventListener("click", openSearch);
  document.getElementById("searchClose").addEventListener("click", closeSearch);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeSearch(); // click on the dark area around the panel
  });
  input.addEventListener("input", renderSearch);
  input.addEventListener("keydown", (event) => {
    // In a search box the browser's first Esc only clears the text: close the panel at once instead
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

/* ---------- 5. ☰ menu and footer: the café's details ("Infos" tab of admin.html) ---------- */

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
// Same rules as the admin page: only Google Maps links, and phone numbers made of digits
const MAPS_LINK = /^https:\/\/((www\.)?google\.[a-z.]{2,8}\/maps|maps\.google\.[a-z.]{2,8}|maps\.app\.goo\.gl|goo\.gl\/maps)\//i;
const PHONE = /^\+?[0-9][0-9 .-]{5,18}$/;
const HOURS_KEYS = ["hours_week_open", "hours_week_close", "hours_weekend_open", "hours_weekend_close"];

let info = {}; // the café's details (Supabase table "settings"): key -> value
let defaultMaps = "";
let copyTimer = null;

function hasInfo(key) {
  return typeof info[key] === "string";
}
function infoText(key, maxLength) {
  return hasInfo(key) ? info[key].trim().slice(0, maxLength) : "";
}

// [[label key, opening, closing], …]; the same hours on both lines become one "every day" row
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

// Footer rows are "<i icon></i> text": keep the icon, replace the text
function setRowText(node, text) {
  node.replaceChildren(node.querySelector("i"), " " + text);
}

// A detail never saved on the admin page keeps the footer's own text; one saved empty
// (or not valid) hides its row. The ☰ menu shows only what is filled in.
function renderInfo() {
  const hours = openingHours();
  document.getElementById("hoursRows").replaceChildren(...hours.map(([key, open, close]) =>
    el("div", {}, el("dt", {}, t(key)), el("dd", { className: "side-time" }, open + " – " + close))));
  document.getElementById("sideHours").hidden = hours.length === 0;
  // Footer: "Lun-Dim, 07:00 - 23:00", or "Lun-Ven, 07:00 - 23:00 · Sam-Dim, 09:00 - 00:00"
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

  // The address opens Google Maps (the café's own link once the owner adds it)
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

// The details saved on this phone first, then the latest from Supabase (same idea as the menu)
async function loadInfo() {
  if (!DB_READY) return;
  try {
    const saved = JSON.parse(storage.get(INFO_CACHE_KEY) || "null");
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      info = saved;
      renderInfo();
    }
  } catch { /* a damaged saved copy is ignored; the fresh one replaces it */ }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DB_TIMEOUT_MS);
  try {
    const url = SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/settings?select=key,value";
    const response = await fetch(url, { headers: { apikey: SUPABASE_KEY }, signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error("Supabase answered " + response.status); // 404: the table is not there yet
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
    // Older browsers, or copying not allowed: copy from a hidden text field instead.
    // It goes inside the open panel, since the rest of the page cannot be used meanwhile.
    const field = el("textarea", { value: password, readOnly: true, className: "visually-hidden" });
    document.getElementById("sideMenu").append(field);
    field.select();
    try { copied = document.execCommand("copy"); } catch { /* not supported */ }
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
    if (event.target === sideMenu) close(); // click on the dark area beside the panel
  });
  document.getElementById("wifiCopy").addEventListener("click", copyWifiPassword);

  // "@account", from the address of the Instagram link
  const instagram = document.getElementById("findInstagram");
  instagram.textContent = "@" + new URL(instagram.href).pathname.split("/").filter(Boolean)[0];

  defaultMaps = document.querySelector("[data-maps]").getAttribute("href");
}

/* ---------- Start ---------- */

function init() {
  if (typeof MENU_DATA === "undefined" || typeof TEXT === "undefined") {
    console.error("menu-data.js or translations.js did not load.");
    return;
  }
  setupMenuClicks();
  setupSearch();
  setupSideMenu();
  setupLanguage();
  applyLanguage(detectLanguage());
  loadMenu();
  loadInfo();
}

document.addEventListener("DOMContentLoaded", init);
