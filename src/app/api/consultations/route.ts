import { NextResponse } from "next/server";
import { getParseAdmin } from "@/lib/parse/admin";
import { requireUser } from "@/lib/parse/require-admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/consultations - Retrieve user's consultations
 * Requires authentication
 */
export async function GET(request: Request) {
  try {
    const Parse = getParseAdmin();
    const user = await requireUser(request);
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const Consultation = Parse.Object.extend("Consultation");
    const query = new Parse.Query(Consultation);
    
    // Get consultations where user is either customer (via request) or expert
    const requestQuery = new Parse.Query("ConsultationRequest");
    requestQuery.equalTo("customer", user);
    query.matchesQuery("request", requestQuery);
    
    query.include("request");
    query.include("service");
    query.include("request.assignedExpert");
    query.include("request.assignedExpert.user");
    query.descending("scheduledAt");
    
    const consultations = await query.find({ useMasterKey: true });
    
    const serializedConsultations = consultations.map(consultation => ({
      id: consultation.id,
      requestId: consultation.get("request")?.id,
      serviceId: consultation.get("service")?.id,
      serviceType: consultation.get("service")?.get("serviceType"),
      serviceTitle: consultation.get("service")?.get("title"),
      scheduledAt: consultation.get("scheduledAt"),
      meetingUrl: consultation.get("meetingUrl"),
      status: consultation.get("status"),
      recommendation: consultation.get("recommendation"),
      maintenanceSchedule: consultation.get("maintenanceSchedule"),
      estimatedBudget: consultation.get("estimatedBudget"),
      expert: consultation.get("request")?.get("assignedExpert") ? {
        id: consultation.get("request")?.get("assignedExpert")?.id,
        name: consultation.get("request")?.get("assignedExpert")?.get("user")?.get("name"),
        professionalCategory: consultation.get("request")?.get("assignedExpert")?.get("professionalCategory"),
      } : null,
    }));

    return NextResponse.json(serializedConsultations);
  } catch (error) {
    console.error("Error fetching consultations:", error);
    return NextResponse.json({ error: "Failed to fetch consultations" }, { status: 500 });
  }
}

/**
 * POST /api/consultations - Book a consultation
 * Requires authentication
 */
export async function POST(request: Request) {
  try {
    const Parse = getParseAdmin();
    const user = await requireUser(request);
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, serviceId, scheduledAt } = body;

    if (!requestId || !serviceId) {
      return NextResponse.json({ error: "Request ID and service ID are required" }, { status: 400 });
    }

    // Verify the request belongs to the user
    const ConsultationRequest = Parse.Object.extend("ConsultationRequest");
    const requestQuery = new Parse.Query(ConsultationRequest);
    const consultationRequest = await requestQuery.get(requestId, { useMasterKey: true });
    
    if (!consultationRequest) {
      return NextResponse.json({ error: "Consultation request not found" }, { status: 404 });
    }

    if (consultationRequest.get("customer").id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get the service
    const ExpertService = Parse.Object.extend("ExpertService");
    const service = await new Parse.Query(ExpertService).get(serviceId, { useMasterKey: true });
    
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Create consultation
    const Consultation = Parse.Object.extend("Consultation");
    const consultation = new Consultation();
    
    consultation.set({
      request: consultationRequest,
      service,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      meetingUrl: "",
      status: "booked",
      recommendation: "",
      maintenanceSchedule: null,
      estimatedBudget: 0,
    });

    await consultation.save(null, { useMasterKey: true });

    // Update request status
    consultationRequest.set("status", "booked");
    await consultationRequest.save(null, { useMasterKey: true });

    return NextResponse.json({
      id: consultation.id,
      requestId: consultation.get("request")?.id,
      serviceId: consultation.get("service")?.id,
      serviceType: consultation.get("service")?.get("serviceType"),
      scheduledAt: consultation.get("scheduledAt"),
      status: consultation.get("status"),
    }, { status: 201 });
  } catch (error) {
    console.error("Error booking consultation:", error);
    return NextResponse.json({ error: "Failed to book consultation" }, { status: 500 });
  }
}
