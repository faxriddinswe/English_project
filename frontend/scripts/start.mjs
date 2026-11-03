import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname, relative, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, process.env.NEXT_DIST_DIR ?? ".next");
const distRelative = relative(root, dist);
if (
  !distRelative ||
  distRelative.startsWith("..") ||
  isAbsolute(distRelative)
) {
  throw new Error("NEXT_DIST_DIR must be inside the frontend directory.");
}
const standalone = resolve(dist, "standalone");
let hostname = "127.0.0.1";
let port = process.env.PORT ?? "3000";
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (["--hostname", "-H"].includes(args[i]) && args[i + 1])
    hostname = args[++i];
  else if (["--port", "-p"].includes(args[i]) && args[i + 1]) port = args[++i];
  else
    throw new Error(
      "Usage: npm run start -- [--hostname 127.0.0.1] [--port 3000]",
    );
}
if (!existsSync(resolve(standalone, "server.js"))) {
  console.error(
    "Frontend build topilmadi. Avval scripts/frontend run build buyrug‘ini bajaring.",
  );
  process.exit(1);
}
// Next.js standalone output omits these assets; serve the current public files
// and immutable build chunks alongside its generated server, as Docker does.
if (existsSync(resolve(root, "public")))
  cpSync(resolve(root, "public"), resolve(standalone, "public"), {
    recursive: true,
  });
mkdirSync(resolve(standalone, distRelative), { recursive: true });
cpSync(resolve(dist, "static"), resolve(standalone, distRelative, "static"), {
  recursive: true,
});
const server = spawn(process.execPath, [resolve(standalone, "server.js")], {
  cwd: standalone,
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "production",
    HOSTNAME: hostname,
    PORT: port,
  },
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.kill(signal));
server.on("error", () => {
  console.error("Frontend serverini ishga tushirib bo‘lmadi.");
  process.exitCode = 1;
});
server.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
