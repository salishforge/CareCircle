import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId") ?? session.user.id;

  const profile = await prisma.patientNutritionProfile.findUnique({
    where: { patientId },
  });

  return Response.json(profile);
}

const profileSchema = z.object({
  allergies: z.array(z.string()).optional(),
  intolerances: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  medications: z.array(z.object({
    name: z.string(),
    timing: z.string().optional(),
    foodInteractions: z.array(z.string()).optional(),
  })).optional(),
  treatmentType: z.enum(["CHEMO", "RADIATION", "IMMUNOTHERAPY", "SURGERY", "COMBINATION"]).nullable().optional(),
  currentSymptoms: z.array(z.string()).optional(),
  calorieTarget: z.number().int().positive().optional(),
  proteinTarget: z.number().int().positive().optional(),
  hydrationTarget: z.number().int().positive().optional(),
  preferredFoods: z.array(z.string()).optional(),
  dislikedFoods: z.array(z.string()).optional(),
  texturePreference: z.enum(["NORMAL", "SOFT", "PUREED", "LIQUID"]).optional(),
  oncologistNotes: z.string().nullable().optional(),
});

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const data = parsed.data;

  const profile = await prisma.patientNutritionProfile.upsert({
    where: { patientId: session.user.id },
    create: {
      patientId: session.user.id,
      ...(data.allergies && { allergies: data.allergies }),
      ...(data.intolerances && { intolerances: data.intolerances }),
      ...(data.dietaryRestrictions && { dietaryRestrictions: data.dietaryRestrictions }),
      ...(data.medications && { medications: data.medications }),
      ...(data.treatmentType !== undefined && { treatmentType: data.treatmentType }),
      ...(data.currentSymptoms && { currentSymptoms: data.currentSymptoms }),
      ...(data.calorieTarget && { calorieTarget: data.calorieTarget }),
      ...(data.proteinTarget && { proteinTarget: data.proteinTarget }),
      ...(data.hydrationTarget && { hydrationTarget: data.hydrationTarget }),
      ...(data.preferredFoods && { preferredFoods: data.preferredFoods }),
      ...(data.dislikedFoods && { dislikedFoods: data.dislikedFoods }),
      ...(data.texturePreference && { texturePreference: data.texturePreference }),
      ...(data.oncologistNotes !== undefined && { oncologistNotes: data.oncologistNotes }),
    },
    update: {
      ...(data.allergies && { allergies: data.allergies }),
      ...(data.intolerances && { intolerances: data.intolerances }),
      ...(data.dietaryRestrictions && { dietaryRestrictions: data.dietaryRestrictions }),
      ...(data.medications && { medications: data.medications }),
      ...(data.treatmentType !== undefined && { treatmentType: data.treatmentType }),
      ...(data.currentSymptoms && { currentSymptoms: data.currentSymptoms }),
      ...(data.calorieTarget && { calorieTarget: data.calorieTarget }),
      ...(data.proteinTarget && { proteinTarget: data.proteinTarget }),
      ...(data.hydrationTarget && { hydrationTarget: data.hydrationTarget }),
      ...(data.preferredFoods && { preferredFoods: data.preferredFoods }),
      ...(data.dislikedFoods && { dislikedFoods: data.dislikedFoods }),
      ...(data.texturePreference && { texturePreference: data.texturePreference }),
      ...(data.oncologistNotes !== undefined && { oncologistNotes: data.oncologistNotes }),
    },
  });

  return Response.json(profile);
}
