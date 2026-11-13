"use client";

import { useState, useTransition } from "react";
import { updateMenuItem } from "@/app/admin/actions";

type Price = {
  id: string;
  size: string;
  amount: number;
};

type AdminMenuItemProps = {
  item: {
    id: string;
    name: string;
    prices: Price[];
  };
};

export default function AdminMenuItem({ item }: AdminMenuItemProps) {
  const [name, setName] = useState(item.name);
  const [prices, setPrices] = useState(
    item.prices.map((price) => ({
      ...price,
      amount: price.amount.toFixed(2),
    })),
  );

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const hasChanges =
    name !== item.name ||
    prices.some(
      (price, index) => price.amount !== item.prices[index].amount.toFixed(2),
    );

  function handleSave() {
    setMessage("");
    setIsError(false);

    const formattedPrices = prices.map((price) => ({
      id: price.id,
      amount: Number(price.amount),
    }));

    startTransition(async () => {
      try {
        await updateMenuItem(item.id, name, formattedPrices);

        setMessage("Draft saved successfully");
        setIsError(false);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Failed to save changes",
        );
        setIsError(true);
      }
    });
  }

  return (
    <div className="admin-edit-item">
      <div className="admin-edit-fields">
        <label className="admin-edit-name">
          <span>Product</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isPending}
          />
        </label>

        <div className="admin-edit-prices">
          {prices.map((price, index) => (
            <label key={price.id}>
              <span>{price.size}</span>
              <input
                type="number"
                min="0"
                max="999999.99"
                step="0.01"
                value={price.amount}
                disabled={isPending}
                onChange={(event) => {
                  const updated = [...prices];

                  updated[index] = {
                    ...updated[index],
                    amount: event.target.value,
                  };

                  setPrices(updated);
                }}
              />
            </label>
          ))}
        </div>

        <button
          type="button"
          className="admin-save-button"
          onClick={handleSave}
          disabled={isPending || !hasChanges}
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>

      {message && (
        <p
          className={
            isError ? "admin-edit-message error" : "admin-edit-message success"
          }
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}
