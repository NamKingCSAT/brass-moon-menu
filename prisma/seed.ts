import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { coffee, espresso, nonCoffee, syrups, addOns } from "../data/menu";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Prevent accidental reseeding of an existing menu.
  const existing = await prisma.menu.findUnique({
    where: { slug: "brass-moon" },
  });

  if (existing) {
    console.log("Brass Moon menu already exists. Skipping seed.");
    return;
  }

  const sections = [
    {
      slug: "coffee",
      title: coffee.title,
      sortOrder: 0,
      items: coffee.items,
    },
    {
      slug: "espresso",
      title: espresso.title,
      sortOrder: 1,
      items: espresso.items,
    },
    {
      slug: "non-coffee",
      title: nonCoffee.title,
      sortOrder: 2,
      items: nonCoffee.items,
    },
  ];

  await prisma.menu.create({
    data: {
      name: "Brass Moon Espresso Bar",
      slug: "brass-moon",
      sections: {
        create: [
          ...sections.map((section) => ({
            title: section.title,
            slug: section.slug,
            sortOrder: section.sortOrder,
            items: {
              create: section.items.map((item, index) => ({
                name: item.name,
                sortOrder: index,
                prices: {
                  create: item.prices.map((amount, priceIndex) => ({
                    size: ["Small", "Medium", "Large"][priceIndex],
                    amount: amount.toFixed(2),
                    sortOrder: priceIndex,
                  })),
                },
              })),
            },
          })),
          {
            title: "SYRUPS & SAUCE",
            slug: "syrups",
            sortOrder: 3,
            items: {
              create: syrups.map((name, index) => ({
                name,
                sortOrder: index,
              })),
            },
          },
          {
            title: "ADD-ONS",
            slug: "add-ons",
            sortOrder: 4,
            items: {
              create: addOns.items.map((name, index) => ({
                name,
                sortOrder: index,
                prices: {
                  create: [
                    {
                      size: "Regular",
                      amount: addOns.price.toFixed(2),
                      sortOrder: 0,
                    },
                  ],
                },
              })),
            },
          },
        ],
      },
    },
  });

  console.log("Brass Moon menu seeded successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
