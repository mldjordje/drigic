import { put } from "@vercel/blob";
import { env } from "@/lib/env";

const INLINE_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

async function fileToDataUrl(file) {
  if (!file?.type?.startsWith("image/")) {
    throw new Error("Upload fajla bez Blob tokena je podrzan samo za slike.");
  }

  if (typeof file.size === "number" && file.size > INLINE_IMAGE_MAX_BYTES) {
    throw new Error("Slika je prevelika za direktan upload. Smanjite fajl ili podesite Blob token.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${buffer.toString("base64")}`;
}

export async function uploadOptionalFile(file, pathnamePrefix) {
  if (!file || typeof file === "string") {
    return null;
  }

  if (!env.BLOB_READ_WRITE_TOKEN) {
    return fileToDataUrl(file);
  }

  const safeName = file.name?.replace(/\s+/g, "-").toLowerCase() || "upload.bin";
  const pathname = `${pathnamePrefix}/${Date.now()}-${safeName}`;

  try {
    const uploaded = await put(pathname, file, {
      access: "public",
      token: env.BLOB_READ_WRITE_TOKEN,
    });

    return uploaded.url;
  } catch {
    return fileToDataUrl(file);
  }
}
