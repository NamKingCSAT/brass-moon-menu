"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishMenu } from "@/app/admin/actions";

type Props = {
  publishedVersion: number;
};

export default function PublishMenuButton({ publishedVersion }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function handlePublish() {
    const confirmed = window.confirm(
      "Publish all saved draft changes to the live Brass Moon menu?",
    );

    if (!confirmed) return;

    setMessage("");
    setIsError(false);

    startTransition(async () => {
      try {
        const result = await publishMenu();

        setMessage(`Menu published successfully! Version ${result.version}`);
        setIsError(false);

        router.refresh();
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Failed to publish menu",
        );
        setIsError(true);
      }
    });
  }

  return (
    <div className="admin-publish">
      <span className="admin-version">Published v{publishedVersion}</span>

      <button
        type="button"
        className="admin-publish-button"
        onClick={handlePublish}
        disabled={isPending}
      >
        {isPending ? "Publishing..." : "Publish Menu"}
      </button>

      {message && (
        <div
          className={
            isError
              ? "admin-publish-toast error"
              : "admin-publish-toast success"
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
