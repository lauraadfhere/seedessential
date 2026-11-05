import { NextResponse } from "next/server";
import { getParseAdmin } from "@/lib/parse/admin";
import { cleanString } from "@/lib/parse/marketplace";
import { moderateText } from "@/lib/moderation";

export const dynamic = "force-dynamic";

const TOPICS = ["General question", "Order support", "Expert consultation", "Business enquiry"];

/** POST /api/contact — stores a message from the contact form for the support team. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = cleanString(body.name, 120);
  const email = cleanString(body.email, 160);
  const topic = TOPICS.includes(body.topic) ? body.topic : TOPICS[0];
  const message = moderateText(cleanString(body.message, 3000));

  if (!name) return NextResponse.json({ error: "Enter your name." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  if (!message.text) return NextResponse.json({ error: "Write your message." }, { status: 400 });

  try {
    const Parse = getParseAdmin();
    const item = new (Parse.Object.extend("ContactMessage"))();
    item.set({ name, email, topic, message: message.text, status: message.hold ? "pending" : "new", moderationFlags: message.flags });
    await item.save(null, { useMasterKey: true });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Error saving contact message:", error);
    return NextResponse.json({ error: "Could not send your message. Please try again." }, { status: 500 });
  }
}
