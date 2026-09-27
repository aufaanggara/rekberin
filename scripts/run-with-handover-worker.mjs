import { spawn } from "node:child_process";
import process from "node:process";

const mode = process.argv[2] === "start" ? "start" : "dev";
const next = spawn(process.execPath, ["node_modules/next/dist/bin/next", mode, ...process.argv.slice(3)], {
  stdio: "inherit",
  windowsHide: true,
});
const worker = spawn(process.execPath, ["--import", "tsx", "scripts/handover-worker.ts"], {
  stdio: "inherit",
  windowsHide: true,
});

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  next.kill();
  worker.kill();
  process.exitCode = code;
}

next.on("exit", (code) => stop(code ?? 1));
worker.on("exit", (code) => {
  if (!stopping) stop(code ?? 1);
});
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
