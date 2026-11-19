import { NextResponse } from "next/server";
import { getParseAdmin } from "@/lib/parse/admin";
import { requireUser } from "@/lib/parse/require-admin";
import { cleanString } from "@/lib/parse/marketplace";
import { moderateText } from "@/lib/moderation";

export const dynamic = "force-dynamic";

const PROBLEM_CLASS = "Problem";
const OFFER_CLASS = "ProblemOffer";
const KINDS = ["suggestion", "equipment", "bid"];

type Attachment = { name: string; url: string; publicId?: string; type?: string; size?: number };

function cleanAttachments(input: unknown): Attachment[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is Attachment => Boolean(item) && typeof item.url === "string" && item.url.startsWith("https://"))
    .slice(0, 5)
    .map((item) => ({ name: cleanString(item.name, 120), url: item.url, publicId: cleanString(item.publicId, 200), type: cleanString(item.type, 80), size: Number(item.size) || 0 }));
}

/** GET /api/problems — public board of problems, with their offers. Anyone may read. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = cleanString(url.searchParams.get("id"), 40);
  const Parse = getParseAdmin();

  try {
    const query = new Parse.Query(PROBLEM_CLASS);
    if (id) query.equalTo("objectId", id);
    query.notEqualTo("moderationStatus", "hidden");
    const problems = await query.include("author").descending("createdAt").limit(id ? 1 : 50).find({ useMasterKey: true });
    const offers = problems.length
      ? await new Parse.Query(OFFER_CLASS)
          .containedIn("problem", problems)
          .include("author")
          .ascending("createdAt")
          .limit(500)
          .find({ useMasterKey: true })
      : [];

    const offersByProblem = new Map<string, unknown[]>();
    for (const offer of offers) {
      const key = (offer.get("problem")?.id ?? "") as string;
      const list = offersByProblem.get(key) ?? [];
      list.push({
        id: offer.id,
        kind: offer.get("kind"),
        message: offer.get("message") ?? "",
        priceDzd: offer.get("priceDzd") ?? null,
        authorName: offer.get("author")?.get("name") ?? offer.get("author")?.get("username") ?? "Member",
        createdAt: offer.createdAt?.toISOString(),
      });
      offersByProblem.set(key, list);
    }

    return NextResponse.json(
      problems.map((problem) => ({
        id: problem.id,
        title: problem.get("title"),
        body: problem.get("body") ?? "",
        category: problem.get("category") ?? "",
        budgetDzd: problem.get("budgetDzd") ?? null,
        attachments: problem.get("attachments") ?? [],
        authorName: problem.get("author")?.get("name") ?? problem.get("author")?.get("username") ?? "Member",
        createdAt: problem.createdAt?.toISOString(),
        offers: offersByProblem.get(problem.id ?? "") ?? [],
      })),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Error loading problems:", error);
    return NextResponse.json({ error: "Could not load the problems board." }, { status: 500 });
  }
}

/**
 * POST /api/problems — a signed-in member posts a problem, or an offer on one.
 * Problem: { title, body, category, budgetDzd, attachments }
 * Offer:   { action: "offer", problemId, kind: "suggestion" | "equipment" | "bid", message, priceDzd }
 */
export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to post on the board." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const Parse = getParseAdmin();

  if (body.action === "offer") {
    const problemId = cleanString(body.problemId, 40);
    const kind = KINDS.includes(body.kind) ? body.kind : null;
    const message = moderateText(cleanString(body.message, 2000));
    const priceDzd = body.priceDzd === "" || body.priceDzd == null ? null : Math.round(Number(body.priceDzd));

    if (!problemId) return NextResponse.json({ error: "Choose a problem to reply to." }, { status: 400 });
    if (!kind) return NextResponse.json({ error: "Choose a suggestion, equipment or bid." }, { status: 400 });
    if (!message.text) return NextResponse.json({ error: "Write your suggestion or offer." }, { status: 400 });
    if (kind === "bid" && (!priceDzd || priceDzd <= 0)) return NextResponse.json({ error: "Enter a price for your bid." }, { status: 400 });

    const problem = await new Parse.Query(PROBLEM_CLASS).get(problemId, { useMasterKey: true }).catch(() => undefined);
    if (!problem) return NextResponse.json({ error: "Problem not found." }, { status: 404 });

    try {
      const offer = new (Parse.Object.extend(OFFER_CLASS))();
      offer.set({ problem, author: user, kind, message: message.text, priceDzd: kind === "bid" ? priceDzd : null, moderationFlags: message.flags, status: message.hold ? "pending" : "open" });
      await offer.save(null, { useMasterKey: true });
      return NextResponse.json({ ok: true, id: offer.id, held: message.hold }, { status: 201 });
    } catch (error) {
      console.error("Error saving problem offer:", error);
      return NextResponse.json({ error: "Could not send your reply. Please try again." }, { status: 500 });
    }
  }

  const title = cleanString(body.title, 160);
  const description = moderateText(cleanString(body.body, 5000));
  const category = cleanString(body.category, 60);
  const budgetDzd = body.budgetDzd === "" || body.budgetDzd == null ? null : Math.round(Number(body.budgetDzd));
  const attachments = cleanAttachments(body.attachments);

  if (!title) return NextResponse.json({ error: "Give your problem a short title." }, { status: 400 });
  if (!description.text) return NextResponse.json({ error: "Describe the problem." }, { status: 400 });

  try {
    const problem = new (Parse.Object.extend(PROBLEM_CLASS))();
    problem.set({ author: user, title, body: description.text, category, budgetDzd: budgetDzd && budgetDzd > 0 ? budgetDzd : null, attachments, moderationStatus: description.hold ? "pending" : "visible", moderationFlags: description.flags });
    await problem.save(null, { useMasterKey: true });
    return NextResponse.json({ ok: true, id: problem.id, held: description.hold }, { status: 201 });
  } catch (error) {
    console.error("Error saving problem:", error);
    return NextResponse.json({ error: "Could not post your problem. Please try again." }, { status: 500 });
  }
}
