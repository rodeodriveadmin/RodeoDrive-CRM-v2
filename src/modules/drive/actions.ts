"use server";

import type { ActionResult } from "@/lib/action-result";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { logActivity } from "@/lib/activity";
import { MAX_UPLOAD_BYTES, storage } from "@/lib/storage";

function normFolder(raw: string): string {
  const cleaned = raw
    .split("/")
    .map((p) => p.trim())
    .filter(Boolean)
    .join("/");
  return cleaned ? `/${cleaned}` : "/";
}

export async function uploadDriveFile(formData: FormData): Promise<ActionResult> {
  const actor = await requirePolicy("DRIVE", "create");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "INVALID_INPUT" };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "TOO_LARGE" };

  const folderPath = normFolder(String(formData.get("folderPath") ?? "/"));
  const visibility =
    String(formData.get("visibility")) === "PRIVATE" ? "PRIVATE" : "ORGANIZATION";

  const bytes = Buffer.from(await file.arrayBuffer());
  const storagePath = await storage.save(bytes);

  const [row] = await db
    .insert(schema.driveFiles)
    .values({
      ownerEmail: actor.email,
      ownerName: actor.name,
      displayName: file.name,
      folderPath,
      storagePath,
      contentType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      visibility,
    })
    .returning();

  await logActivity({
    entityType: "drive_file",
    entityId: row.id,
    action: "create",
    message: `File "${file.name}" uploaded to ${folderPath}`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/drive");
  return { ok: true, id: row.id };
}

export async function deleteDriveFile(id: string): Promise<ActionResult> {
  const actor = await requirePolicy("DRIVE", "delete");

  const [file] = await db
    .select({
      storagePath: schema.driveFiles.storagePath,
      displayName: schema.driveFiles.displayName,
      ownerEmail: schema.driveFiles.ownerEmail,
    })
    .from(schema.driveFiles)
    .where(eq(schema.driveFiles.id, id));
  if (!file) return { error: "NOT_FOUND" };

  // non-root users may only delete their own files
  if (!actor.isRoot && file.ownerEmail !== actor.email) return { error: "FORBIDDEN" };

  await db.delete(schema.driveFiles).where(eq(schema.driveFiles.id, id));
  await storage.remove(file.storagePath);

  await logActivity({
    entityType: "drive_file",
    entityId: id,
    action: "delete",
    message: `File "${file.displayName}" deleted`,
    actorEmail: actor.email,
    actorName: actor.name,
  });
  revalidatePath("/drive");
  return { ok: true };
}
