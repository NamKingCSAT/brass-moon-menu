import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const menu = await prisma.menu.findUnique({
    where: { slug: "brass-moon" },
    include: {
      sections: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            where: {
              isVisible: true,
              isAvailable: true,
            },
            orderBy: { sortOrder: "asc" },
            include: {
              prices: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!menu) {
    throw new Error("Brass Moon menu not found");
  }

  // Do not overwrite an existing published menu.
  if (menu.publishedSnapshot !== null) {
    console.log("A published snapshot already exists.");
    return;
  }

  const findSection = (slug: string) => {
    const section = menu.sections.find((section) => section.slug === slug);

    if (!section) {
      throw new Error(`Missing section: ${slug}`);
    }

    return section;
  };

  const drinkSection = (slug: string) => {
    const section = findSection(slug);

    return {
      title: section.title,
      items: section.items.map((item) => {
        const prices = item.prices.map((price) => Number(price.amount));

        if (prices.length !== 3) {
          throw new Error(`Expected three prices for ${item.name}`);
        }

        return {
          name: item.name,
          prices,
        };
      }),
    };
  };

  const addOnItems = findSection("add-ons").items;

  const snapshot = {
    coffee: drinkSection("coffee"),
    espresso: drinkSection("espresso"),
    nonCoffee: drinkSection("non-coffee"),

    syrups: findSection("syrups").items.map((item) => item.name),

    addOns: {
      items: addOnItems.map((item) => item.name),
      price: addOnItems.length
        ? Number(addOnItems[0].prices[0]?.amount ?? 0)
        : 0,
    },

    version: 1,
  };

  const result = await prisma.menu.updateMany({
    where: {
      id: menu.id,
      publishedVersion: 0,
    },

    data: {
      publishedSnapshot: snapshot,
      publishedVersion: 1,
      publishedAt: new Date(),
    },
  });

  if (result.count !== 1) {
    console.log("Menu was already published or changed. Nothing overwritten.");
    return;
  }

  console.log("Brass Moon menu published: Version 1");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
