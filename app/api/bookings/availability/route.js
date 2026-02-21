import { fail, ok } from "@/lib/api/http";
import {
  getAvailabilityByDay,
  getAvailabilityByMonth,
} from "@/lib/booking/engine";

export const runtime = "nodejs";

function parseServiceIds(queryString = "") {
  return queryString
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function parseServiceSelections(value = "") {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => ({
        serviceId: String(item?.serviceId || "").trim(),
        quantity: Number(item?.quantity || 1),
      }))
      .filter((item) => item.serviceId)
      .map((item) => ({
        serviceId: item.serviceId,
        quantity: Number.isFinite(item.quantity) ? Math.max(1, Math.floor(item.quantity)) : 1,
      }));
  } catch {
    return [];
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const day = searchParams.get("date");
  const month = searchParams.get("month");
  const serviceIds = parseServiceIds(searchParams.get("serviceIds") || "");
  const serviceSelections = parseServiceSelections(searchParams.get("serviceSelections") || "");

  if (!day && !month) {
    return fail(400, "Provide either date=YYYY-MM-DD or month=YYYY-MM.");
  }

  try {
    if (month) {
      const data = await getAvailabilityByMonth({ month, serviceIds, serviceSelections });
      return ok({ ok: true, mode: "month", ...data });
    }

    const data = await getAvailabilityByDay({ date: day, serviceIds, serviceSelections });
    return ok({ ok: true, mode: "day", ...data });
  } catch (error) {
    return fail(400, error.message);
  }
}
