import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") {
        return false;
      }

      const email = profile?.email?.trim().toLowerCase();

      const allowedEmails = [
        process.env.ADMIN_EMAIL,
        ...(process.env.ALLOWED_USER_EMAILS ?? "").split(","),
      ]
        .map((value) => value?.trim().toLowerCase())
        .filter(Boolean);

      return (
        profile?.email_verified === true &&
        !!email &&
        allowedEmails.includes(email)
      );
    },
  },
});
