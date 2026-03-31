import { prisma } from "@/lib/prisma";
import { NotificationType, RequestPriority, RequestType } from "@/generated/prisma/client";

/**
 * Public endpoint for the wall display "I Need Help" button.
 * Validates display token and creates a PatientRequest.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { circleId, token } = body;

  if (!circleId) {
    return Response.json({ error: "circleId required" }, { status: 400 });
  }

  const displayToken = process.env.DISPLAY_TOKEN;
  if (displayToken && token !== displayToken) {
    return Response.json({ error: "Invalid display token" }, { status: 401 });
  }

  const circle = await prisma.careCircle.findUnique({
    where: { id: circleId },
    select: { patientId: true },
  });

  if (!circle) {
    return Response.json({ error: "Circle not found" }, { status: 404 });
  }

  const patientRequest = await prisma.patientRequest.create({
    data: {
      careCircleId: circleId,
      patientId: circle.patientId,
      type: RequestType.OTHER,
      description: "Patient needs assistance — requested from wall display",
      priority: RequestPriority.URGENT,
      status: "OPEN",
    },
  });

  // Notify current caregiver and admins
  const caregivers = await prisma.careCircleMember.findMany({
    where: {
      careCircleId: circleId,
      isActive: true,
      role: { in: ["PRIMARY_CAREGIVER", "CAREGIVER", "ADMIN"] },
    },
    include: { user: { select: { id: true } } },
  });

  await prisma.notification.createMany({
    data: caregivers.map((m) => ({
      userId: m.user.id,
      type: NotificationType.PATIENT_REQUEST,
      title: "Patient needs help",
      body: "The patient has pressed the Need Help button on the wall display.",
    })),
  });

  return Response.json(patientRequest, { status: 201 });
}
