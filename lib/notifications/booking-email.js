import { getConfiguredSiteUrl } from "@/lib/site";

function toAbsoluteUrl(path) {
  if (!path) {
    return getConfiguredSiteUrl();
  }
  return new URL(path, getConfiguredSiteUrl()).toString();
}

export function formatBookingDateTime(value) {
  return new Date(value).toLocaleString("sr-RS", {
    timeZone: "Europe/Belgrade",
    dateStyle: "full",
    timeStyle: "short",
  });
}

function buildBookingSections({
  startsAt,
  serviceSummary,
  durationMin,
  priceRsd,
  statusLabel,
  notes,
  cancellationReason,
  extraSections = [],
}) {
  return [
    {
      label: "Termin",
      value: formatBookingDateTime(startsAt),
    },
    {
      label: "Usluge",
      value: serviceSummary || "-",
    },
    {
      label: "Trajanje",
      value: durationMin ? `${durationMin} min` : "-",
    },
    {
      label: "Iznos",
      value: Number.isFinite(Number(priceRsd)) ? `${Number(priceRsd)} EUR` : "-",
    },
    statusLabel
      ? {
          label: "Status",
          value: statusLabel,
        }
      : null,
    notes
      ? {
          label: "Napomena",
          value: notes,
        }
      : null,
    cancellationReason
      ? {
          label: "Razlog otkazivanja",
          value: cancellationReason,
        }
      : null,
    ...extraSections,
  ].filter(Boolean);
}

export function buildClientBookingEmail({
  subject,
  previewText,
  heading,
  intro,
  startsAt,
  serviceSummary,
  durationMin,
  priceRsd,
  statusLabel,
  notes,
  cancellationReason,
  ctaLabel = "Otvorite svoj Beauty Pass",
  ctaPath = "/beauty-pass",
  footerLines = [],
}) {
  return {
    subject,
    previewText,
    heading,
    intro,
    sections: buildBookingSections({
      startsAt,
      serviceSummary,
      durationMin,
      priceRsd,
      statusLabel,
      notes,
      cancellationReason,
    }),
    ctaLabel,
    ctaUrl: toAbsoluteUrl(ctaPath),
    footerLines: [
      "Ako imate pitanje ili zelite izmenu termina, odgovorite na ovaj email ili nas pozovite.",
      ...footerLines,
    ],
  };
}

export function buildAdminBookingEmail({
  subject,
  previewText,
  heading,
  intro,
  startsAt,
  serviceSummary,
  durationMin,
  priceRsd,
  statusLabel,
  notes,
  cancellationReason,
  clientName,
  clientEmail,
  clientPhone,
  actorLabel,
  ctaLabel = "Otvorite admin kalendar",
  ctaPath = "/admin/kalendar",
  footerLines = [],
}) {
  const extraSections = [
    {
      label: "Klijent",
      value: clientName || "-",
    },
    {
      label: "Email klijenta",
      value: clientEmail || "-",
    },
    {
      label: "Telefon klijenta",
      value: clientPhone || "-",
    },
    actorLabel
      ? {
          label: "Akciju pokrenuo",
          value: actorLabel,
        }
      : null,
  ].filter(Boolean);

  return {
    subject,
    previewText,
    heading,
    intro,
    sections: buildBookingSections({
      startsAt,
      serviceSummary,
      durationMin,
      priceRsd,
      statusLabel,
      notes,
      cancellationReason,
      extraSections,
    }),
    ctaLabel,
    ctaUrl: toAbsoluteUrl(ctaPath),
    footerLines,
  };
}
