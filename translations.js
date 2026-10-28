/*
  Bolivar — interface text in French (fr) and English (en).

  In index.html:
  - data-i18n="key"                → the element's text becomes TEXT[lang][key]
  - data-i18n-attr="aria-label:key" → sets an attribute instead (several: "a:key1;b:key2")
  The French text written in index.html is what shows before JavaScript runs.
  {n}, {q}, {time} are placeholders filled in by script.js.
  Product and category names are not here: they come from the menu (menu-data.js / Supabase).
*/

const TEXT = {
  fr: {
    "meta.title": "Bolivar | Coffee & Lounge",
    "brand.home": "Bolivar, retour en haut de la page",
    "lang.group": "Langue",

    "side.open": "Ouvrir le menu",
    "side.title": "Menu",
    "side.close": "Fermer le menu",
    "hours.title": "Horaires",
    "hours.week": "Lundi – Vendredi",
    "hours.weekend": "Samedi – Dimanche",
    "hours.everyday": "Tous les jours",
    "hours.weekShort": "Lun-Ven",
    "hours.weekendShort": "Sam-Dim",
    "hours.everydayShort": "Lun-Dim",
    "wifi.title": "Wi-Fi",
    "wifi.network": "Réseau",
    "wifi.password": "Mot de passe",
    "wifi.copy": "Copier le mot de passe",
    "wifi.copied": "Mot de passe copié",
    "wifi.copyFailed": "Copie impossible : recopiez le mot de passe ci-dessus.",
    "find.title": "Nous trouver",
    "find.address": "Adresse",
    "find.phone": "Téléphone",

    "search.open": "Rechercher dans la carte",
    "search.title": "Rechercher dans la carte",
    "search.label": "Rechercher un produit",
    "search.placeholder": "Ex. capucin, nutella, mojito…",
    "search.close": "Fermer la recherche",
    "search.hint": "Tapez le nom d'un produit, d'un parfum ou d'une catégorie.",
    "search.one": "1 résultat",
    "search.count": "{n} résultats",
    "search.none": "Aucun produit trouvé pour «\u00a0{q}\u00a0».",

    "menu.categories": "Catégories de la carte",
    "menu.loading": "Chargement de la carte…",
    "menu.stale": "La carte n'a pas pu être mise à jour : certains prix ont peut-être changé.",
    "menu.unavailable": "Indisponible",

    "footer.desc": "Votre pause café, gourmandise et détente au cœur de Tunis.",
    "footer.nav": "Navigation",
    "footer.home": "Accueil",
    "footer.menu": "Menu",
    "footer.contact": "Contact",
    "footer.hours": "Lun-Dim, 07:00 - 23:00",
    "footer.review": "Laisser un avis",
    "footer.follow": "Suivez-nous",
    "footer.rights": "Tous droits réservés. Réalisé par Youssef Maazaoui",
    "footer.top": "Retour en haut"
  },

  en: {
    "meta.title": "Bolivar | Coffee & Lounge",
    "brand.home": "Bolivar, back to the top of the page",
    "lang.group": "Language",

    "side.open": "Open the menu",
    "side.title": "Menu",
    "side.close": "Close the menu",
    "hours.title": "Opening hours",
    "hours.week": "Monday – Friday",
    "hours.weekend": "Saturday – Sunday",
    "hours.everyday": "Every day",
    "hours.weekShort": "Mon-Fri",
    "hours.weekendShort": "Sat-Sun",
    "hours.everydayShort": "Mon-Sun",
    "wifi.title": "Wi-Fi",
    "wifi.network": "Network",
    "wifi.password": "Password",
    "wifi.copy": "Copy the password",
    "wifi.copied": "Password copied",
    "wifi.copyFailed": "Could not copy: please type the password above.",
    "find.title": "Find us",
    "find.address": "Address",
    "find.phone": "Phone",

    "search.open": "Search the menu",
    "search.title": "Search the menu",
    "search.label": "Search for an item",
    "search.placeholder": "e.g. cappuccino, nutella, mojito…",
    "search.close": "Close search",
    "search.hint": "Type the name of an item, a flavour or a category.",
    "search.one": "1 result",
    "search.count": "{n} results",
    "search.none": "No item found for “{q}”.",

    "menu.categories": "Menu categories",
    "menu.loading": "Loading the menu…",
    "menu.stale": "The menu could not be updated: some prices may have changed.",
    "menu.unavailable": "Unavailable",

    "footer.desc": "Your coffee, treat and relaxation break in the heart of Tunis.",
    "footer.nav": "Navigation",
    "footer.home": "Home",
    "footer.menu": "Menu",
    "footer.contact": "Contact",
    "footer.hours": "Mon-Sun, 07:00 - 23:00",
    "footer.review": "Leave a review",
    "footer.follow": "Follow us",
    "footer.rights": "All rights reserved. Made by Youssef Maazaoui",
    "footer.top": "Back to top"
  }
};
