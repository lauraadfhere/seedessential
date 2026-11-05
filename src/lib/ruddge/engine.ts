import "server-only";

import { cloudinaryImage } from "@/lib/cloudinary-client";

/** Text reasoning for follow-up chat. Confirmed on the NVIDIA hosted API. */
const TEXT_MODEL = "nvidia/nemotron-3-super-120b-a12b";
const TEXT_FALLBACK = "nvidia/nemotron-3.5-lightning-30b-a3b";
/** Vision model that reads plant photos. Falls back to Llama 3.2 90B vision. */
const VISION_MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";
const VISION_FALLBACK = "meta/llama-3.2-90b-vision-instruct";

const ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";

export type RuddgeAnalysis = {
  plant: string;
  confidence: "low" | "medium" | "high";
  symptoms: string[];
  likelyCauses: string[];
  care: string[];
  watchFor: string[];
  askExpert: boolean;
};

export type RuddgeTurn = {
  role: "user" | "assistant";
  body: string;
  photos?: string[];
};

export type RuddgeAnswer = {
  reply: string;
  analysis: RuddgeAnalysis | null;
  model: string;
};

type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

function systemPrompt(context: { role: string; wilaya?: string; crops?: string[]; catalog: string[] }) {
  const place = context.wilaya ? `The grower is in ${context.wilaya}, Algeria.` : "The grower is in Algeria.";
  const crops = context.crops?.length ? `They mainly grow: ${context.crops.join(", ")}.` : "";
  const catalog = context.catalog.length ? `Plants and supplies on the Tannelli market include: ${context.catalog.join(", ")}.` : "";
  return [
    "You are RuddgeAI, the plant diagnostic assistant for Tannelli, a marketplace that connects Algerian farmers, experts and equipment sellers.",
    "Answer growers and experts about plants they grow or can buy: identification, symptoms, likely causes, climate-aware care, and when a human expert should take over.",
    place,
    crops,
    catalog,
    "Prefer causes that are common in North-African and Mediterranean growing: heat, irregular watering, salinity, powdery mildew, aphids, whitefly, nutrient imbalance, transplant shock.",
    "When you name a product, prefer something a grower could find in a normal garden shop. Do not invent prices.",
    "Do not give instructions for cultivating, concentrating, or spreading pathogens or toxins. If someone asks for that, refuse in one sentence and suggest a verified expert.",
    "Reply with JSON only, no markdown fence, in this shape:",
    '{"reply":"short conversational answer","plant":"common name or unknown","confidence":"low|medium|high","symptoms":["..."],"likelyCauses":["..."],"care":["practical step"],"watchFor":["what would change the diagnosis"],"askExpert":true}',
    "Keep reply under 140 words. care has 2 to 4 concrete steps. If you cannot see enough, set confidence to low and askExpert to true.",
    `The person asking is a ${context.role}.`,
  ].filter(Boolean).join(" ");
}

function photoUrl(publicId: string) {
  if (/^https?:\/\//.test(publicId)) return publicId;
  return cloudinaryImage(publicId, { width: 768, crop: "limit", format: "jpg", quality: "auto" });
}

function asList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 6) : [];
}

export function parseAnalysis(raw: string): { reply: string; analysis: RuddgeAnalysis | null } {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced?.[1] ?? raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  try {
    const data = JSON.parse(candidate) as Record<string, unknown>;
    const confidence = data.confidence === "high" || data.confidence === "medium" ? data.confidence : "low";
    const reply = typeof data.reply === "string" && data.reply.trim() ? data.reply.trim() : raw.trim();
    return {
      reply,
      analysis: {
        plant: typeof data.plant === "string" ? data.plant.slice(0, 80) : "Unknown",
        confidence,
        symptoms: asList(data.symptoms),
        likelyCauses: asList(data.likelyCauses),
        care: asList(data.care),
        watchFor: asList(data.watchFor),
        askExpert: data.askExpert !== false,
      },
    };
  } catch {
    return { reply: raw.trim(), analysis: null };
  }
}

async function complete(model: string, messages: { role: string; content: string | ContentPart[] }[]) {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) throw new Error("RuddgeAI is not configured yet.");
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 900,
      chat_template_kwargs: { enable_thinking: false },
    }),
    signal: AbortSignal.timeout(55_000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `Model ${model} returned ${response.status}`;
    throw new Error(message);
  }
  const text = payload?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("The model returned an empty answer.");
  return text;
}

export async function askRuddge(input: {
  history: RuddgeTurn[];
  message: string;
  photos: string[];
  role: string;
  wilaya?: string;
  crops?: string[];
  catalog: string[];
}): Promise<RuddgeAnswer> {
  const system = systemPrompt(input);
  const prior = input.history.slice(-10).map((turn) => ({
    role: turn.role,
    content: turn.photos?.length ? `${turn.body}\n[photos attached: ${turn.photos.length}]` : turn.body,
  }));
  const hasPhotos = input.photos.length > 0;
  const latest: string | ContentPart[] = hasPhotos
    ? [
        { type: "text", text: input.message },
        ...input.photos.slice(0, 3).map((photo) => ({ type: "image_url" as const, image_url: { url: photoUrl(photo) } })),
      ]
    : input.message;

  const messages = [{ role: "system", content: system }, ...prior, { role: "user", content: latest }];
  const primary = hasPhotos ? VISION_MODEL : TEXT_MODEL;
  const fallback = hasPhotos ? VISION_FALLBACK : TEXT_FALLBACK;
  let raw: string;
  let model = primary;
  try {
    raw = await complete(primary, messages);
  } catch (error) {
    console.error("Ruddge primary model failed:", error instanceof Error ? error.message : error);
    model = fallback;
    raw = await complete(fallback, messages);
  }
  const parsed = parseAnalysis(raw);
  return { reply: parsed.reply, analysis: parsed.analysis, model };
}
