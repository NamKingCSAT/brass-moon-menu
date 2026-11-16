import { connection } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  // Ensure the database query runs at request time.
  await connection();

  try {
    const menu = await prisma.menu.findUnique({
      where: {
        slug: "brass-moon",
      },
      select: {
        publishedVersion: true,
        publishedAt: true,
        publishedSnapshot: true,
      },
    });

    if (!menu || !menu.publishedSnapshot) {
      return Response.json(
        { error: "No published menu available" },
        {
          status: 404,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const url = new URL(request.url);
    const checkOnly = url.searchParams.get("check") === "1";

    // Small response for periodic version checks.
    if (checkOnly) {
      return Response.json(
        {
          version: menu.publishedVersion,
          publishedAt: menu.publishedAt,
        },
        {
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    // Full published menu for downloading updates.
    return Response.json(
      {
        version: menu.publishedVersion,
        publishedAt: menu.publishedAt,
        menu: menu.publishedSnapshot,
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("Published menu API error:", error);

    return Response.json(
      { error: "Unable to retrieve published menu" },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
