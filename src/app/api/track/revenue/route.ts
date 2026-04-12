import { NextResponse } from "next/server";
import { ingestRevenue } from "@/domains/tracking/service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = await ingestRevenue(body);
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}
