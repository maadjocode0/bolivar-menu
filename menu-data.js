/*
  Bolivar — built-in copy of the menu.

  - Used to fill the Supabase database once (supabase/seed.sql was generated from this file).
  - Shown when supabase-config.js is empty, or when Supabase has never been reached on this
    phone. Once the database is set up, prices and products are changed on admin.html,
    not here.
*/
const MENU_DATA = [
  { category: "Petit Déjeuner", en: "Breakfast", image: "", items: [
    { name: "L'Express", price: 8, desc: "Café au choix, jus frais, eau 0.5L, viennoiserie (croissant/cake)", descEn: "Coffee of your choice, fresh juice, 0.5L water, pastry (croissant/cake)" },
    { name: "Le Classique", price: 15, desc: "Café au choix, jus frais, eau 0.5L, viennoiserie, omelette, toasts (beurre, confiture, miel, chocolat)", descEn: "Coffee of your choice, fresh juice, 0.5L water, pastry, omelette, toast (butter, jam, honey, chocolate)" },
    { name: "Healthy", price: 18, desc: "Café au choix, jus detox, eau 0.5L, toasts (fromage, charcuterie), omelette, bol flocon d'avoine et granola, salade de fruits", descEn: "Coffee of your choice, detox juice, 0.5L water, toast (cheese, cold cuts), omelette, oat and granola bowl, fruit salad" },
    { name: "Le Gourmand", price: 20, desc: "Café au choix, jus frais, eau 0.5L, viennoiserie, omelette, toasts, planche charcuterie fromage, mini pancakes, salade de fruits", descEn: "Coffee of your choice, fresh juice, 0.5L water, pastry, omelette, toast, cold cuts and cheese board, mini pancakes, fruit salad" },
    { name: "Le Tunisien", price: 25, desc: "Café au choix, jus frais, eau 0.5L, cake, sahfa dro3, oeuf dur, huile d'olive, harissa, olives, chamia, goutta, dattes, bsissa, ojja merguez, mlewi", descEn: "Coffee of your choice, fresh juice, 0.5L water, cake, sahfa dro3, boiled egg, olive oil, harissa, olives, chamia, goutta, dates, bsissa, ojja merguez, mlewi" },
    { name: "L'Impérial (2 personnes)", en: "L'Impérial (for 2)", price: 37, desc: "2 cafés, 2 jus frais, eau 1L, 2 viennoiseries, toasts, omelette, planche charcuterie fromage, mini sandwich, mini pancakes, yaourt", descEn: "2 coffees, 2 fresh juices, 1L water, 2 pastries, toast, omelette, cold cuts and cheese board, mini sandwich, mini pancakes, yoghurt" },
    { name: "Bolivar (2 personnes)", en: "Bolivar (for 2)", price: 45, desc: "2 cafés, 2 jus frais, eau 1L, 2 viennoiseries, toasts, omelette, planche charcuterie fromage, boulettes de fromage, mini pancakes, mini gaufres, mousse au chocolat, salade de fruits, yaourt", descEn: "2 coffees, 2 fresh juices, 1L water, 2 pastries, toast, omelette, cold cuts and cheese board, cheese balls, mini pancakes, mini waffles, chocolate mousse, fruit salad, yoghurt" }
  ]},
  { category: "Nos Cafés", en: "Our Coffees", image: "", items: [
    { name: "Espresso", price: 4, desc: "" },
    { name: "Americano", price: 4, desc: "" },
    { name: "Capucin", price: 4.5, desc: "" },
    { name: "Chocolat au Lait", en: "Chocolate Milk", price: 4.5, desc: "" },
    { name: "Nescafé", price: 4.5, desc: "" },
    { name: "Café Crème", en: "Coffee with Cream", price: 5, desc: "" },
    { name: "Cappucino", en: "Cappuccino", price: 6, desc: "" },
    { name: "Le Turc", en: "Turkish Coffee", price: 7, desc: "Avec pâtisseries tunisiennes", descEn: "With Tunisian pastries" },
    { name: "Macchiato Noisette", en: "Hazelnut Macchiato", price: 7, desc: "" },
    { name: "Macchiato Caramel", en: "Caramel Macchiato", price: 7, desc: "" },
    { name: "Macchiato Nutella", en: "Nutella Macchiato", price: 8.5, desc: "" },
    { name: "Macchiato Spéculoos", en: "Speculoos Macchiato", price: 8.5, desc: "" },
    { name: "Café Italien (capsule)", en: "Italian Coffee (capsule)", price: 7, desc: "" },
    { name: "Croissant / Cake", price: 2.5, desc: "" },
    { name: "Supplément Nestlé / Arôme", en: "Extra Nestlé / Flavour", price: 2, desc: "" }
  ]},
  { category: "Les Thés", en: "Teas", image: "", items: [
    { name: "Thé à la menthe", en: "Mint Tea", price: 4, desc: "" },
    { name: "Thé infusion", en: "Herbal Tea", price: 5, desc: "" },
    { name: "Thé aux amandes", en: "Almond Tea", price: 7, desc: "" },
    { name: "Thé aux pignons", en: "Pine Nut Tea", price: 9, desc: "" },
    { name: "Thé baklawa", en: "Baklawa Tea", price: 10, desc: "Fruits secs", descEn: "Nuts" }
  ]},
  { category: "Chocolat Chaud / Glacé", en: "Hot / Iced Chocolate", image: "", items: [
    { name: "Chocolat Chaud / Glacé", en: "Hot / Iced Chocolate", price: 8, desc: "" },
    { name: "Chocolat Chaud / Glacé Chantilly", en: "Hot / Iced Chocolate with Whipped Cream", price: 10, desc: "" },
    { name: "Chocolat Chaud / Glacé Aromatisé", en: "Flavoured Hot / Iced Chocolate", price: 10, desc: "" },
    { name: "Chocolat Chaud / Glacé Nutella ou Spéculoos", en: "Hot / Iced Chocolate Nutella or Speculoos", price: 12, desc: "" }
  ]},
  { category: "Boissons Fraiches", en: "Cold Drinks", image: "", items: [
    { name: "Eau 0.5L", en: "Water 0.5L", price: 2, desc: "" },
    { name: "Eau 1L", en: "Water 1L", price: 3.5, desc: "" },
    { name: "Eau gazéifiée", en: "Sparkling Water", price: 4, desc: "" },
    { name: "Soda", price: 4, desc: "" },
    { name: "Boisson énergétique", en: "Energy Drink", price: 10, desc: "" }
  ]},
  { category: "Ice Coffees", en: "Iced Coffees", image: "", items: [
    { name: "Freddo Espresso", price: 6, desc: "" },
    { name: "Ice Latte", price: 6, desc: "" },
    { name: "American Ice", price: 6, desc: "" },
    { name: "Caramel Macchiato", price: 8, desc: "" },
    { name: "Caramel Salé", en: "Salted Caramel", price: 8, desc: "" }
  ]},
  { category: "Jus et Cocktails", en: "Juices & Cocktails", image: "", items: [
    { name: "Orange", price: 7, desc: "" },
    { name: "Citronnade", en: "Lemonade", price: 7, desc: "" },
    { name: "Fraise", en: "Strawberry", price: 8, desc: "" },
    { name: "Citronnade aux amandes", en: "Almond Lemonade", price: 9, desc: "" },
    { name: "Lait de poule", en: "Eggnog", price: 9, desc: "" },
    { name: "Banane - Dattes", en: "Banana - Dates", price: 10, desc: "" },
    { name: "Banana Blue", price: 10, desc: "" },
    { name: "Baratte de fruits secs", en: "Nut Baratte", price: 12, desc: "" },
    { name: "Jus de fruits", en: "Fruit Juice", price: 12, desc: "" },
    { name: "Modelo Sunrise", price: 12, desc: "Ananas, menthe, citron", descEn: "Pineapple, mint, lemon" },
    { name: "The Green", price: 12, desc: "Pomme, citron, kiwi", descEn: "Apple, lemon, kiwi" },
    { name: "Forest Detox", price: 15, desc: "Concombre, pomme, citron, menthe", descEn: "Cucumber, apple, lemon, mint" },
    { name: "Sunrise Détox", en: "Sunrise Detox", price: 15, desc: "Pomme, kiwi, basilic", descEn: "Apple, kiwi, basil" },
    { name: "Cocktail Bolivar", en: "Bolivar Cocktail", price: 17, desc: "" }
  ]},
  { category: "Smoothies", image: "", items: [
    { name: "Coconut", price: 13, desc: "Base smoothie, fraise, noix de coco", descEn: "Smoothie base, strawberry, coconut" },
    { name: "Orange Tropical", price: 13, desc: "Base smoothie, orange, ananas, mangue, banane", descEn: "Smoothie base, orange, pineapple, mango, banana" },
    { name: "Red Strawberry", price: 13, desc: "Base smoothie, fraise, framboise, miel", descEn: "Smoothie base, strawberry, raspberry, honey" },
    { name: "Midnight Summer", price: 13, desc: "Base smoothie, ananas, melon, blue curaçao", descEn: "Smoothie base, pineapple, melon, blue curaçao" },
    { name: "Power Rangers", price: 13, desc: "Base smoothie, ananas, melon, fruit de la passion", descEn: "Smoothie base, pineapple, melon, passion fruit" },
    { name: "Green Healthy", price: 15, desc: "Base smoothie, concombre, pomme, kiwi, citron, menthe", descEn: "Smoothie base, cucumber, apple, kiwi, lemon, mint" }
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
    { name: "Milkshake Classique", en: "Classic Milkshake", price: 10, desc: "Chocolat / fraise / vanille", descEn: "Chocolate / strawberry / vanilla" },
    { name: "Milkshake Nutella", en: "Nutella Milkshake", price: 12, desc: "" },
    { name: "Milkshake Spéculoos", en: "Speculoos Milkshake", price: 12, desc: "" },
    { name: "Milkshake Oréo", en: "Oreo Milkshake", price: 12, desc: "" },
    { name: "Milkshake Bueno", en: "Bueno Milkshake", price: 12, desc: "" }
  ]},
  { category: "Frappuccinos", image: "", items: [
    { name: "Caramel", price: 10, desc: "" },
    { name: "Vanille", en: "Vanilla", price: 10, desc: "" },
    { name: "Noisette", en: "Hazelnut", price: 10, desc: "" },
    { name: "Nutella", price: 11, desc: "" },
    { name: "Spéculoos", en: "Speculoos", price: 11, desc: "" }
  ]},
  { category: "Crêpes & Gaufres Sucrées", en: "Sweet Crêpes & Waffles", image: "", items: [
    { name: "Gaufre / Crêpe Sucre", en: "Sugar Waffle / Crêpe", price: 6, desc: "" },
    { name: "Gaufre / Crêpe Miel", en: "Honey Waffle / Crêpe", price: 8, desc: "" },
    { name: "Gaufre / Crêpe Chocolat", en: "Chocolate Waffle / Crêpe", price: 8, desc: "" },
    { name: "Gaufre / Crêpe Nutella", en: "Nutella Waffle / Crêpe", price: 12, desc: "" },
    { name: "Gaufre / Crêpe El Mordjene", en: "El Mordjene Waffle / Crêpe", price: 12, desc: "" },
    { name: "Crêpe Spéculoos", en: "Speculoos Crêpe", price: 12, desc: "" },
    { name: "Crêpe Nutella - Banane", en: "Nutella - Banana Crêpe", price: 14, desc: "" },
    { name: "Crêpe Ferrero Rocher", en: "Ferrero Rocher Crêpe", price: 14, desc: "" },
    { name: "Gaufre / Crêpe Oreo", en: "Oreo Waffle / Crêpe", price: 14, desc: "" },
    { name: "Gaufre / Crêpe Bueno Bliss", en: "Bueno Bliss Waffle / Crêpe", price: 14, desc: "" },
    { name: "Gaufre / Crêpe Blanche Désir", en: "Blanche Désir Waffle / Crêpe", price: 14, desc: "" },
    { name: "Gaufre / Crêpe Crème Pistache", en: "Pistachio Cream Waffle / Crêpe", price: 15, desc: "" },
    { name: "Gaufre / Crêpe Bolivar", en: "Bolivar Waffle / Crêpe", price: 16, desc: "" },
    { name: "Supplément Fruits de saison", en: "Extra Seasonal Fruit", price: 2, desc: "" },
    { name: "Supplément Fruits secs", en: "Extra Nuts", price: 3, desc: "" }
  ]},
  { category: "Mini Pancakes", image: "", items: [
    { name: "Miel", en: "Honey", price: 10, desc: "" },
    { name: "Chocolat", en: "Chocolate", price: 10, desc: "" },
    { name: "Nutella", price: 12, desc: "" },
    { name: "Spéculoos", en: "Speculoos", price: 12, desc: "" },
    { name: "El Mordjene", price: 12, desc: "" }
  ]},
  { category: "Crêpes & Gaufres Salées", en: "Savoury Crêpes & Waffles", image: "", items: [
    { name: "Gaufre / Crêpe Fromagère", en: "Cheese Waffle / Crêpe", price: 10, desc: "" },
    { name: "Gaufre / Crêpe Jambon - Fromage", en: "Ham - Cheese Waffle / Crêpe", price: 11, desc: "" },
    { name: "Gaufre / Crêpe Thon - Fromage", en: "Tuna - Cheese Waffle / Crêpe", price: 12, desc: "" },
    { name: "Gaufre / Crêpe Tunisienne", en: "Tunisian Waffle / Crêpe", price: 13, desc: "Thon, mozzarella, harissa, oeuf", descEn: "Tuna, mozzarella, harissa, egg" },
    { name: "Gaufre / Crêpe Mixte", en: "Mixed Waffle / Crêpe", price: 14, desc: "Jambon, mozzarella", descEn: "Ham, mozzarella" }
  ]},
  { category: "Omelettes", image: "", items: [
    { name: "Omelette Fromagère", en: "Cheese Omelette", price: 9, desc: "" },
    { name: "Omelette Jambon - Fromage", en: "Ham - Cheese Omelette", price: 10, desc: "" },
    { name: "Omelette Champignon - Fromage", en: "Mushroom - Cheese Omelette", price: 10, desc: "" },
    { name: "Omelette Thon - Fromage", en: "Tuna - Cheese Omelette", price: 12, desc: "" },
    { name: "Omelette Bolivar", en: "Bolivar Omelette", price: 14, desc: "Thon, jambon, champignon, fromage", descEn: "Tuna, ham, mushroom, cheese" }
  ]},
  { category: "Libanais", en: "Lebanese Wraps", image: "", items: [
    { name: "Libanais Jambon - Fromage - Frites", en: "Lebanese Wrap Ham - Cheese - Fries", price: 10, desc: "" },
    { name: "Libanais Thon - Fromage - Frites", en: "Lebanese Wrap Tuna - Cheese - Fries", price: 11, desc: "" },
    { name: "Libanais Escalope - Fromage - Frites", en: "Lebanese Wrap Escalope - Cheese - Fries", price: 12, desc: "" }
  ]},
  { category: "Paninis", image: "", items: [
    { name: "Panini Jambon - Fromage - Frites", en: "Panini Ham - Cheese - Fries", price: 9, desc: "" },
    { name: "Panini Thon - Fromage - Frites", en: "Panini Tuna - Cheese - Fries", price: 10, desc: "" },
    { name: "Panini Escalope - Fromage - Frites", en: "Panini Escalope - Cheese - Fries", price: 11, desc: "" }
  ]},
  { category: "Burgers", image: "", items: [
    { name: "Crispy Chicken Burger", price: 12, desc: "Poulet crispy, fromage cheddar, oignon caramélisé, laitue, tomate, sauce burger, cornichons", descEn: "Crispy chicken, cheddar cheese, caramelised onion, lettuce, tomato, burger sauce, pickles" },
    { name: "Cheese Burger", price: 14, desc: "Steak haché, fromage cheddar, oignon caramélisé, laitue, tomate, sauce burger, cornichons", descEn: "Beef patty, cheddar cheese, caramelised onion, lettuce, tomato, burger sauce, pickles" }
  ]},
  { category: "Club Sandwich", image: "", items: [
    { name: "Club Jambon", en: "Ham Club", price: 8, desc: "Jambon fumé, fromage, laitue, tomate", descEn: "Smoked ham, cheese, lettuce, tomato" },
    { name: "Club Thon", en: "Tuna Club", price: 8, desc: "Thon, fromage, laitue, tomate", descEn: "Tuna, cheese, lettuce, tomato" }
  ]},
  { category: "Salades", en: "Salads", image: "", items: [
    { name: "Salade Niçoise", en: "Niçoise Salad", price: 10, desc: "Thon, oeuf, olives, laitue, tomate, oignon", descEn: "Tuna, egg, olives, lettuce, tomato, onion" },
    { name: "Salade César", en: "Caesar Salad", price: 12, desc: "Poulet, fromage, laitue, tomate cerise, croûtons", descEn: "Chicken, cheese, lettuce, cherry tomatoes, croutons" }
  ]},
  { category: "Nos Plats", en: "Main Dishes", image: "", items: [
    { name: "Escalope Grillée", en: "Grilled Escalope", price: 16, desc: "" },
    { name: "Escalope Panée", en: "Breaded Escalope", price: 17, desc: "" },
    { name: "Escalope Cordon Bleu", price: 18, desc: "" },
    { name: "Escalope Sauce Champignon", en: "Escalope with Mushroom Sauce", price: 19, desc: "" },
    { name: "Menu Enfant", en: "Kids' Menu", price: 11, desc: "Nuggets, frites, soda", descEn: "Nuggets, fries, soda" }
  ]},
  { category: "Nos Pâtes", en: "Pasta", image: "", items: [
    { name: "Penne Carbonara", price: 14, desc: "" },
    { name: "Penne Puttanesca", price: 15, desc: "" },
    { name: "Penne Escalope Champignon", en: "Penne Escalope Mushroom", price: 17, desc: "" },
    { name: "Penne 4 Fromages", en: "Penne 4 Cheeses", price: 18, desc: "" }
  ]},
  { category: "Nos Desserts", en: "Desserts", image: "", items: [
    { name: "Brownies au Chocolat", en: "Chocolate Brownies", price: 6, desc: "" },
    { name: "Salade de Fruits", en: "Fruit Salad", price: 8, desc: "" },
    { name: "Fondant", price: 10, desc: "" },
    { name: "Cheesecake", price: 12, desc: "Nutella, Spéculoos, Oreo, Caramel", descEn: "Nutella, Speculoos, Oreo, Caramel" },
    { name: "Jwjem", price: 12, desc: "" }
  ]},
  { category: "Chichas", en: "Shisha", image: "", items: [
    { name: "Chicha Fakher", en: "Fakher Shisha", price: 10, desc: "Pomme, menthe, raisin, chewing-gum", descEn: "Apple, mint, grape, chewing gum" },
    { name: "Chicha Adalya", en: "Adalya Shisha", price: 12, desc: "Love, MI Amor, Sheikh Money" },
    { name: "Supplément Glaçons", en: "Extra Ice", price: 3, desc: "" }
  ]},
  { category: "Jeux", en: "Games", image: "", items: [
    { name: "Jeux de cartes", en: "Card Games", price: 5, desc: "" }
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
  "Frappuccinos": "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&q=80",
  "Crêpes & Gaufres Sucrées": "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=800&q=80",
  "Mini Pancakes": "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=800&q=80",
  "Crêpes & Gaufres Salées": "https://images.unsplash.com/photo-1577953589629-446f28f0d8c1?w=800&q=80",
  "Omelettes": "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=800&q=80",
  "Libanais": "https://images.unsplash.com/photo-1743674453093-592bed88018e?w=800&q=80",
  "Paninis": "https://images.unsplash.com/photo-1655279562015-047c3da9a271?w=800&q=80",
  "Burgers": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
  "Club Sandwich": "https://images.unsplash.com/photo-1559054663-e8d23213f55c?w=800&q=80",
  "Salades": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
  "Nos Plats": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
  "Nos Pâtes": "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80",
  "Nos Desserts": "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80",
  "Chichas": "https://images.unsplash.com/photo-1635547821500-77542481940c?w=800&q=80",
  "Jeux": "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=800&q=80"
};
