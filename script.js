const MENU_DATA = [
  { category: "Petit Déjeuner", image: "", items: [
    { name: "L'Express", price: 8, desc: "Café au choix, jus frais, eau 0.5L, viennoiserie (croissant/cake)" },
    { name: "Le Classique", price: 15, desc: "Café au choix, jus frais, eau 0.5L, viennoiserie, omelette, toasts (beurre, confiture, miel, chocolat)" },
    { name: "Healthy", price: 18, desc: "Café au choix, jus detox, eau 0.5L, toasts (fromage, charcuterie), omelette, bol flocon d'avoine et granola, salade de fruits" },
    { name: "Le Gourmand", price: 20, desc: "Café au choix, jus frais, eau 0.5L, viennoiserie, omelette, toasts, planche charcuterie fromage, mini pancakes, salade de fruits" },
    { name: "Le Tunisien", price: 25, desc: "Café au choix, jus frais, eau 0.5L, cake, sahfa dro3, oeuf dur, huile d'olive, harissa, olives, chamia, goutta, dattes, bsissa, ojja merguez, mlewi" },
    { name: "L'Impérial (2 personnes)", price: 37, desc: "2 cafés, 2 jus frais, eau 1L, 2 viennoiseries, toasts, omelette, planche charcuterie fromage, mini sandwich, mini pancakes, yaourt" },
    { name: "Bolivar (2 personnes)", price: 45, desc: "2 cafés, 2 jus frais, eau 1L, 2 viennoiseries, toasts, omelette, planche charcuterie fromage, boulettes de fromage, mini pancakes, mini gaufres, mousse au chocolat, salade de fruits, yaourt" }
  ]},
  { category: "Nos Cafés", image: "", items: [
    { name: "Espresso", price: 4, desc: "" },
    { name: "Americano", price: 4, desc: "" },
    { name: "Capucin", price: 4.5, desc: "" },
    { name: "Chocolat au Lait", price: 4.5, desc: "" },
    { name: "Nescafé", price: 4.5, desc: "" },
    { name: "Café Crème", price: 5, desc: "" },
    { name: "Cappucino", price: 6, desc: "" },
    { name: "Le Turc", price: 7, desc: "Avec pâtisseries tunisiennes" },
    { name: "Macchiato Noisette", price: 7, desc: "" },
    { name: "Macchiato Caramel", price: 7, desc: "" },
    { name: "Macchiato Nutella", price: 8.5, desc: "" },
    { name: "Macchiato Spéculoos", price: 8.5, desc: "" },
    { name: "Café Italien (capsule)", price: 7, desc: "" },
    { name: "Croissant / Cake", price: 2.5, desc: "" },
    { name: "Supplément Nestlé / Arôme", price: 2, desc: "" }
  ]},
  { category: "Les Thés", image: "", items: [
    { name: "Thé à la menthe", price: 4, desc: "" },
    { name: "Thé infusion", price: 5, desc: "" },
    { name: "Thé aux amandes", price: 7, desc: "" },
    { name: "Thé aux pignons", price: 9, desc: "" },
    { name: "Thé baklawa", price: 10, desc: "Fruits secs" }
  ]},
  { category: "Chocolat Chaud / Glacé", image: "", items: [
    { name: "Chocolat Chaud / Glacé", price: 8, desc: "" },
    { name: "Chocolat Chaud / Glacé Chantilly", price: 10, desc: "" },
    { name: "Chocolat Chaud / Glacé Aromatisé", price: 10, desc: "" },
    { name: "Chocolat Chaud / Glacé Nutella ou Spéculoos", price: 12, desc: "" }
  ]},
  { category: "Boissons Fraiches", image: "", items: [
    { name: "Eau 0.5L", price: 2, desc: "" },
    { name: "Eau 1L", price: 3.5, desc: "" },
    { name: "Eau gazéifiée", price: 4, desc: "" },
    { name: "Soda", price: 4, desc: "" },
    { name: "Boisson énergétique", price: 10, desc: "" }
  ]},
  { category: "Ice Coffees", image: "", items: [
    { name: "Freddo Espresso", price: 6, desc: "" },
    { name: "Ice Latte", price: 6, desc: "" },
    { name: "American Ice", price: 6, desc: "" },
    { name: "Caramel Macchiato", price: 8, desc: "" },
    { name: "Caramel Salé", price: 8, desc: "" }
  ]},
  { category: "Jus et Cocktails", image: "", items: [
    { name: "Orange", price: 7, desc: "" },
    { name: "Citronnade", price: 7, desc: "" },
    { name: "Fraise", price: 8, desc: "" },
    { name: "Citronnade aux amandes", price: 9, desc: "" },
    { name: "Lait de poule", price: 9, desc: "" },
    { name: "Banane - Dattes", price: 10, desc: "" },
    { name: "Banana Blue", price: 10, desc: "" },
    { name: "Baratte de fruits secs", price: 12, desc: "" },
    { name: "Jus de fruits", price: 12, desc: "" },
    { name: "Modelo Sunrise", price: 12, desc: "Ananas, menthe, citron" },
    { name: "The Green", price: 12, desc: "Pomme, citron, kiwi" },
    { name: "Forest Detox", price: 15, desc: "Concombre, pomme, citron, menthe" },
    { name: "Sunrise Détox", price: 15, desc: "Pomme, kiwi, basilic" },
    { name: "Cocktail Bolivar", price: 17, desc: "" }
  ]},
  { category: "Smoothies", image: "", items: [
    { name: "Coconut", price: 13, desc: "Base smoothie, fraise, noix de coco" },
    { name: "Orange Tropical", price: 13, desc: "Base smoothie, orange, ananas, mangue, banane" },
    { name: "Red Strawberry", price: 13, desc: "Base smoothie, fraise, framboise, miel" },
    { name: "Midnight Summer", price: 13, desc: "Base smoothie, ananas, melon, blue curaçao" },
    { name: "Power Rangers", price: 13, desc: "Base smoothie, ananas, melon, fruit de la passion" },
    { name: "Green Healthy", price: 15, desc: "Base smoothie, concombre, pomme, kiwi, citron, menthe" }
  ]},
  { category: "Mojitos", image: "", items: [
    { name: "Virgin", price: 8, desc: "" },
    { name: "Midnight Blue", price: 10, desc: "" },
    { name: "Red Fruit", price: 10, desc: "" },
    { name: "Asian Fruit", price: 10, desc: "" },
    { name: "Night Black", price: 10, desc: "" },
    { name: "Energetic Mojito", price: 13, desc: "" },
    { name: "Mojito Bolivar", price: 15, desc: "" }
  ]},
  { category: "Milkshakes", image: "", items: [
    { name: "Milkshake Classique", price: 10, desc: "Chocolat / fraise / vanille" },
    { name: "Milkshake Nutella", price: 12, desc: "" },
    { name: "Milkshake Spéculoos", price: 12, desc: "" },
    { name: "Milkshake Oréo", price: 12, desc: "" },
    { name: "Milkshake Bueno", price: 12, desc: "" }
  ]},
  { category: "Frappuccinos", image: "", items: [
    { name: "Caramel", price: 10, desc: "" },
    { name: "Vanille", price: 10, desc: "" },
    { name: "Noisette", price: 10, desc: "" },
    { name: "Nutella", price: 11, desc: "" },
    { name: "Spéculoos", price: 11, desc: "" }
  ]},
  { category: "Crêpes & Gaufres Sucrées", image: "", items: [
    { name: "Gaufre / Crêpe Sucre", price: 6, desc: "" },
    { name: "Gaufre / Crêpe Miel", price: 8, desc: "" },
    { name: "Gaufre / Crêpe Chocolat", price: 8, desc: "" },
    { name: "Gaufre / Crêpe Nutella", price: 12, desc: "" },
    { name: "Gaufre / Crêpe El Mordjene", price: 12, desc: "" },
    { name: "Crêpe Spéculoos", price: 12, desc: "" },
    { name: "Crêpe Nutella - Banane", price: 14, desc: "" },
    { name: "Crêpe Ferrero Rocher", price: 14, desc: "" },
    { name: "Gaufre / Crêpe Oreo", price: 14, desc: "" },
    { name: "Gaufre / Crêpe Bueno Bliss", price: 14, desc: "" },
    { name: "Gaufre / Crêpe Blanche Désir", price: 14, desc: "" },
    { name: "Gaufre / Crêpe Crème Pistache", price: 15, desc: "" },
    { name: "Gaufre / Crêpe Bolivar", price: 16, desc: "" },
    { name: "Supplément Fruits de saison", price: 2, desc: "" },
    { name: "Supplément Fruits secs", price: 3, desc: "" }
  ]},
  { category: "Mini Pancakes", image: "", items: [
    { name: "Miel", price: 10, desc: "" },
    { name: "Chocolat", price: 10, desc: "" },
    { name: "Nutella", price: 12, desc: "" },
    { name: "Spéculoos", price: 12, desc: "" },
    { name: "El Mordjene", price: 12, desc: "" }
  ]},
  { category: "Crêpes & Gaufres Salées", image: "", items: [
    { name: "Gaufre / Crêpe Fromagère", price: 10, desc: "" },
    { name: "Gaufre / Crêpe Jambon - Fromage", price: 11, desc: "" },
    { name: "Gaufre / Crêpe Thon - Fromage", price: 12, desc: "" },
    { name: "Gaufre / Crêpe Tunisienne", price: 13, desc: "Thon, mozzarella, harissa, oeuf" },
    { name: "Gaufre / Crêpe Mixte", price: 14, desc: "Jambon, mozzarella" }
  ]},
  { category: "Omelettes", image: "", items: [
    { name: "Omelette Fromagère", price: 9, desc: "" },
    { name: "Omelette Jambon - Fromage", price: 10, desc: "" },
    { name: "Omelette Champignon - Fromage", price: 10, desc: "" },
    { name: "Omelette Thon - Fromage", price: 12, desc: "" },
    { name: "Omelette Bolivar", price: 14, desc: "Thon, jambon, champignon, fromage" }
  ]},
  { category: "Libanais", image: "", items: [
    { name: "Libanais Jambon - Fromage - Frites", price: 10, desc: "" },
    { name: "Libanais Thon - Fromage - Frites", price: 11, desc: "" },
    { name: "Libanais Escalope - Fromage - Frites", price: 12, desc: "" }
  ]},
  { category: "Paninis", image: "", items: [
    { name: "Panini Jambon - Fromage - Frites", price: 9, desc: "" },
    { name: "Panini Thon - Fromage - Frites", price: 10, desc: "" },
    { name: "Panini Escalope - Fromage - Frites", price: 11, desc: "" }
  ]},
  { category: "Burgers", image: "", items: [
    { name: "Crispy Chicken Burger", price: 12, desc: "Poulet crispy, fromage cheddar, oignon caramélisé, laitue, tomate, sauce burger, cornichons" },
    { name: "Cheese Burger", price: 14, desc: "Steak haché, fromage cheddar, oignon caramélisé, laitue, tomate, sauce burger, cornichons" }
  ]},
  { category: "Club Sandwich", image: "", items: [
    { name: "Club Jambon", price: 8, desc: "Jambon fumé, fromage, laitue, tomate" },
    { name: "Club Thon", price: 8, desc: "Thon, fromage, laitue, tomate" }
  ]},
  { category: "Salades", image: "", items: [
    { name: "Salade Niçoise", price: 10, desc: "Thon, oeuf, olives, laitue, tomate, oignon" },
    { name: "Salade César", price: 12, desc: "Poulet, fromage, laitue, tomate cerise, croûtons" }
  ]},
  { category: "Nos Plats", image: "", items: [
    { name: "Escalope Grillée", price: 16, desc: "" },
    { name: "Escalope Panée", price: 17, desc: "" },
    { name: "Escalope Cordon Bleu", price: 18, desc: "" },
    { name: "Escalope Sauce Champignon", price: 19, desc: "" },
    { name: "Menu Enfant", price: 11, desc: "Nuggets, frites, soda" }
  ]},
  { category: "Nos Pâtes", image: "", items: [
    { name: "Penne Carbonara", price: 14, desc: "" },
    { name: "Penne Puttanesca", price: 15, desc: "" },
    { name: "Penne Escalope Champignon", price: 17, desc: "" },
    { name: "Penne 4 Fromages", price: 18, desc: "" }
  ]},
  { category: "Nos Desserts", image: "", items: [
    { name: "Brownies au Chocolat", price: 6, desc: "" },
    { name: "Salade de Fruits", price: 8, desc: "" },
    { name: "Fondant", price: 10, desc: "" },
    { name: "Cheesecake", price: 12, desc: "Nutella, Spéculoos, Oreo, Caramel" },
    { name: "Jwjem", price: 12, desc: "" }
  ]},
  { category: "Chichas", image: "", items: [
    { name: "Chicha Fakher", price: 10, desc: "Pomme, menthe, raisin, chewing-gum" },
    { name: "Chicha Adalya", price: 12, desc: "Love, MI Amor, Sheikh Money" },
    { name: "Supplément Glaçons", price: 3, desc: "" }
  ]},
  { category: "Jeux", image: "", items: [
    { name: "Jeux de cartes", price: 5, desc: "" }
  ]}
];

const CATEGORY_PLACEHOLDERS = {
  "Petit Déjeuner": "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&q=80",
  "Nos Cafés": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80",
  "Les Thés": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&q=80",
  "Chocolat Chaud / Glacé": "https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=800&q=80",
  "Boissons Fraiches": "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&q=80",
  "Ice Coffees": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80",
  "Jus et Cocktails": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800&q=80",
  "Smoothies": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=800&q=80",
  "Mojitos": "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=800&q=80",
  "Milkshakes": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&q=80",
  "Frappuccinos": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&q=80",
  "Crêpes & Gaufres Sucrées": "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=800&q=80",
  "Mini Pancakes": "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=800&q=80",
  "Crêpes & Gaufres Salées": "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=800&q=80",
  "Omelettes": "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=800&q=80",
  "Libanais": "https://images.unsplash.com/photo-1561651188-d207bbec4ec3?w=800&q=80",
  "Paninis": "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=800&q=80",
  "Burgers": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
  "Club Sandwich": "https://images.unsplash.com/photo-1559054663-e8d23213f55c?w=800&q=80",
  "Salades": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
  "Nos Plats": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
  "Nos Pâtes": "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80",
  "Nos Desserts": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80",
  "Chichas": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
  "Jeux": "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=800&q=80"
};

function slugify(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
}

function formatPrice(price) {
  return `${Number(price).toFixed(2)} DT`;
}

function getCategoryImage(block) {
  if (block.image && block.image.trim() !== "") return block.image;
  return CATEGORY_PLACEHOLDERS[block.category] ||
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80";
}

function renderNavbar() {
  const nav = document.getElementById("categoryNav");
  if (!nav) return;
  nav.innerHTML = MENU_DATA.map((block) => {
    const id = slugify(block.category);
    return `<a class="nav-pill" href="#${id}">${block.category}</a>`;
  }).join("");
}

function renderMenu() {
  const menuContainer = document.getElementById("menuContainer");
  if (!menuContainer) return;

  menuContainer.innerHTML = MENU_DATA.map((block) => {
    const id = slugify(block.category);
    const imgSrc = getCategoryImage(block);

    return `
      <article class="menu-category" id="${id}">
        <button class="category-toggle" data-target="${id}-items" aria-expanded="true">
          <img class="category-bg" src="${imgSrc}" alt="${block.category}" loading="lazy" />
          <div class="category-overlay"></div>
          <div class="category-toggle-inner">
            <h3>${block.category}</h3>
            <span class="toggle-arrow open">▼</span>
          </div>
        </button>
        <div class="category-items" id="${id}-items">
          <div class="menu-list">
            ${block.items.map((item) => `
              <div class="menu-item">
                <div class="menu-item-left">
                  <h4>${item.name}</h4>
                  ${item.desc ? `<div class="menu-item-desc">${item.desc}</div>` : ""}
                </div>
                <span class="item-price">${formatPrice(item.price)}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </article>
    `;
  }).join("");

  menuContainer.querySelectorAll(".category-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const items = document.getElementById(targetId);
      const arrow = btn.querySelector(".toggle-arrow");
      const isOpen = !items.classList.contains("collapsed");
      items.classList.toggle("collapsed", isOpen);
      arrow.classList.toggle("open", !isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  menuContainer.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", () => {
      const isExpanded = item.classList.contains("expanded");
      const siblings = item.closest(".menu-list").querySelectorAll(".menu-item");
      siblings.forEach((s) => s.classList.remove("expanded"));
      if (!isExpanded) item.classList.add("expanded");
    });
  });
}

function setupScrollSpy() {
  const pills = document.querySelectorAll(".nav-pill");
  const categories = document.querySelectorAll(".menu-category");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        pills.forEach((pill) => {
          pill.classList.toggle("active", pill.getAttribute("href") === `#${id}`);
        });
      }
    });
  }, { rootMargin: "-40% 0px -55% 0px" });

  categories.forEach((cat) => observer.observe(cat));
}

function init() {
  renderNavbar();
  renderMenu();
  setupScrollSpy();
  setupSearch();
}
function setupSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  input.addEventListener("input", () => {
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
  });
}
document.addEventListener("DOMContentLoaded", init);