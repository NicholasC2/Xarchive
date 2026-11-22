import "server-only";
import { cleanupR2 } from "./cleanup";

const INTERVAL = 86_400_000; // 24 hours

let started = false;

export function startCleanupScheduler() {
    if (started) return;

    started = true;

    cleanupR2().catch(console.error);

    setInterval(() => {
        cleanupR2().catch(console.error);
    }, INTERVAL);
}