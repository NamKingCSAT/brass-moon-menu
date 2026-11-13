import "server-only";
import prisma from "./prisma";
import type { MenuSection } from "../data/menu";
import { connection } from "next/server";

type PublishedMenu = {
  coffee: MenuSection;
  espresso: MenuSection;
  nonCoffee: MenuSection;
  syrups: string[];
  addOns: {
    items: string[];
    price: number;
  };
  version: number;
};

export async function getBrassMoonMenu(): Promise<PublishedMenu> {
  // Wait for an incoming request before accessing Prisma.
  await connection();

  const menu = await prisma.menu.findUnique({
    where: {
      slug: "brass-moon",
    },
    select: {
      publishedVersion: true,
      publishedSnapshot: true,
    },
  });

  if (!menu) {
    throw new Error("Brass Moon menu not found");
  }

  if (!menu.publishedSnapshot) {
    throw new Error("Brass Moon menu has not been published");
  }

  const snapshot = menu.publishedSnapshot as PublishedMenu;

  if (
    !snapshot.coffee?.items ||
    !snapshot.espresso?.items ||
    !snapshot.nonCoffee?.items ||
    !Array.isArray(snapshot.syrups) ||
    !Array.isArray(snapshot.addOns?.items) ||
    typeof snapshot.addOns.price !== "number" ||
    snapshot.version !== menu.publishedVersion
  ) {
    throw new Error("Invalid published menu snapshot");
  }

  return snapshot;
}
