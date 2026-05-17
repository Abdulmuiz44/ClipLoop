import NextAuth from "next-auth";
import Twitter from "next-auth/providers/twitter";
import { env } from "@/lib/env";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  debug: process.env.NODE_ENV !== "production",
  trustHost: true,
  secret: env.AUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Twitter({
      clientId: env.AUTH_TWITTER_ID ?? "",
      clientSecret: env.AUTH_TWITTER_SECRET ?? "",
      ...( { version: "2.0" } as Record<string, unknown>),
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    authorized({ auth: session }) {
      return !!session?.user;
    },
  },
  logger: {
    error(code, ...message) {
      console.error("[auth][error]", code, ...message);
    },
    warn(code, ...message) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[auth][warn]", code, ...message);
      }
    },
  },
});
