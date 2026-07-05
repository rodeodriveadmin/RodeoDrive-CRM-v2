import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  // extra origins allowed to authenticate (comma-separated), e.g. the
  // platform-generated domain while a custom domain's DNS propagates
  trustedOrigins: (process.env.TRUSTED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // No public self-registration — accounts are created by admins (invite flow).
    disableSignUp: true,
    minPasswordLength: 6,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,
  },
  databaseHooks: {
    session: {
      create: {
        // Deactivated users cannot sign in.
        before: async (session) => {
          const [profile] = await db
            .select({ isActive: schema.userProfiles.isActive })
            .from(schema.userProfiles)
            .where(eq(schema.userProfiles.userId, session.userId));
          if (profile && !profile.isActive) {
            throw new APIError("FORBIDDEN", {
              message: "ACCOUNT_DISABLED",
            });
          }
          return { data: session };
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;

/**
 * Creates a credential user directly (server-side invite flow / seeding),
 * bypassing the disabled public sign-up endpoint.
 */
export async function createCredentialUser(input: {
  email: string;
  name: string;
  password: string;
}) {
  const ctx = await auth.$context;
  const email = input.email.trim().toLowerCase();
  const hash = await ctx.password.hash(input.password);
  const newUser = await ctx.internalAdapter.createUser({
    email,
    name: input.name,
    emailVerified: true,
  });
  await ctx.internalAdapter.linkAccount({
    userId: newUser.id,
    providerId: "credential",
    accountId: newUser.id,
    password: hash,
  });
  return newUser;
}

/** Admin password reset: rewrites the credential account's password hash. */
export async function setUserPassword(userId: string, password: string) {
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);
  await db
    .update(schema.account)
    .set({ password: hash, updatedAt: new Date() })
    .where(eq(schema.account.userId, userId));
}
