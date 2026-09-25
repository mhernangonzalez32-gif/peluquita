import { healthPayload } from "@peluquita/shared";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(healthPayload());
}
