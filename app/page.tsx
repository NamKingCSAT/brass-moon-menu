import MenuSection from "@/components/MenuSection";
import { coffee, espresso, nonCoffee, syrups, addOns } from "@/data/menu";

export default function Home() {
  return (
    <main className="menu-screen">
      <div className="menu-canvas">
        <div className="menu-background" />

        <div className="menu-content">
          <div className="coffee-position">
            <MenuSection section={coffee} />
          </div>

          <div className="espresso-position">
            <MenuSection section={espresso} />
          </div>

          <div className="noncoffee-position">
            <MenuSection section={nonCoffee} />
          </div>

          <section className="syrups-position">
            <h2 className="menu-section-title">SYRUPS &amp; SAUCE</h2>
            <p className="menu-description">{syrups.join(", ")}</p>
          </section>

          <section className="addons-position">
            <h2 className="menu-section-title">
              ADD-ONS{" "}
              <span className="addons-price">
                {Math.round(addOns.price * 100)}¢
              </span>
            </h2>
            <p className="menu-description">{addOns.items.join(", ")}</p>
          </section>
        </div>
      </div>
    </main>
  );
}
