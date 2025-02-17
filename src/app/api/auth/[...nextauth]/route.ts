import { getDb } from "@/db";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";

const handler = NextAuth({
    adapter: DrizzleAdapter(await getDb(), {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens
    }),
    session: { strategy: "jwt" },
    providers: [
      GithubProvider({
        clientId: process.env.GITHUB_ID!,
        clientSecret: process.env.GITHUB_SECRET!,
      }),
    ],
    pages: {
      signIn: '/auth/signin',
      error: '/auth/error',
    },
})

export { handler as GET, handler as POST, handler as HEAD, handler as OPTIONS }; 