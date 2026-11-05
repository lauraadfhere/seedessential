import { NextResponse } from "next/server";
import { getParseAdmin } from "@/lib/parse/admin";
import { requireAdmin, requireUser } from "@/lib/parse/require-admin";
import { getOrder, updateOrderStatus, ORDER_STATUS_STEPS } from "@/lib/cart";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders/:number/tracking - Get order tracking information
 * Requires authentication for user's own orders
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number: orderNumber } = await params;
    const Parse = getParseAdmin();
    const user = await requireUser(request);
    
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Get order details (temporary implementation from localStorage)
    const order = getOrder(orderNumber);
    
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // In production, verify user owns this order
    // if (order.userId !== user.id) {
    //   return NextResponse.json({ error: "Access denied" }, { status: 403 });
    // }

    // Build tracking information
    const currentStepIndex = ORDER_STATUS_STEPS.findIndex(step => step.id === order.status);
    const tracking = {
      orderNumber: order.id,
      status: order.status,
      statusLabel: ORDER_STATUS_STEPS[currentStepIndex]?.label || order.status,
      currentStep: currentStepIndex,
      totalSteps: ORDER_STATUS_STEPS.length,
      steps: ORDER_STATUS_STEPS.map((step, index) => ({
        ...step,
        completed: index <= currentStepIndex,
        current: index === currentStepIndex,
      })),
      estimatedDelivery: order.status === "placed" ? "2-5 working days" : undefined,
      createdAt: order.createdAt,
      items: order.items,
      total: order.total,
      wilaya: order.wilaya,
    };

    return NextResponse.json(tracking);
  } catch (error) {
    console.error("Error fetching order tracking:", error);
    return NextResponse.json({ error: "Failed to fetch tracking information" }, { status: 500 });
  }
}

/**
 * PATCH /api/orders/:number/tracking - Update order status (admin only)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number: orderNumber } = await params;
    if (!(await requireAdmin(request))) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    // Validate status
    const validStatuses = ORDER_STATUS_STEPS.map(step => step.id);
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update order status
    const updatedOrder = updateOrderStatus(orderNumber, status);
    
    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      orderNumber: updatedOrder.id, 
      status: updatedOrder.status,
      statusLabel: ORDER_STATUS_STEPS.find(step => step.id === status)?.label || status
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
