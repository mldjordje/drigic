import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { isCronAuthorized } from "@/lib/cron/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (process.env.NODE_ENV === "production" && !isCronAuthorized(request)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Unauthorized",
      },
      { status: 401 }
    );
  }

  try {
    const sql = getSql();
    const result = await sql`SELECT NOW() as now`;

    return NextResponse.json({
      ok: true,
      timestamp: result?.[0]?.now ?? null,
      provider: "Neon (Vercel Postgres)",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        provider: "Neon (Vercel Postgres)",
        message: "Database connection failed.",
      },
      { status: 500 }
    );
  }
}
