"use strict";

const MENU_URL = "./menu.json";

function formatPrice(amount) {
  const [dollars, cents] = Number(amount).toFixed(2).split(".");

  const price = document.createElement("span");
  price.className = "menu-price";

  const dollarsElement = document.createElement("span");
  dollarsElement.className = "menu-price-dollars";
  dollarsElement.textContent = dollars;

  const centsElement = document.createElement("span");
  centsElement.className = "menu-price-cents";
  centsElement.textContent = cents;

  price.append(dollarsElement, centsElement);

  return price;
}

function renderSection(elementId, section) {
  const container = document.getElementById(elementId);

  if (!container || !section || !Array.isArray(section.items)) {
    throw new Error(`Invalid menu section: ${elementId}`);
  }

  container.replaceChildren();

  for (const item of section.items) {
    if (
      typeof item.name !== "string" ||
      !Array.isArray(item.prices) ||
      item.prices.length !== 3
    ) {
      throw new Error(`Invalid menu item in ${elementId}`);
    }

    const row = document.createElement("div");
    row.className = "menu-item";

    const name = document.createElement("span");
    name.className = "menu-item-name";
    name.textContent = item.name;

    const prices = document.createElement("div");
    prices.className = "menu-item-prices";

    for (const amount of item.prices) {
      if (
        typeof amount !== "number" ||
        !Number.isFinite(amount) ||
        amount < 0
      ) {
        throw new Error(`Invalid price for ${item.name}`);
      }

      prices.appendChild(formatPrice(amount));
    }

    row.append(name, prices);
    container.appendChild(row);
  }
}

function renderMenu(menu) {
  renderSection("coffee-items", menu.coffee);
  renderSection("espresso-items", menu.espresso);
  renderSection("noncoffee-items", menu.nonCoffee);

  if (
    !Array.isArray(menu.syrups) ||
    !Array.isArray(menu.addOns?.items) ||
    typeof menu.addOns.price !== "number"
  ) {
    throw new Error("Invalid syrup or add-on data");
  }

  document.getElementById("syrups-list").textContent = menu.syrups.join(", ");

  document.getElementById("addons-list").textContent =
    menu.addOns.items.join(", ");

  document.getElementById("addons-price").textContent =
    `${Math.round(menu.addOns.price * 100)}¢`;
}

async function loadMenu() {
  try {
    const response = await fetch(MENU_URL, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Menu request failed: ${response.status}`);
    }

    const data = await response.json();

    // Supports the full published-menu API response,
    // which wraps the actual menu inside "menu".
    const menu = data.menu ?? data;

    if (
      !menu ||
      typeof menu !== "object" ||
      !menu.coffee ||
      !menu.espresso ||
      !menu.nonCoffee
    ) {
      throw new Error("Invalid menu data");
    }

    renderMenu(menu);
  } catch (error) {
    console.error("Unable to load offline menu:", error);
  }
}

loadMenu();
