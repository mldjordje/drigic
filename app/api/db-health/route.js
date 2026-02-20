import { NextResponse } from "next/server";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
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

