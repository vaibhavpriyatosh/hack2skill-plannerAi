import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { z } from "zod";
import { upsertGoogleUser } from "@/lib/db";
import { getEnv, validateProductionEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

const googleProfileSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email(),
  name: z.string().optional().nullable(),
  picture: z.string().url().optional().nullable(),
});

const env = getEnv();

function hasGoogleCredentials(): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: false,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      validateProductionEnv(env);

      if (!hasGoogleCredentials()) {
        logger.warn("Google OAuth credentials are missing. Rejecting sign-in.");
        return false;
      }

      if (account?.provider !== "google" || !profile) {
        return false;
      }

      const parsedProfile = googleProfileSchema.safeParse(profile);
      if (!parsedProfile.success) {
        logger.warn(
          { issueCount: parsedProfile.error.issues.length },
          "Rejected malformed Google profile payload",
        );
        return false;
      }

      return true;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile) {
        const parsedProfile = googleProfileSchema.safeParse(profile);
        if (!parsedProfile.success) {
          return token;
        }

        const userId = await upsertGoogleUser({
          email: parsedProfile.data.email,
          name: parsedProfile.data.name ?? null,
          image: parsedProfile.data.picture ?? null,
          googleSub: parsedProfile.data.sub,
        });

        token.userId = userId;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId;
      }

      return session;
    },
  },
  events: {
    async signIn(message) {
      logger.info(
        {
          provider: message.account?.provider,
          userId: message.user.id,
          email: message.user.email,
        },
        "User signed in",
      );
    },
    async signOut(message) {
      logger.info(
        {
          tokenUserId: typeof message.token?.userId === "string" ? message.token.userId : null,
        },
        "User signed out",
      );
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: env.NEXTAUTH_SECRET,
};
