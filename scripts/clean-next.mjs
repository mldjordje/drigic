import fs from "node:fs";
import path from "node:path";

const nextDir = path.join(process.cwd(), ".next");

try {
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log("[clean-next] Removed .next cache directory.");
  } else {
    console.log("[clean-next] .next not found, nothing to clean.");
  }
} catch (error) {
  console.warn("[clean-next] Failed to remove .next:", error?.message || error);
}
