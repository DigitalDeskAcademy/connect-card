import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    // Verify database connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "healthy",
      timestamp,
      database: "connected",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp,
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
