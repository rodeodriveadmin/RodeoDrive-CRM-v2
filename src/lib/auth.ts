import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { crmSender, getEmailProvider } from "@/lib/email";
import { PASSWORD_MIN_LENGTH } from "@/lib/password-policy";

export const MAX_LOGIN_ATTEMPTS = 3;

async function profileByEmail(email: string) {
  const [row] = await db
    .select({
      userId: schema.user.id,
      isBlocked: schema.userProfiles.isBlocked,
      failedLoginAttempts: schema.userProfiles.failedLoginAttempts,
      isRoot: schema.userProfiles.isRoot,
    })
    .from(schema.user)
    .innerJoin(schema.userProfiles, eq(schema.userProfiles.userId, schema.user.id))
    .where(eq(schema.user.email, email.trim().toLowerCase()));
  return row ?? null;
}

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
    minPasswordLength: PASSWORD_MIN_LENGTH,
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
    sendResetPassword: async ({ user, url }) => {
      await getEmailProvider().send(
        user.email,
        "Reset your Rodeo Drive CRM password",
        `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#14161d">
          <h2 style="margin:0 0 8px">Password reset</h2>
          <p>We received a request to reset the password for <b>${user.email}</b>.</p>
          <p><a href="${url}" style="display:inline-block;padding:10px 18px;background:#14161d;color:#fff;border-radius:8px;text-decoration:none">Choose a new password</a></p>
          <p style="color:#5f6b88;font-size:12px">The link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        </div>`,
        { from: crmSender() }
      );
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    ipAddress: {
      // behind Railway's proxy the client IP arrives in x-forwarded-for;
      // without this, login rate limiting falls back to one shared bucket
      ipAddressHeaders: ["x-forwarded-for"],
    },
  },
  hooks: {
    // blocked accounts cannot even attempt to sign in
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return;
      const email = typeof ctx.body?.email === "string" ? ctx.body.email : "";
      if (!email) return;
      const profile = await profileByEmail(email);
      if (profile?.isBlocked) {
        throw new APIError("FORBIDDEN", { message: "ACCOUNT_BLOCKED" });
      }
    }),
    // count wrong-password attempts on registered emails; 3 strikes → blocked
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return;
      const email = typeof ctx.body?.email === "string" ? ctx.body.email : "";
      if (!email) return;

      if (ctx.context.newSession) {
        // successful sign-in resets the counter
        const profile = await profileByEmail(email);
        if (profile && profile.failedLoginAttempts > 0) {
          await db
            .update(schema.userProfiles)
            .set({ failedLoginAttempts: 0, updatedAt: new Date() })
            .where(eq(schema.userProfiles.userId, profile.userId));
        }
        return;
      }

      const returned = ctx.context.returned;
      if (!(returned instanceof APIError)) return;
      // blocked/disabled rejections are not wrong-password attempts
      if (
        returned.body?.message === "ACCOUNT_BLOCKED" ||
        returned.body?.message === "ACCOUNT_DISABLED"
      ) {
        return;
      }

      const profile = await profileByEmail(email);
      if (!profile) return; // unregistered email — nothing to count
      // Root can never be blocked (nobody could unblock it); Better Auth's
      // per-IP rate limiting still throttles brute force on that account.
      if (profile.isRoot) return;

      const attempts = profile.failedLoginAttempts + 1;
      const blocked = attempts >= MAX_LOGIN_ATTEMPTS;
      await db
        .update(schema.userProfiles)
        .set({
          failedLoginAttempts: attempts,
          isBlocked: blocked,
          updatedAt: new Date(),
        })
        .where(eq(schema.userProfiles.userId, profile.userId));

      if (blocked) {
        throw new APIError("FORBIDDEN", { message: "ACCOUNT_BLOCKED" });
      }
      throw new APIError("UNAUTHORIZED", {
        message: `INVALID_CREDENTIALS:${MAX_LOGIN_ATTEMPTS - attempts}`,
      });
    }),
  },
  databaseHooks: {
    session: {
      create: {
        // Deactivated or blocked users cannot sign in.
        before: async (session) => {
          const [profile] = await db
            .select({
              isActive: schema.userProfiles.isActive,
              isBlocked: schema.userProfiles.isBlocked,
            })
            .from(schema.userProfiles)
            .where(eq(schema.userProfiles.userId, session.userId));
          if (profile && !profile.isActive) {
            throw new APIError("FORBIDDEN", {
              message: "ACCOUNT_DISABLED",
            });
          }
          if (profile?.isBlocked) {
            throw new APIError("FORBIDDEN", {
              message: "ACCOUNT_BLOCKED",
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
