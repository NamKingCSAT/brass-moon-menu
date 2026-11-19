import { auth } from "@/auth";

export function isAllowedMenuEmail(email?: string | null) {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return false;
  }

  const allowedEmails = [
    process.env.ADMIN_EMAIL,
    ...(process.env.ALLOWED_USER_EMAILS ?? "").split(","),
  ]
    .map((value) => value?.trim().toLowerCase())
    .filter(Boolean);

  return allowedEmails.includes(normalizedEmail);
}

export async function requireMenuAccess() {
  const session = await auth();

  if (!isAllowedMenuEmail(session?.user?.email)) {
    throw new Error("Unauthorized");
  }
}
