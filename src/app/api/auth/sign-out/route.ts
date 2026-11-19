import { NextResponse } from "next/server";
import { createSessionClient } from "@/lib/appwrite/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim();
  if (!token) return NextResponse.json({ ok: true });
  try {
    await createSessionClient(token).account.deleteSession("current");
  } catch {
    /* already expired */
  }
  return NextResponse.json({ ok: true });
}
