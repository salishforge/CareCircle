import { prisma } from "@/lib/prisma";
import { timingSafeEqual } from "crypto";

/**
 * Verify that a user is an active member of a care circle.
 * Returns the membership record or null.
 */
export async function verifyCircleMembership(
  userId: string,
  careCircleId: string
) {
  return prisma.careCircleMember.findFirst({
    where: { careCircleId, userId, isActive: true },
  });
}

/**
 * Verify membership and return a 403 response if not a member.
 * Use in API routes: `const error = await requireCircleMembership(userId, circleId); if (error) return error;`
 */
export async function requireCircleMembership(
  userId: string,
  careCircleId: string
): Promise<Response | null> {
  const membership = await verifyCircleMembership(userId, careCircleId);
  if (!membership) {
    return Response.json(
      { error: "Not a member of this care circle" },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Constant-time string comparison to prevent timing attacks on secrets.
 */
export function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      // Compare against self to maintain constant time
      timingSafeEqual(bufA, bufA);
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
