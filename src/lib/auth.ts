import NextAuth, { AuthOptions } from "next-auth";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@/db";
import { getServerSession } from "next-auth";
import { users } from "@/db/schema";

let authOptionsPromise: Promise<AuthOptions>;

const getAuthOptions = async (): Promise<AuthOptions> => {
  if (!authOptionsPromise) {
    authOptionsPromise = (async () => {
      const db = await getDb();
      
      // Debug: Check if tables exist
      try {
        const result = await db.select().from(users).limit(1);
        console.log("Users table exists, sample:", result);
      } catch (error) {
        console.error("Error checking users table:", error);
      }

      return {
        adapter: DrizzleAdapter(db),
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
        session: {
          strategy: "jwt",
          maxAge: 30 * 24 * 60 * 60, // 30 days
        },
        cookies: {
          sessionToken: {
            name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
            options: {
              httpOnly: true,
              sameSite: "lax",
              path: "/",
              secure: process.env.NODE_ENV === "production",
            }
          }
        },
        callbacks: {
          async signIn({ user, account, profile }) {
            console.log("Sign in attempt:", { user, account, profile });
            return true;
          },
          async jwt({ token, user }) {
            if (user) {
              token.sub = user.id;
              token.email = user.email;
            }
            return token;
          },
          async session({ session, token }) {
            if (session.user) {
              session.user.id = token.sub as string;
              session.user.email = token.email as string;
            }
            return session;
          },
          async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            else if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
          },
        },
        pages: {
          signIn: "/auth/signin",
          error: "/auth/error",
        },
        debug: true,
        logger: {
          error: (code, ...message) => {
            console.error(code, ...message);
          },
          warn: (code, ...message) => {
            console.warn(code, ...message);
          },
          debug: (code, ...message) => {
            console.log(code, ...message);
          },
        },
      }
    })();
  }
  return authOptionsPromise;
};

export const auth = async () => {
  const authOptions = await getAuthOptions();
  return getServerSession(authOptions);
};

// Default configuration for NextAuth
const defaultAuthOptions: AuthOptions = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
  ],
  session: { strategy: "jwt" }
};

const handler = NextAuth(defaultAuthOptions);
export const { signIn, signOut } = handler;

// Export the async function to get the full auth options
export const getFullAuthOptions = getAuthOptions; 