import { desc, eq, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { requirePolicy } from "@/lib/rbac/server";
import { DriveView } from "./view";

export default async function DrivePage() {
  const me = await requirePolicy("DRIVE", "read");

  // organization files + the caller's own private files (root sees everything)
  const rows = await db
    .select()
    .from(schema.driveFiles)
    .where(
      me.isRoot
        ? undefined
        : or(
            eq(schema.driveFiles.visibility, "ORGANIZATION"),
            eq(schema.driveFiles.ownerEmail, me.email)
          )
    )
    .orderBy(desc(schema.driveFiles.createdAt));

  return (
    <DriveView
      files={rows.map((f) => ({
        id: f.id,
        displayName: f.displayName,
        folderPath: f.folderPath,
        contentType: f.contentType,
        sizeBytes: f.sizeBytes,
        visibility: f.visibility,
        ownerEmail: f.ownerEmail,
        ownerName: f.ownerName,
        createdAt: f.createdAt.toISOString(),
      }))}
      meEmail={me.email}
      isRoot={me.isRoot}
    />
  );
}
