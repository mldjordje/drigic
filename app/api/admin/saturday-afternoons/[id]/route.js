import { eq } from "drizzle-orm";
import { fail, ok } from "@/lib/api/http";
import { requireAdmin } from "@/lib/auth/guards";
import { getDb, schema } from "@/lib/db/client";

export const runtime = "nodejs";

function getPgCode(error) {
  return String(error?.code || error?.cause?.code || "");
}

export async function DELETE(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return auth.error;
  }

  const db = getDb();

  try {
    const [deletedRecord] = await db
      .delete(schema.saturdayAfternoonActivations)
      .where(eq(schema.saturdayAfternoonActivations.id, params.id))
      .returning();

    if (!deletedRecord) {
      return fail(404, "Aktivacija nije pronađena.");
    }

    return ok({ ok: true, data: deletedRecord });
  } catch (error) {
    if (getPgCode(error) === "42P01") {
      return fail(500, "Database schema mismatch. Run latest migrations.");
    }
    return fail(500, error?.message || "Neuspešno brisanje aktivacije.");
  }
}

