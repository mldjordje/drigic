import { z } from "zod";
import { fail, ok, readJson } from "@/lib/api/http";
import { resolveQuote } from "@/lib/booking/engine";

export const runtime = "nodejs";

const payloadSchema = z.object({
  serviceIds: z.array(z.string().uuid()).min(1),
});

export async function POST(request) {
  const body = await readJson(request);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Invalid payload", parsed.error.flatten());
  }

  try {
    const quote = await resolveQuote(parsed.data.serviceIds);
    return ok({ ok: true, ...quote, currency: "RSD" });
  } catch (error) {
    return fail(400, error.message);
  }
}

