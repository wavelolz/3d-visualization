import { NextResponse } from "next/server";

import { setTurnDirection } from "@/lib/vehicle-control-store";
import { type TurnDirection } from "@/lib/vehicle-control";

function isTurnDirection(value: unknown): value is TurnDirection {
  return value === "left" || value === "right" || value === null;
}

export async function POST(request: Request) {
  const body = (await request.json()) as { direction?: unknown };

  if (!isTurnDirection(body.direction)) {
    return NextResponse.json(
      { error: "`direction` must be `left`, `right`, or null." },
      { status: 400 },
    );
  }

  return NextResponse.json(setTurnDirection(body.direction));
}
