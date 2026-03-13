import { spawn } from "node:child_process";

const port = process.env.PORT || "3000";

const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", String(port)],
  {
    stdio: "inherit",
  }
);

child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});

