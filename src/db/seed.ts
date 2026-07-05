/**
 * Idempotent seed: creates the "Administrator" role (full policies),
 * a "Management" department, and the root admin account from env vars.
 * Run with: npm run db:seed
 */
import { eq } from "drizzle-orm";
import { db, schema } from "./index";
import { createCredentialUser } from "../lib/auth";
import { RESOURCE_KEYS, FULL_ACCESS } from "../lib/rbac/keys";

async function main() {
  // 1) Administrator role with full access on every resource
  let [adminRole] = await db
    .select()
    .from(schema.roles)
    .where(eq(schema.roles.name, "Administrator"));
  if (!adminRole) {
    [adminRole] = await db
      .insert(schema.roles)
      .values({ name: "Administrator", description: "Full access to every module" })
      .returning();
    await db.insert(schema.rolePolicies).values(
      RESOURCE_KEYS.map((key) => ({ roleId: adminRole.id, policyKey: key, ...FULL_ACCESS }))
    );
    console.log("✓ Administrator role created");
  }

  // 2) Management department
  let [dept] = await db
    .select()
    .from(schema.departments)
    .where(eq(schema.departments.key, "management"));
  if (!dept) {
    [dept] = await db
      .insert(schema.departments)
      .values({ key: "management", name: "Management" })
      .returning();
    console.log("✓ Management department created");
  }

  // 3) Root admin from env
  const email = (process.env.ROOT_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ROOT_ADMIN_PASSWORD ?? "";
  const name = process.env.ROOT_ADMIN_NAME ?? "Administrator";
  if (!email || !password) {
    console.log("! ROOT_ADMIN_EMAIL / ROOT_ADMIN_PASSWORD not set — skipping root admin");
    return;
  }

  const [existing] = await db.select().from(schema.user).where(eq(schema.user.email, email));
  if (existing) {
    console.log("✓ Root admin already exists:", email);
    return;
  }

  const rootUser = await createCredentialUser({ email, name, password });
  await db.insert(schema.userProfiles).values({
    userId: rootUser.id,
    departmentId: dept.id,
    roleId: adminRole.id,
    isActive: true,
    isRoot: true,
  });
  console.log("✓ Root admin created:", email);
}

main()
  .then(() => {
    console.log("Seed complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
