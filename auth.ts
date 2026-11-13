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

      const email = profile?.email?.toLowerCase();
      const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

      return (
        profile?.email_verified === true &&
        !!email &&
        !!adminEmail &&
        email === adminEmail
      );
    },
  },
});
