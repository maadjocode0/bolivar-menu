/*
  Bolivar — page script (plain JavaScript, no libraries)

  - The menu comes from Supabase when supabase-config.js is filled in (what the owner edits on
    admin.html). The last menu loaded is kept on the phone, so the page still works if Supabase
    is unreachable; an older copy on screen carries a "could not be updated" note.
    Without Supabase, or before it has ever answered: the built-in copy in menu-data.js.
  - The footer's hours, address, Maps link and phone come from the "Infos" tab of admin.html;
    until they are loaded, the footer keeps the text written in index.html.

  Loaded before this file: menu-data.js (MENU_DATA, CATEGORY_PLACEHOLDERS), supabase-config.js.
*/

const MENU_CACHE_KEY = "bolivar-menu-v1";
const INFO_CACHE_KEY = "bolivar-info-v1";
const FALLBACK_AFTER_MS = 6000; // Supabase slower than this: show the built-in menu meanwhile…
const DB_TIMEOUT_MS = 30000;    // …and keep waiting this long for the real one
const DB_READY = typeof SUPABASE_URL === "string" && SUPABASE_URL !== "" &&
  typeof SUPABASE_KEY === "string" && SUPABASE_KEY !== "";
const DEFAULT_CATEGORY_IMAGE = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80";

// The menu on screen, whatever its source:
//   [{ id, name, image, items: [{ id, name, price, desc, image, available }] }]
let menu = null;
let shownJson = null; // the Supabase or saved menu on screen, to redraw only when it changed
let firstRender = true;
const openCategories = new Set(); // categories the customer opened, kept open after a redraw
let scrollSpy = null;

// localStorage can be blocked (private browsing, strict settings): never let that break the page
const storage = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* ignore */ } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } }
};

function slugify(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
}

function formatPrice(price) {
  return `${Number(price).toFixed(2)} DT`;
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

/* ---------- Menu data ---------- */

function fromMenuData(data) {
  return data.map((block) => ({
    id: slugify(block.category),
    name: block.category,
    image: block.image && block.image.trim() !== "" ? block.image : CATEGORY_PLACEHOLDERS[block.category] || null,
    items: block.items.map((item) => ({
      id: slugify(block.category) + "/" + slugify(item.name),
      name: item.name,
      price: item.price,
      desc: item.desc || "",
      image: null,
      available: true
    }))
  }));
}

function fromDatabase(rows) {
  return rows.map((category) => ({
    id: category.id,
    name: category.name_fr,
    image: category.image_url || CATEGORY_PLACEHOLDERS[category.name_fr] || null,
    items: (category.items || []).map((item) => ({
      id: item.id,
      name: item.name_fr,
      price: Number(item.price),
      desc: item.description_fr || "",
      image: item.image_url || null,
      available: item.available !== false
    }))
  }));
}

// A usable menu: at least one product, and every part in the expected shape
function isMenu(data) {
  return Array.isArray(data) &&
    data.some((category) => category && Array.isArray(category.items) && category.items.length > 0) &&
    data.every((category) => category && typeof category.id === "string" && typeof category.name === "string" &&
      Array.isArray(category.items) &&
      category.items.every((item) => item && typeof item.id === "string" && typeof item.name === "string" &&
        typeof item.price === "number" && Number.isFinite(item.price)));
}

async function fetchMenuFromDatabase() {
  const columns = "id,name_fr,image_url,position,items(id,name_fr,description_fr,price,image_url,available,position)";
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
    el("p", { className: "menu-loading" }, "Chargement de la carte…"));
}

function showMenu(data) {
  // Empty categories are not shown
  menu = data.filter((category) => category.items.length > 0);
  renderNavbar();
  renderMenu();
  setupScrollSpy();
  applySearch();
  if (firstRender) {
    firstRender = false;
    jumpToSharedLink();
  }
}

/* ---------- Menu ---------- */

function renderNavbar() {
  const nav = document.getElementById("categoryNav");
  if (!nav) return;
  nav.replaceChildren(...menu.map((category) =>
    el("a", { className: "nav-pill", href: `#${category.id}` }, category.name)));
}

function renderItem(item) {
  return el("div", { className: "menu-item" + (item.available ? "" : " is-unavailable") },
    item.image ? el("img", {
      className: "menu-item-photo", alt: "", width: 48, height: 48,
      loading: "lazy", decoding: "async", src: smallPhoto(item.image)
    }) : null,
    el("div", { className: "menu-item-left" },
      el("h4", {}, item.name),
      item.available ? null : el("span", { className: "item-badge" }, "Indisponible"),
      item.desc ? el("div", { className: "menu-item-desc" }, item.desc) : null),
    el("span", { className: "item-price" }, formatPrice(item.price)));
}

function renderCategory(category) {
  const open = openCategories.has(category.id);
  return el("article", { className: "menu-category", id: category.id },
    el("button", {
      className: "category-toggle",
      dataset: { target: `${category.id}-items`, category: category.id },
      attrs: { "aria-expanded": String(open) }
    },
      el("img", { className: "category-bg", alt: "", loading: "lazy", src: getCategoryImage(category) }),
      el("div", { className: "category-overlay" }),
      el("div", { className: "category-toggle-inner" },
        el("h3", {}, category.name),
        el("span", { className: "toggle-arrow" + (open ? " open" : "") }, "▼"))),
    el("div", { className: "category-items" + (open ? "" : " collapsed"), id: `${category.id}-items` },
      el("div", { className: "menu-list" }, ...category.items.map(renderItem))));
}

function renderMenu() {
  const menuContainer = document.getElementById("menuContainer");
  if (!menuContainer) return;
  menuContainer.replaceChildren(...menu.map(renderCategory));
}

function setupMenuClicks() {
  const menuContainer = document.getElementById("menuContainer");
  if (!menuContainer) return;

  menuContainer.addEventListener("click", (event) => {
    const btn = event.target.closest(".category-toggle");
    if (btn) {
      const items = document.getElementById(btn.dataset.target);
      const arrow = btn.querySelector(".toggle-arrow");
      const isOpen = !items.classList.contains("collapsed");
      items.classList.toggle("collapsed", isOpen);
      arrow.classList.toggle("open", !isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));
      if (isOpen) openCategories.delete(btn.dataset.category);
      else openCategories.add(btn.dataset.category);
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
  const target = document.getElementById(id);
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

function setupStickyHeader() {
  const header = document.getElementById("siteHeader");
  const hero = document.querySelector(".hero");
  if (!header || !hero) return;

  // Keep --header-h in sync with the header's real height so the sticky
  // category nav (and scroll offsets) sit just below it at every breakpoint.
  const syncHeight = () => {
    document.documentElement.style.setProperty("--header-h", header.offsetHeight + "px");
  };

  let ticking = false;
  const update = () => {
    // Show the fixed header once the hero has scrolled out of view,
    // i.e. when its bottom edge reaches the header's resting position.
    const heroBottom = hero.getBoundingClientRect().bottom;
    header.classList.toggle("visible", heroBottom <= header.offsetHeight);
    ticking = false;
  };

  const refresh = () => { syncHeight(); update(); };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  // The header wraps to two rows on mobile and the hero grows as fonts/images
  // load, so recompute height + visibility whenever either box changes (not
  // only on scroll) — otherwise an early measurement can leave a stale state.
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(refresh);
    ro.observe(header);
    ro.observe(hero);
  } else {
    window.addEventListener("resize", refresh, { passive: true });
  }
  window.addEventListener("load", refresh);

  refresh();
}

/* ---------- Footer details ("Infos" tab of admin.html) ---------- */

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
// Same rules as the admin page: only Google Maps links, and phone numbers made of digits
const MAPS_LINK = /^https:\/\/((www\.)?google\.[a-z.]{2,8}\/maps|maps\.google\.[a-z.]{2,8}|maps\.app\.goo\.gl|goo\.gl\/maps)\//i;
const PHONE = /^\+?[0-9][0-9 .-]{5,18}$/;

let info = {}; // the café's details (Supabase table "settings"): key -> value

function hasInfo(key) {
  return typeof info[key] === "string";
}
function infoText(key, maxLength) {
  return hasInfo(key) ? info[key].trim().slice(0, maxLength) : "";
}

// "Lun-Dim, 07:00 - 23:00", or "Lun-Ven, 07:00 - 23:00 · Sam-Dim, 09:00 - 00:00"
function openingHours() {
  const span = (days) => {
    const open = infoText("hours_" + days + "_open", 5);
    const close = infoText("hours_" + days + "_close", 5);
    return TIME.test(open) && TIME.test(close) ? open + " - " + close : null;
  };
  const week = span("week");
  const weekend = span("weekend");
  if (week && week === weekend) return "Lun-Dim, " + week;
  return [week && "Lun-Ven, " + week, weekend && "Sam-Dim, " + weekend].filter(Boolean).join(" · ");
}

// Footer rows are "<i icon></i> text": keep the icon, replace the text
function setRowText(node, text) {
  node.replaceChildren(node.querySelector("i"), " " + text);
}

// A detail never saved on the admin page keeps the footer's own text; one saved empty
// (or not valid) hides its row
function renderInfo() {
  const hoursKeys = ["hours_week_open", "hours_week_close", "hours_weekend_open", "hours_weekend_close"];
  if (hoursKeys.some(hasInfo)) {
    const hours = openingHours();
    const row = document.getElementById("footerHours");
    row.closest("li").hidden = !hours;
    if (hours) setRowText(row, hours);
  }

  const mapsUrl = infoText("maps_url", 300);
  if (MAPS_LINK.test(mapsUrl)) {
    document.querySelectorAll("[data-maps]").forEach((link) => { link.href = mapsUrl; });
  }

  if (hasInfo("address")) {
    const address = infoText("address", 120);
    const row = document.getElementById("footerAddress");
    row.closest("li").hidden = !address;
    if (address) setRowText(row, address);
  }

  if (hasInfo("phone")) {
    const phone = infoText("phone", 20);
    const link = document.getElementById("footerPhone");
    link.closest("li").hidden = !PHONE.test(phone);
    if (PHONE.test(phone)) {
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

/* ---------- Start ---------- */

function init() {
  if (typeof MENU_DATA === "undefined") {
    console.error("menu-data.js did not load.");
    return;
  }
  setupMenuClicks();
  setupSearch();
  setupStickyHeader();
  loadMenu();
  loadInfo();
}

function applySearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;
  const query = input.value.trim().toLowerCase();

  if (!query) {
    document.querySelectorAll(".menu-category").forEach(el => el.style.display = "");
    document.querySelectorAll(".menu-item").forEach(el => el.style.display = "");
    const noResults = document.getElementById("noResults");
    if (noResults) noResults.style.display = "none";
    return;
  }

  let anyVisible = false;

  document.querySelectorAll(".menu-category").forEach((catEl) => {
    let catHasMatch = false;

    catEl.querySelectorAll(".menu-item").forEach((itemEl) => {
      const name = itemEl.querySelector("h4")?.textContent.toLowerCase() || "";
      const desc = itemEl.querySelector(".menu-item-desc")?.textContent.toLowerCase() || "";
      const matches = name.includes(query) || desc.includes(query);
      itemEl.style.display = matches ? "" : "none";
      if (matches) catHasMatch = true;
    });

    catEl.style.display = catHasMatch ? "" : "none";

    if (catHasMatch) {
      anyVisible = true;
      const itemsContainer = catEl.querySelector(".category-items");
      const arrow = catEl.querySelector(".toggle-arrow");
      if (itemsContainer) itemsContainer.classList.remove("collapsed");
      if (arrow) arrow.classList.add("open");
    }
  });

  let noResults = document.getElementById("noResults");
  if (!noResults) {
    noResults = document.createElement("p");
    noResults.id = "noResults";
    noResults.className = "no-results";
    noResults.textContent = "Aucun résultat trouvé.";
    document.getElementById("menuContainer").appendChild(noResults);
  }
  noResults.style.display = anyVisible ? "none" : "block";
}

function setupSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;
  // Also run after every redraw (applySearch in showMenu), so a fresh menu keeps the filter
  input.addEventListener("input", applySearch);
}
document.addEventListener("DOMContentLoaded", init);
