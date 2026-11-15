export type MenuItem = {
  name: string;
  prices: [number, number, number];
};

export type MenuSection = {
  title: string;
  items: MenuItem[];
};

export const coffee: MenuSection = {
  title: "COFFEE",
  items: [
    { name: "Drip coffee", prices: [3, 4, 4.5] },
    { name: "French press", prices: [3.5, 4.5, 5.5] },
    { name: "Iced toddy", prices: [3, 4, 5] },
  ],
};

export const espresso: MenuSection = {
  title: "ESPRESSO",
  items: [
    { name: "Espresso hot", prices: [3, 3.5, 4] },
    { name: "Americano", prices: [3, 4, 5] },
    { name: "Latte", prices: [3.5, 4.5, 5.5] },
    { name: "Cappuccino", prices: [3.5, 4.5, 5.5] },
    { name: "Mocha", prices: [3.75, 4.45, 4.75] },
    { name: "White mocha", prices: [3.75, 4.45, 4.75] },
    { name: "Frappe", prices: [4, 5, 6] },
  ],
};

export const nonCoffee: MenuSection = {
  title: "NON - COFFEE",
  items: [
    { name: "Hot tea", prices: [2.65, 3.15, 3.65] },
    { name: "Iced tea", prices: [2.65, 3.15, 3.65] },
    { name: "Chai", prices: [4, 5, 6] },
    { name: "Hot chocolate", prices: [3, 4, 5.5] },
    { name: "Lemonade", prices: [2.65, 3.0, 3.15] },
    { name: "Smoothie", prices: [4, 5, 6] },
  ],
};

export const syrups = [
  "Vanilla",
  "Peach",
  "Lavender",
  "Toasted marshmallow",
  "Hazelnut",
  "Orange",
  "Blackberry",
  "Butter pecan",
  "Caramel",
  "Almond roca",
];

export const addOns = {
  price: 0.5,
  items: ["Extra shot", "Crack", "Whipped cream", "Extra syrup or sauce"],
};
