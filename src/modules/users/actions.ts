"use server";

import type { ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { createCredentialUser, setUserPassword } from "@/lib/auth";
import { isPasswordValid } from "@/lib/password-policy";
import { requirePolicy } from "@/lib/rbac/server";
import { logActivity } from "@/lib/activity";

export interface InviteUserInput {
  email: string;
  fullName: string;
  password: string;
  employeeId?: string;
  mobileNumber?: string;
  departmentId?: string;
  roleId?: string;
}

export async function inviteUser(input: InviteUserInput): Promise<ActionResult> {
  const actor = await requirePolicy("USERS_ADMIN", "create");

  const email = input.email.trim().toLowerCase();
  if (!email || !input.fullName.trim()) {
    return { error: "INVALID_INPUT" };
  }
  if (!isPasswordValid(input.password)) return { error: "WEAK_PASSWORD" };

  const [existing] = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(eq(schema.user.email, email));
  if (existing) return { error: "EMAIL_EXISTS" };

  const newUser = await createCredentialUser({
    email,
    name: input.fullName.trim(),
    password: input.password,
  });

  await db.insert(schema.userProfiles).values({
    userId: newUser.id,
    employeeId: input.employeeId?.trim() || null,
    mobileNumber: input.mobileNumber?.trim() || null,
    departmentId: input.departmentId || null,
    roleId: input.roleId || null,
    isActive: true,
  });

  await logActivity({
    entityType: "user",
    entityId: newUser.id,
    action: "create",
    message: `User ${email} invited`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setUserActive(userId: string, isActive: boolean): Promise<ActionResult> {
  const actor = await requirePolicy("USERS_ADMIN", "update");
  if (userId === actor.userId) return { error: "SELF" };

  // Root accounts can never be deactivated.
  const [profile] = await db
    .select({ isRoot: schema.userProfiles.isRoot })
    .from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, userId));
  if (profile?.isRoot) return { error: "ROOT" };

  await db
    .update(schema.userProfiles)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(schema.userProfiles.userId, userId));

  if (!isActive) {
    // kill existing sessions immediately
    await db.delete(schema.session).where(eq(schema.session.userId, userId));
  }

  await logActivity({
    entityType: "user",
    entityId: userId,
    action: isActive ? "activate" : "deactivate",
    message: `User ${isActive ? "activated" : "deactivated"}`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/admin/users");
  return { ok: true };
}

export interface UpdateUserInput {
  fullName?: string;
  employeeId?: string;
  mobileNumber?: string;
  departmentId?: string | null;
  roleId?: string | null;
}

export async function updateUserProfile(userId: string, input: UpdateUserInput): Promise<ActionResult> {
  const actor = await requirePolicy("USERS_ADMIN", "update");

  if (input.fullName?.trim()) {
    await db
      .update(schema.user)
      .set({ name: input.fullName.trim(), updatedAt: new Date() })
      .where(eq(schema.user.id, userId));
  }

  await db
    .update(schema.userProfiles)
    .set({
      employeeId: input.employeeId?.trim() || null,
      mobileNumber: input.mobileNumber?.trim() || null,
      departmentId: input.departmentId ?? null,
      roleId: input.roleId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(schema.userProfiles.userId, userId));

  await logActivity({
    entityType: "user",
    entityId: userId,
    action: "update",
    message: "User profile updated",
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function resetUserPassword(userId: string, password: string): Promise<ActionResult> {
  const actor = await requirePolicy("USERS_ADMIN", "update");
  if (!isPasswordValid(password)) return { error: "WEAK_PASSWORD" };

  await setUserPassword(userId, password);
  await db.delete(schema.session).where(eq(schema.session.userId, userId));

  await logActivity({
    entityType: "user",
    entityId: userId,
    action: "update",
    message: "Password reset by admin",
    actorEmail: actor.email,
    actorName: actor.name,
  });
  return { ok: true };
}

/** Clears a brute-force block (3 wrong passwords). Admin-only. */
export async function unblockUser(userId: string): Promise<ActionResult> {
  const actor = await requirePolicy("USERS_ADMIN", "update");

  await db
    .update(schema.userProfiles)
    .set({ isBlocked: false, failedLoginAttempts: 0, updatedAt: new Date() })
    .where(eq(schema.userProfiles.userId, userId));

  await logActivity({
    entityType: "user",
    entityId: userId,
    action: "update",
    message: "User unblocked after failed sign-in attempts",
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/admin/users");
  return { ok: true };
}
