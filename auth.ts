import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { env } from "@/lib/env";

const googleClientId = env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
const authSecret = env.AUTH_SECRET?.trim() ?? env.NEXTAUTH_SECRET?.trim();

if (!googleClientId || !googleClientSecret) {
  console.error("[auth][error] Google OAuth env vars missing/empty", {
    hasClientId: !!googleClientId,
    hasClientSecret: !!googleClientSecret,
  });
}

if (!authSecret) {
  console.error("[auth][error] AUTH_SECRET/NEXTAUTH_SECRET missing/empty");
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  debug: process.env.NODE_ENV !== "production",
  trustHost: true,
  secret: authSecret,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: googleClientId ?? "",
      clientSecret: googleClientSecret ?? "",
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
