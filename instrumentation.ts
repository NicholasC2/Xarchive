export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const { startCleanupScheduler } =
            await import("./lib/r2/cleanupScheduler");

        startCleanupScheduler();
    }
}