import { NextResponse } from "next/server";

import { getVehicleControlState } from "@/lib/vehicle-control-store";

export async function GET() {
  return NextResponse.json(getVehicleControlState());
}

