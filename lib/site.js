import { env } from "@/lib/env";

const DEFAULT_SITE_URL = "https://drigic.rs";
const DEFAULT_DEV_SITE_URL = "http://localhost:3000";

export const SITE_NAME = "Dr Igić Clinic";
export const SITE_DESCRIPTION = "Ordinacija estetske, anti-age i regenerativne medicine.";
export const SITE_TITLE_TEMPLATE = `%s | ${SITE_NAME}`;
export const ADMIN_SITE_NAME = `${SITE_NAME} Admin`;

function normalizeUrlValue(value) {
  const normalized = String(value || "").trim().replace(/\/+$/, "");
  if (!normalized) {
    return "";
  }

  try {
    return new URL(normalized).toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

function isLocalhostUrl(value) {
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function getConfiguredSiteUrl() {
  const candidates = [
    env.NEXT_PUBLIC_SITE_URL,
    env.APP_URL,
    env.NEXT_PUBLIC_APP_URL,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeUrlValue(candidate);
    if (!normalized) {
      continue;
    }
    if (env.NODE_ENV === "production" && isLocalhostUrl(normalized)) {
      continue;
    }
    return normalized;
  }

  return env.NODE_ENV === "production" ? DEFAULT_SITE_URL : DEFAULT_DEV_SITE_URL;
}

export function getMetadataBase() {
  return new URL(getConfiguredSiteUrl());
}
