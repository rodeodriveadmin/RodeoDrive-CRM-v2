// Runs once when the Next.js server starts (any runtime). Everything inside
// the NEXT_RUNTIME guard is dead-code-eliminated from the edge bundle, so
// node-only imports (pg) must stay behind dynamic imports in this branch.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureAuthSecurityColumns } = await import("@/lib/bootstrap-migrations");
    await ensureAuthSecurityColumns();
    const { startReportScheduler } = await import("@/modules/scheduled-reports/scheduler");
    startReportScheduler();
  }
}
