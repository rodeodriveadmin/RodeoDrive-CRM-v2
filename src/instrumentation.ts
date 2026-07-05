// Runs once when the Next.js server starts (any runtime). We only start the
// report scheduler in the long-running Node.js process.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startReportScheduler } = await import("@/modules/scheduled-reports/scheduler");
    startReportScheduler();
  }
}
