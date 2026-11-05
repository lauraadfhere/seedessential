#!/usr/bin/env node
/**
 * Provisions every Parse class Tannelli needs in your Back4App / Parse app.
 *
 * Usage:
 *   yarn parse:schema
 *   (equivalent to: node --env-file=.env.local scripts/parse-schema.mjs)
 *
 * Requires PARSE_MASTER_KEY, NEXT_PUBLIC_PARSE_APP_ID, NEXT_PUBLIC_PARSE_JS_KEY
 * and NEXT_PUBLIC_PARSE_SERVER_URL to be set (see .env.example).
 *
 * Safe to re-run: existing classes are updated in place (new fields are
 * added; it never deletes fields or data).
 */
import Parse from "parse/node";

const appId = process.env.NEXT_PUBLIC_PARSE_APP_ID;
const jsKey = process.env.NEXT_PUBLIC_PARSE_JS_KEY;
const masterKey = process.env.PARSE_MASTER_KEY;
const serverURL = process.env.NEXT_PUBLIC_PARSE_SERVER_URL;

if (!appId || !jsKey || !masterKey || !serverURL) {
  console.error(
    "Missing Parse env vars. Make sure .env.local has NEXT_PUBLIC_PARSE_APP_ID, " +
      "NEXT_PUBLIC_PARSE_JS_KEY, PARSE_MASTER_KEY and NEXT_PUBLIC_PARSE_SERVER_URL set.",
  );
  process.exit(1);
}

Parse.initialize(appId, jsKey, masterKey);
Parse.serverURL = serverURL;

function addField(schema, fieldName, def) {
  const { type, targetClass, required = false } = def;
  switch (type) {
    case "String":
      schema.addString(fieldName, { required });
      break;
    case "Number":
      schema.addNumber(fieldName, { required });
      break;
    case "Boolean":
      schema.addBoolean(fieldName, { required });
      break;
    case "Date":
      schema.addDate(fieldName, { required });
      break;
    case "Array":
      schema.addArray(fieldName, { required });
      break;
    case "Object":
      schema.addObject(fieldName, { required });
      break;
    case "Pointer":
      schema.addPointer(fieldName, targetClass, { required });
      break;
    case "Relation":
      schema.addRelation(fieldName, targetClass);
      break;
    case "File":
      schema.addFile(fieldName, { required });
      break;
    default:
      throw new Error(`Unknown field type "${type}" for field "${fieldName}"`);
  }
}

async function upsertClass(name, fields) {
  const schema = new Parse.Schema(name);
  let exists = true;
  let existingFields = {};
  try {
    existingFields = (await schema.get({ useMasterKey: true }))?.fields ?? {};
  } catch {
    exists = false;
  }

  const missing = Object.entries(fields).filter(([fieldName]) => !(fieldName in existingFields));
  for (const [fieldName, def] of missing) {
    addField(schema, fieldName, def);
  }

  if (exists && missing.length === 0) {
    console.log(`  ok       ${name}`);
    return;
  }
  if (exists) {
    await schema.update({ useMasterKey: true });
    console.log(`  updated  ${name}`);
  } else {
    await schema.save({ useMasterKey: true });
    console.log(`  created  ${name}`);
  }
}

const classes = [
  [
    "Category",
    {
      name: { type: "String", required: true },
      slug: { type: "String", required: true },
      kind: { type: "String", required: true }, // "plant" | "equipment"
    },
  ],
  [
    "Product",
    {
      name: { type: "String", required: true },
      slug: { type: "String", required: true },
      kind: { type: "String", required: true },
      category: { type: "Pointer", targetClass: "Category", required: true },
        price: { type: "Number", required: true },
        priceDZD: { type: "Number" },
      currency: { type: "String" },
      rating: { type: "Number" },
      reviewsCount: { type: "Number" },
      shortDescription: { type: "String" },
      description: { type: "String" },
      inStock: { type: "Boolean" },
      featured: { type: "Boolean" },
      availableForExpertRequests: { type: "Boolean" },
      difficulty: { type: "String" },
      light: { type: "String" },
      climate: { type: "String" },
      care: { type: "String" },
      usage: { type: "String" },
      specs: { type: "Array" }, // [{ label, value }]
      images: { type: "Array" }, // Cloudinary public IDs
      pdfSpecSheet: { type: "String" }, // Cloudinary public ID
      originWilaya: { type: "String" },
      coverageWilayas: { type: "Array" },
      visibilityStatus: { type: "String" }, // published | pending | rejected
      provider: { type: "Pointer", targetClass: "_User" },
      companyName: { type: "String" },
    },
  ],
  [
    "Address",
    {
      user: { type: "Pointer", targetClass: "_User", required: true },
      label: { type: "String" },
      line1: { type: "String", required: true },
      line2: { type: "String" },
      city: { type: "String", required: true },
      region: { type: "String" },
      postalCode: { type: "String", required: true },
      country: { type: "String", required: true },
      isDefault: { type: "Boolean" },
    },
  ],
  [
    "ExpertProfile",
    {
      user: { type: "Pointer", targetClass: "_User", required: true },
      name: { type: "String" },
      slug: { type: "String", required: true },
      avatar: { type: "String" }, // Cloudinary public ID
      professionalCategory: { type: "String", required: true },
      specialties: { type: "Array" },
      bio: { type: "String" },
      experienceYears: { type: "Number" },
      qualifications: { type: "String" },
      languages: { type: "Array" },
      location: { type: "String" }, // home wilaya
      coverageWilayas: { type: "Array" },
      online: { type: "Boolean" },
      consultationPrice: { type: "Number" },
      rating: { type: "Number" },
      reviewsCount: { type: "Number" },
      completedRequests: { type: "Number" },
      availability: { type: "Object" },
      verificationDocuments: { type: "Array" },
      verifiedAt: { type: "Date" },
      verifiedBy: { type: "Pointer", targetClass: "_User" },
      rejectionReason: { type: "String" },
      status: { type: "String" }, // pending/active/rejected/suspended
      trustScore: { type: "Number" },
      trustTier: { type: "String" },
      trustSignals: { type: "Array" },
      trustPenalties: { type: "Array" },
      trustUpdatedAt: { type: "Date" },
    },
  ],
  [
    "ExpertService",
    {
      expert: { type: "Pointer", targetClass: "ExpertProfile", required: true },
      serviceType: { type: "String", required: true }, // 30_min/60_min/written_diagnosis/garden_design/care_plan/full_project
      title: { type: "String", required: true },
      price: { type: "Number", required: true },
      durationMinutes: { type: "Number" },
      active: { type: "Boolean" },
    },
  ],
  [
    "ConsultationRequest",
    {
      customer: { type: "Pointer", targetClass: "_User", required: true },
      preferredExpert: { type: "Pointer", targetClass: "ExpertProfile" },
      assignedExpert: { type: "Pointer", targetClass: "ExpertProfile" },
      status: { type: "String", required: true }, // submitted/open/matched/answered/completed/cancelled/rejected
      title: { type: "String" },
      category: { type: "String" },
      mode: { type: "String" }, // online/onsite
      urgency: { type: "String" }, // normal/soon/urgent
      wilaya: { type: "String" },
      location: { type: "String" },
      plantType: { type: "String" },
      objective: { type: "String", required: true },
      spaceDetails: { type: "String" },
      areaSize: { type: "String" },
      sunExposure: { type: "String" },
      soilInfo: { type: "String" },
      waterAvailability: { type: "String" },
      budget: { type: "Number" },
      photos: { type: "Array" }, // Cloudinary public IDs
      declinedBy: { type: "Array" }, // ExpertProfile IDs
      acceptedAt: { type: "Date" },
      answeredAt: { type: "Date" },
      completedAt: { type: "Date" },
      recommendation: { type: "String" },
      maintenancePlan: { type: "String" },
      estimatedBudget: { type: "Number" },
      recommendedProducts: { type: "Array" }, // [{ slug, name, note, providerName }]
      recommendedSlugs: { type: "Array" },
      rating: { type: "Number" },
      review: { type: "String" },
      moderationStatus: { type: "String" }, // approved/pending/rejected
      moderationFlags: { type: "Array" },
      moderationNote: { type: "String" },
      moderationReviewed: { type: "Boolean" },
    },
  ],
  [
    "RequestMessage",
    {
      request: { type: "Pointer", targetClass: "ConsultationRequest", required: true },
      author: { type: "Pointer", targetClass: "_User", required: true },
      authorRole: { type: "String" },
      body: { type: "String" },
      attachments: { type: "Array" }, // Cloudinary public IDs
      system: { type: "Boolean" },
      hidden: { type: "Boolean" },
      flagged: { type: "Boolean" },
      moderationFlags: { type: "Array" },
      moderationReviewed: { type: "Boolean" },
      reportedBy: { type: "Array" },
    },
  ],
  [
    "Consultation",
    {
      request: { type: "Pointer", targetClass: "ConsultationRequest", required: true },
      service: { type: "Pointer", targetClass: "ExpertService", required: true },
      scheduledAt: { type: "Date" },
      meetingUrl: { type: "String" },
      status: { type: "String", required: true }, // booked/completed/cancelled/no_show
      recommendation: { type: "String" },
      maintenanceSchedule: { type: "Object" },
      estimatedBudget: { type: "Number" },
    },
  ],
  [
    "Cart",
    {
      user: { type: "Pointer", targetClass: "_User", required: true },
      currency: { type: "String" },
    },
  ],
  [
    "CartItem",
    {
      cart: { type: "Pointer", targetClass: "Cart", required: true },
      productVariant: { type: "Pointer", targetClass: "ProductVariant", required: true },
      quantity: { type: "Number", required: true },
    },
  ],
  [
    "ProductVariant",
    {
      product: { type: "Pointer", targetClass: "Product", required: true },
      sku: { type: "String", required: true },
      name: { type: "String" },
      price: { type: "Number", required: true },
      priceDzd: { type: "Number" },
      stockQty: { type: "Number" },
      attributes: { type: "Object" },
    },
  ],
  [
    "Order",
    {
      user: { type: "Pointer", targetClass: "_User", required: true },
      address: { type: "Pointer", targetClass: "Address" },
      orderNumber: { type: "String", required: true },
      status: { type: "String", required: true }, // pending/paid/processing/shipped/delivered/cancelled/refunded
      currency: { type: "String", required: true },
      total: { type: "Number", required: true },
      paymentStatus: { type: "String", required: true }, // unpaid/authorized/paid/failed/refunded
      paymentMethod: { type: "String" },
      idempotencyKey: { type: "String" },
    },
  ],
  [
    "OrderItem",
    {
      order: { type: "Pointer", targetClass: "Order", required: true },
      productVariant: { type: "Pointer", targetClass: "ProductVariant" },
      seller: { type: "Pointer", targetClass: "BusinessAccount" },
      nameSnapshot: { type: "String", required: true },
      skuSnapshot: { type: "String" },
      unitPrice: { type: "Number", required: true },
      quantity: { type: "Number", required: true },
      total: { type: "Number", required: true },
    },
  ],
  [
    "Payment",
    {
      order: { type: "Pointer", targetClass: "Order" },
      user: { type: "Pointer", targetClass: "_User", required: true },
      provider: { type: "String", required: true },
      providerPaymentId: { type: "String" },
      amount: { type: "Number", required: true },
      currency: { type: "String", required: true },
      status: { type: "String", required: true }, // pending/paid/failed/refunded
    },
  ],
  [
    "Delivery",
    {
      order: { type: "Pointer", targetClass: "Order", required: true },
      carrier: { type: "String" },
      trackingNumber: { type: "String" },
      trackingUrl: { type: "String" },
      status: { type: "String" },
      estimatedDelivery: { type: "Date" },
      deliveredAt: { type: "Date" },
    },
  ],
  [
    "Project",
    {
      user: { type: "Pointer", targetClass: "_User", required: true },
      name: { type: "String", required: true },
      projectType: { type: "String" }, // balcony/backyard/vegetable_garden/orchard/indoor/farm/other
      location: { type: "String" },
      budget: { type: "Number" },
      progress: { type: "Number" },
      notes: { type: "String" },
    },
  ],
  [
    "ProjectTask",
    {
      project: { type: "Pointer", targetClass: "Project", required: true },
      title: { type: "String", required: true },
      dueDate: { type: "Date" },
      taskType: { type: "String" }, // planting/watering/feeding/pruning/maintenance/other
      completedAt: { type: "Date" },
    },
  ],
  [
    "Wishlist",
    {
      user: { type: "Pointer", targetClass: "_User", required: true },
      product: { type: "Pointer", targetClass: "Product", required: true },
    },
  ],
  [
    "GuideArticle",
    {
      title: { type: "String", required: true },
      slug: { type: "String", required: true },
      category: { type: "String" },
      excerpt: { type: "String" },
      body: { type: "String" },
      minutesToRead: { type: "Number" },
      coverImage: { type: "String" }, // Cloudinary public ID
      pdfAttachment: { type: "String" }, // Cloudinary public ID
      locale: { type: "String" }, // en/fr/ar
      publishedAt: { type: "Date" },
    },
  ],
  [
    "Review",
    {
      user: { type: "Pointer", targetClass: "_User", required: true },
      product: { type: "Pointer", targetClass: "Product" },
      expert: { type: "Pointer", targetClass: "ExpertProfile" },
      rating: { type: "Number", required: true },
      body: { type: "String" },
      status: { type: "String" }, // pending/published/rejected
      moderatedBy: { type: "Pointer", targetClass: "_User" },
    },
  ],
  [
    "ProductQuestion",
    {
      product: { type: "Pointer", targetClass: "Product", required: true },
      user: { type: "Pointer", targetClass: "_User", required: true },
      question: { type: "String", required: true },
      answer: { type: "String" },
      answeredBy: { type: "Pointer", targetClass: "_User" },
      status: { type: "String" }, // pending/published/hidden
    },
  ],
  [
    "Promotion",
    {
      code: { type: "String" },
      description: { type: "String" },
      discountType: { type: "String", required: true }, // percent/fixed
      discountValue: { type: "Number", required: true },
      startsAt: { type: "Date" },
      endsAt: { type: "Date" },
      usageLimit: { type: "Number" },
      active: { type: "Boolean" },
    },
  ],
  [
    "SupportTicket",
    {
      user: { type: "Pointer", targetClass: "_User", required: true },
      order: { type: "Pointer", targetClass: "Order" },
      subject: { type: "String", required: true },
      body: { type: "String", required: true },
      status: { type: "String", required: true }, // open/in_progress/resolved/closed
      priority: { type: "String" }, // low/normal/high/urgent
    },
  ],
  [
    "BusinessAccount",
    {
      user: { type: "Pointer", targetClass: "_User", required: true },
      companyName: { type: "String", required: true },
      companyType: { type: "String" },
      vatNumber: { type: "String" },
      contactPhone: { type: "String" },
      description: { type: "String" },
      logo: { type: "String" },
      website: { type: "String" },
      address: { type: "String" },
      wilaya: { type: "String" },
      coverageWilayas: { type: "Array" },
      registryNumber: { type: "String" },
      verificationStatus: { type: "String" },
      verificationDocuments: { type: "Array" },
      rejectionReason: { type: "String" },
      trustScore: { type: "Number" },
      trustTier: { type: "String" },
      trustSignals: { type: "Array" },
      trustPenalties: { type: "Array" },
      trustUpdatedAt: { type: "Date" },
    },
  ],
  [
    "RuddgeThread",
    {
      user: { type: "Pointer", targetClass: "_User", required: true },
      title: { type: "String" },
      plant: { type: "String" },
      locale: { type: "String" },
    },
  ],
  [
    "RuddgeMessage",
    {
      thread: { type: "Pointer", targetClass: "RuddgeThread", required: true },
      author: { type: "Pointer", targetClass: "_User" },
      role: { type: "String", required: true }, // user | assistant
      body: { type: "String" },
      photos: { type: "Array" },
      model: { type: "String" },
      analysis: { type: "Object" },
    },
  ],
  [
    "_User",
    {
      role: { type: "String" }, // customer/expert/admin/business/provider
      locale: { type: "String" }, // en/fr/ar
      phone: { type: "String" },
      avatar: { type: "String" }, // Cloudinary public ID
      expertiseDomain: { type: "String" },
      specialties: { type: "Array" },
      companyName: { type: "String" },
      accountKind: { type: "String" },
      status: { type: "String" },
      wilaya: { type: "String" },
      bio: { type: "String" },
      farmSize: { type: "String" },
      mainCrops: { type: "Array" },
      gardenType: { type: "String" },
      interests: { type: "Array" },
      profilePicture: { type: "String" },
      profilePicturePublicId: { type: "String" },
      suspensionReason: { type: "String" },
    },
  ],
];

async function main() {
  console.log(`Provisioning Parse schema at ${serverURL} ...\n`);
  for (const [name, fields] of classes) {
    await upsertClass(name, fields);
  }
  console.log("\nDone. Review Class-Level Permissions (CLPs) in your Back4App dashboard.");
}

main().catch((err) => {
  console.error("\nSchema provisioning failed:", err.message || err);
  process.exit(1);
});
