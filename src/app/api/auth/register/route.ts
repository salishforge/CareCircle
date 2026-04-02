import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  role: z.enum(["PATIENT", "PRIMARY_CAREGIVER", "CAREGIVER", "MEAL_PROVIDER"]),
});

export async function POST(request: Request) {
  // Rate limit: 5 registrations per IP per 15 minutes
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";
  const rl = checkRateLimit(`register:${ip}`, { max: 5, windowSec: 900 });
  if (!rl.allowed) return rateLimitResponse(rl);

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, name, phone, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone: phone || null,
        role: role as "PATIENT" | "PRIMARY_CAREGIVER" | "CAREGIVER" | "MEAL_PROVIDER",
        authProvider: "LOCAL",
      },
    });

    // Single care circle model: auto-join the existing circle, or create one
    // if this is the first user (the patient).
    const existingCircle = await prisma.careCircle.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (existingCircle) {
      // Join existing circle
      await prisma.careCircleMember.create({
        data: {
          careCircleId: existingCircle.id,
          userId: user.id,
          role: role as "PATIENT" | "PRIMARY_CAREGIVER" | "CAREGIVER" | "MEAL_PROVIDER",
        },
      });
    } else {
      // First user — create the care circle
      const circleName = role === "PATIENT"
        ? `${name}'s Care Circle`
        : "Care Circle";

      await prisma.careCircle.create({
        data: {
          name: circleName,
          patientId: user.id,
          members: {
            create: {
              userId: user.id,
              role: role as "PATIENT" | "PRIMARY_CAREGIVER" | "CAREGIVER" | "MEAL_PROVIDER",
            },
          },
        },
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
