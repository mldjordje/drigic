import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api/http";
import { resolveQuote } from "@/lib/booking/engine";

export const runtime = "nodejs";

const payloadSchema = z.object({
  serviceIds: z.array(z.string().uuid()).optional(),
  serviceSelections: z
    .array(
      z.object({
        serviceId: z.string().uuid(),
        quantity: z.number().int().min(1).optional(),
        brand: z.string().min(1).max(80).optional(),
      })
    )
    .optional(),
});

export async function POST(request) {
  const body = await readJson(request);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  try {
    const input =
      parsed.data.serviceSelections?.length
        ? parsed.data.serviceSelections
        : parsed.data.serviceIds || [];
    const quote = await resolveQuote(input, { requireHyaluronicBrand: true });
    return ok({ ok: true, ...quote, currency: "EUR" });
  } catch (error) {
    return fail(400, error.message);
  }
}
