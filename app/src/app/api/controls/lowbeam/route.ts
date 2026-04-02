import { NextResponse } from "next/server";

import { setLowbeam } from "@/lib/vehicle-control-store";

export async function POST(request: Request) {
  const body = (await request.json()) as { on?: unknown };

  if (typeof body.on !== "boolean") {
    return NextResponse.json(
      { error: "`on` must be a boolean." },
      { status: 400 },
    );
  }

  return NextResponse.json(setLowbeam(body.on));
}

