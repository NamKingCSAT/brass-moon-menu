import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";
import AdminMenuItem from "@/components/AdminMenuItem";
import PublishMenuButton from "@/components/PublishMenuButton";
import AvailabilityToggle from "@/components/AvailabilityToggle";

async function AdminContent() {
  const menu = await prisma.menu.findUnique({
    where: { slug: "brass-moon" },
    include: {
      sections: {
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
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
    return <p>Brass Moon menu not found.</p>;
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div>
          <h1>Brass Moon Administration</h1>
          <p>Manage your digital menu</p>
        </div>

        <div className="admin-header-actions">
          <PublishMenuButton publishedVersion={menu.publishedVersion} />

          <a href="/" target="_blank" rel="noopener noreferrer">
            View Menu
          </a>

          <SignOutButton />
        </div>
      </header>

      {menu.sections.map((section) => (
        <section className="admin-section" key={section.id}>
          <h2>{section.title}</h2>

          <div className="admin-items">
            {section.items.map((item) => (
              <div className="admin-product-row" key={item.id}>
                <AdminMenuItem
                  item={{
                    id: item.id,
                    name: item.name,
                    prices: item.prices.map((price) => ({
                      id: price.id,
                      size: price.size,
                      amount: Number(price.amount),
                    })),
                  }}
                />

                <AvailabilityToggle
                  itemId={item.id}
                  initialAvailable={item.isAvailable}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

async function ProtectedAdmin() {
  const session = await auth();

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = session?.user?.email?.trim().toLowerCase();

  if (!adminEmail || !userEmail || userEmail !== adminEmail) {
    redirect("/api/auth/signin");
  }

  return <AdminContent />;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<p>Loading administration...</p>}>
      <ProtectedAdmin />
    </Suspense>
  );
}
