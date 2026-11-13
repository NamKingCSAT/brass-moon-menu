import type { MenuSection as MenuSectionType } from "@/data/menu";

type MenuSectionProps = {
  section: MenuSectionType;
};

function Price({ amount }: { amount: number }) {
  const [dollars, cents] = amount.toFixed(2).split(".");

  return (
    <span className="menu-price">
      <span className="menu-price-dollars">{dollars}</span>
      <span className="menu-price-cents">{cents}</span>
    </span>
  );
}

export default function MenuSection({ section }: MenuSectionProps) {
  return (
    <section className="menu-section">
      <h2 className="menu-section-title">{section.title}</h2>

      <div className="menu-section-items">
        {section.items.map((item) => (
          <div className="menu-item" key={item.name}>
            <span className="menu-item-name">{item.name}</span>

            <div className="menu-item-prices">
              {item.prices.map((price, index) => (
                <Price key={index} amount={price} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
