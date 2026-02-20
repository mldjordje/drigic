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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const day = searchParams.get("date");
  const month = searchParams.get("month");
  const serviceIds = parseServiceIds(searchParams.get("serviceIds") || "");

  if (!day && !month) {
    return fail(400, "Provide either date=YYYY-MM-DD or month=YYYY-MM.");
  }

  try {
    if (month) {
      const data = await getAvailabilityByMonth({ month, serviceIds });
      return ok({ ok: true, mode: "month", ...data });
    }

    const data = await getAvailabilityByDay({ date: day, serviceIds });
    return ok({ ok: true, mode: "day", ...data });
  } catch (error) {
    return fail(400, error.message);
  }
}

