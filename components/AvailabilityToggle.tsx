"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setMenuItemAvailability } from "@/app/admin/actions";

type Props = {
  itemId: string;
  initialAvailable: boolean;
};

export default function AvailabilityToggle({
  itemId,
  initialAvailable,
}: Props) {
  const router = useRouter();
  const [available, setAvailable] = useState(initialAvailable);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function handleToggle() {
    const nextValue = !available;

    setMessage("");

    startTransition(async () => {
      try {
        await setMenuItemAvailability(itemId, nextValue);
        setAvailable(nextValue);
        setIsError(false);

        setMessage(
          nextValue
            ? "Marked available — draft saved"
            : "Marked unavailable — draft saved",
        );

        router.refresh();
      } catch (error) {
        setIsError(true);
        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to update availability",
        );
      }
    });
  }

  return (
    <div className="admin-availability">
      <button
        type="button"
        className={
          available
            ? "availability-button available"
            : "availability-button unavailable"
        }
        onClick={handleToggle}
        disabled={isPending}
        aria-pressed={available}
      >
        {isPending ? "Saving..." : available ? "Available" : "Unavailable"}
      </button>

      {message && (
        <div
          className={
            isError
              ? "admin-availability-toast error"
              : "admin-availability-toast success"
          }
          role="status"
        >
          {message}
          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
