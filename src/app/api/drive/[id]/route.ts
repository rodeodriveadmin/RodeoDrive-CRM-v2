import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCurrentUser } from "@/lib/rbac/server";
import { can } from "@/lib/rbac/keys";
import { storage } from "@/lib/storage";

// Authenticated file download; enforces DRIVE read policy + file visibility.
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !user.isActive || !can(user.policies, "DRIVE", "read", user.isRoot)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;
  const [file] = await db.select().from(schema.driveFiles).where(eq(schema.driveFiles.id, id));
  if (!file) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (file.visibility === "PRIVATE" && file.ownerEmail !== user.email && !user.isRoot) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const bytes = await storage.read(file.storagePath);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": file.contentType ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.displayName)}`,
      "Content-Length": String(file.sizeBytes),
    },
  });
}
