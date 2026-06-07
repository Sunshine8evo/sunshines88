import { NextResponse } from "next/server";

import { addStaffSeat, removeStaffSeat } from "@/lib/billing/staff-seats";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { tenantId?: string };
    if (!body.tenantId) {
      return NextResponse.json({ error: "tenantId is required." }, { status: 400 });
    }
    const result = await addStaffSeat(body.tenantId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/staff:", error);
    return NextResponse.json({ error: "Unable to add staff seat." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { tenantId?: string };
    if (!body.tenantId) {
      return NextResponse.json({ error: "tenantId is required." }, { status: 400 });
    }
    const result = await removeStaffSeat(body.tenantId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("DELETE /api/staff:", error);
    return NextResponse.json({ error: "Unable to remove staff seat." }, { status: 500 });
  }
}
