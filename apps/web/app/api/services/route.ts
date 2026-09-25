import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const services = await getDb().service.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(
    services.map((s) => ({ id: s.id, name: s.name, price: s.price, durationMin: s.durationMin })),
  );
}
