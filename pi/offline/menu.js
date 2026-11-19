"use strict";

const MENU_URL = "./menu.json";
const MENU_CHECK_INTERVAL = 30_000;

let displayedVersion = null;
let isChecking = false;

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

function validateSection(section, name) {
  if (!section || !Array.isArray(section.items)) {
    throw new Error(`Invalid menu section: ${name}`);
  }

  for (const item of section.items) {
    if (
      typeof item.name !== "string" ||
      !Array.isArray(item.prices) ||
      item.prices.length !== 3
    ) {
      throw new Error(`Invalid menu item in ${name}`);
    }

    for (const price of item.prices) {
      if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
        throw new Error(`Invalid price for ${item.name}`);
      }
    }
  }
}

function validateMenu(menu) {
  if (!menu || typeof menu !== "object") {
    throw new Error("Invalid menu data");
  }

  validateSection(menu.coffee, "coffee");
  validateSection(menu.espresso, "espresso");
  validateSection(menu.nonCoffee, "nonCoffee");

  if (
    !Array.isArray(menu.syrups) ||
    !menu.syrups.every((item) => typeof item === "string") ||
    !Array.isArray(menu.addOns?.items) ||
    !menu.addOns.items.every((item) => typeof item === "string") ||
    typeof menu.addOns.price !== "number" ||
    !Number.isFinite(menu.addOns.price) ||
    menu.addOns.price < 0
  ) {
    throw new Error("Invalid syrup or add-on data");
  }
}

function renderSection(elementId, section) {
  const container = document.getElementById(elementId);

  if (!container) {
    throw new Error(`Missing menu container: ${elementId}`);
  }

  const rows = document.createDocumentFragment();

  for (const item of section.items) {
    const row = document.createElement("div");
    row.className = "menu-item";

    const name = document.createElement("span");
    name.className = "menu-item-name";
    name.textContent = item.name;

    const prices = document.createElement("div");
    prices.className = "menu-item-prices";

    for (const amount of item.prices) {
      prices.appendChild(formatPrice(amount));
    }

    row.append(name, prices);
    rows.appendChild(row);
  }

  container.replaceChildren(rows);
}

function renderMenu(menu) {
  validateMenu(menu);

  const requiredIds = [
    "coffee-items",
    "espresso-items",
    "noncoffee-items",
    "syrups-list",
    "addons-list",
    "addons-price",
  ];

  for (const id of requiredIds) {
    if (!document.getElementById(id)) {
      throw new Error(`Missing menu element: ${id}`);
    }
  }

  renderSection("coffee-items", menu.coffee);
  renderSection("espresso-items", menu.espresso);
  renderSection("noncoffee-items", menu.nonCoffee);

  document.getElementById("syrups-list").textContent = menu.syrups.join(", ");

  document.getElementById("addons-list").textContent =
    menu.addOns.items.join(", ");

  document.getElementById("addons-price").textContent =
    `${Math.round(menu.addOns.price * 100)}¢`;
}

async function checkForMenuUpdate() {
  if (isChecking) return;

  isChecking = true;

  try {
    const response = await fetch(MENU_URL, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Menu request failed: ${response.status}`);
    }

    const data = await response.json();
    const menu = data.menu ?? data;
    const version = data.version ?? menu.version;

    if (!Number.isInteger(version) || version < 0) {
      throw new Error("Invalid published menu version");
    }

    if (displayedVersion !== null && version <= displayedVersion) {
      return;
    }

    renderMenu(menu);
    displayedVersion = version;

    console.log(`Brass Moon menu displaying version ${version}`);
  } catch (error) {
    console.error("Unable to check offline menu:", error);
  } finally {
    isChecking = false;
  }
}

// Display the saved menu immediately on startup.
checkForMenuUpdate();

// Check local menu.json every 30 seconds.
setInterval(checkForMenuUpdate, MENU_CHECK_INTERVAL);
