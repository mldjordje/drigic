import { put } from "@vercel/blob";
import { env } from "@/lib/env";

export async function uploadOptionalFile(file, pathnamePrefix) {
  if (!file || typeof file === "string") {
    return null;
  }

  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is missing.");
  }

  const safeName = file.name?.replace(/\s+/g, "-").toLowerCase() || "upload.bin";
  const pathname = `${pathnamePrefix}/${Date.now()}-${safeName}`;
  const uploaded = await put(pathname, file, {
    access: "public",
    token: env.BLOB_READ_WRITE_TOKEN,
  });

  return uploaded.url;
}

