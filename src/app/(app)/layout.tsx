import { requireUser } from "@/lib/rbac/server";
import { AppShell } from "@/modules/shell/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <AppShell
      user={{
        name: user.name,
        email: user.email,
        roleName: user.roleName,
        departmentName: user.departmentName,
        isRoot: user.isRoot,
        policies: user.policies,
      }}
    >
      {children}
    </AppShell>
  );
}
