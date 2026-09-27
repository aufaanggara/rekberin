import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

let stopped = false;
let wake: (() => void) | null = null;

function stop() { stopped = true; wake?.(); }
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

async function main() {
  const { processExpiredHandovers } = await import("@/lib/handover-flow");
  const { prisma } = await import("@/lib/prisma");

  while (!stopped) {
    try {
      const released = await processExpiredHandovers();
      if (released) console.log("Dummy handover payouts processed:", released);
    } catch (error) {
      console.error("Handover expiry worker failed", error);
    }
    if (!stopped) await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 30_000);
      wake = () => { clearTimeout(timer); resolve(); };
    });
    wake = null;
  }
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Handover worker stopped unexpectedly", error);
  process.exitCode = 1;
});
