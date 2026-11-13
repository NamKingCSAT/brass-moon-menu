import { signOut } from "@/auth";

export default function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/api/auth/signin" });
      }}
    >
      <button type="submit" className="admin-signout">
        Sign Out
      </button>
    </form>
  );
}
