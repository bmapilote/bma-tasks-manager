import { requireUser } from "@/lib/require-user";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
}
