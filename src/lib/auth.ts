import NextAuth, { AuthOptions } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import GitHub from "next-auth/providers/github";

export const authOptions: AuthOptions = {
  adapter: DrizzleAdapter(db),
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
        },
      },
    }),
  ],
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If the url is absolute and starts with the base url
      if (url.startsWith(baseUrl)) return url;
      // If the url is relative (starts with /)
      if (url.startsWith("/")) return new URL(url, baseUrl).toString();
      // If the url is for the dashboard
      if (url.includes("/dashboard")) return new URL("/dashboard", baseUrl).toString();
      // Default fallback
      return baseUrl;
    },
  },
};

export const { auth, signIn, signOut } = NextAuth(authOptions); 