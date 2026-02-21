import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const serverDir = path.join(projectRoot, ".next", "server");
const chunksDir = path.join(serverDir, "chunks");
const runtimeFile = path.join(serverDir, "webpack-runtime.js");

if (!fs.existsSync(serverDir) || !fs.existsSync(chunksDir) || !fs.existsSync(runtimeFile)) {
  console.log("[repair-next-chunks] .next/server artifacts not found. Run dev/build first.");
  process.exit(0);
}

const runtime = fs.readFileSync(runtimeFile, "utf8");
const expectsRootChunks = runtime.includes('return "" + chunkId + ".js"');

if (!expectsRootChunks) {
  console.log("[repair-next-chunks] Runtime already points to chunk subdir. Nothing to repair.");
  process.exit(0);
}

const chunkFiles = fs.readdirSync(chunksDir).filter((file) => file.endsWith(".js"));
let copied = 0;

for (const file of chunkFiles) {
  const from = path.join(chunksDir, file);
  const to = path.join(serverDir, file);
  fs.copyFileSync(from, to);
  copied += 1;
}

console.log(`[repair-next-chunks] Copied ${copied} chunk file(s) to .next/server.`);
