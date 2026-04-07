"use client";

import { usePathname } from "next/navigation";
import { CLINIC_PHONE_DISPLAY, CLINIC_PHONE_TEL } from "@/lib/clinicContact";

export default function ClinicCallFab() {
  const pathname = usePathname() || "";
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <a
      href={`tel:${CLINIC_PHONE_TEL}`}
      className="clinic-call-fab"
      title={`Pozovite: ${CLINIC_PHONE_DISPLAY}`}
      aria-label={`Pozovi ordinaciju, broj ${CLINIC_PHONE_DISPLAY}`}
    >
      <i className="fas fa-phone" aria-hidden />
    </a>
  );
}
