import { NextResponse } from "next/server";
import { ingestConversion } from "@/domains/tracking/service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = await ingestConversion(body);
    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal error" }, { status: 500 });
  }
}
