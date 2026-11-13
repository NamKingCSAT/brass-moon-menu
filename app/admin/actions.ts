"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { connection } from "next/server";
export async function updateMenuItem(
  itemId: string,
  name: string,
  prices: { id: string; amount: number }[],
) {
  const session = await auth();

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = session?.user?.email?.trim().toLowerCase();

  if (!adminEmail || !userEmail || userEmail !== adminEmail) {
    throw new Error("Unauthorized");
  }

  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Product name cannot be empty");
  }

  if (
    prices.some(
      (price) =>
        !Number.isFinite(price.amount) ||
        price.amount < 0 ||
        price.amount > 999999.99,
    )
  ) {
    throw new Error("Invalid price");
  }

  await prisma.$transaction(async (tx) => {
    const item = await tx.menuItem.findFirst({
      where: {
        id: itemId,
        section: {
          menu: { slug: "brass-moon" },
        },
      },
      include: {
        prices: true,
      },
    });

    if (!item) {
      throw new Error("Menu item not found");
    }

    const allowedPriceIds = new Set(item.prices.map((p) => p.id));

    if (
      prices.length !== item.prices.length ||
      new Set(prices.map((p) => p.id)).size !== prices.length ||
      prices.some((p) => !allowedPriceIds.has(p.id))
    ) {
      throw new Error("Invalid price selection");
    }

    await tx.menuItem.update({
      where: { id: itemId },
      data: { name: trimmedName },
    });

    for (const price of prices) {
      await tx.menuItemPrice.update({
        where: { id: price.id },
        data: { amount: price.amount.toFixed(2) },
      });
    }
  });

  revalidatePath("/admin");

  return { success: true };
}

export async function publishMenu() {
  const session = await auth();

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = session?.user?.email?.trim().toLowerCase();

  if (!adminEmail || !userEmail || userEmail !== adminEmail) {
    throw new Error("Unauthorized");
  }

  await connection();

  const version = await prisma.$transaction(async (tx) => {
    const menu = await tx.menu.findUnique({
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

    function getSection(slug: string) {
      const section = menu!.sections.find((section) => section.slug === slug);

      if (!section) {
        throw new Error(`Missing section: ${slug}`);
      }

      return section;
    }

    function getDrinkSection(slug: string) {
      const section = getSection(slug);

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
    }

    const addOnItems = getSection("add-ons").items;
    const nextVersion = menu.publishedVersion + 1;

    const snapshot = {
      coffee: getDrinkSection("coffee"),
      espresso: getDrinkSection("espresso"),
      nonCoffee: getDrinkSection("non-coffee"),

      syrups: getSection("syrups").items.map((item) => item.name),

      addOns: {
        items: addOnItems.map((item) => item.name),
        price: addOnItems.length
          ? Number(addOnItems[0].prices[0]?.amount ?? 0)
          : 0,
      },

      version: nextVersion,
    };

    // Prevent another publication from overwriting this one.
    const result = await tx.menu.updateMany({
      where: {
        id: menu.id,
        publishedVersion: menu.publishedVersion,
      },
      data: {
        publishedSnapshot: snapshot,
        publishedVersion: nextVersion,
        publishedAt: new Date(),
      },
    });

    if (result.count !== 1) {
      throw new Error("Menu was published elsewhere. Please try again.");
    }

    return nextVersion;
  });

  revalidatePath("/");
  revalidatePath("/admin");

  return {
    success: true,
    version,
  };
}

export async function setMenuItemAvailability(
  itemId: string,
  isAvailable: boolean,
) {
  const session = await auth();

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = session?.user?.email?.trim().toLowerCase();

  if (!adminEmail || !userEmail || userEmail !== adminEmail) {
    throw new Error("Unauthorized");
  }

  if (
    typeof itemId !== "string" ||
    !itemId.trim() ||
    typeof isAvailable !== "boolean"
  ) {
    throw new Error("Invalid availability request");
  }

  const result = await prisma.menuItem.updateMany({
    where: {
      id: itemId,
      section: {
        menu: {
          slug: "brass-moon",
        },
      },
    },
    data: {
      isAvailable,
    },
  });

  if (result.count !== 1) {
    throw new Error("Menu item not found");
  }

  revalidatePath("/admin");

  return { success: true };
}
