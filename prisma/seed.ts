import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import {
  addDays,
  subDays,
  startOfWeek,
  setHours,
  setMinutes,
} from "date-fns";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PASSWORD = "demo1234";

async function main() {
  console.log("Seeding CareCircle demo data...");

  const hash = await bcrypt.hash(PASSWORD, 10);
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });

  // ─── Users ────────────────────────────────────────────────────────────────
  const margaret = await prisma.user.upsert({
    where: { email: "margaret@demo.carecircle.app" },
    create: {
      email: "margaret@demo.carecircle.app",
      name: "Margaret Chen",
      phone: "+15551001001",
      passwordHash: hash,
      role: "PATIENT",
    },
    update: { name: "Margaret Chen", role: "PATIENT" },
  });

  const sarah = await prisma.user.upsert({
    where: { email: "sarah@demo.carecircle.app" },
    create: {
      email: "sarah@demo.carecircle.app",
      name: "Sarah Chen",
      phone: "+15551001002",
      passwordHash: hash,
      role: "PRIMARY_CAREGIVER",
    },
    update: { name: "Sarah Chen", role: "PRIMARY_CAREGIVER" },
  });

  const david = await prisma.user.upsert({
    where: { email: "david@demo.carecircle.app" },
    create: {
      email: "david@demo.carecircle.app",
      name: "David Chen",
      phone: "+15551001003",
      passwordHash: hash,
      role: "CAREGIVER",
    },
    update: { name: "David Chen", role: "CAREGIVER" },
  });

  const maria = await prisma.user.upsert({
    where: { email: "maria@demo.carecircle.app" },
    create: {
      email: "maria@demo.carecircle.app",
      name: "Maria Rodriguez",
      phone: "+15551001004",
      passwordHash: hash,
      role: "MEAL_PROVIDER",
    },
    update: { name: "Maria Rodriguez", role: "MEAL_PROVIDER" },
  });

  const james = await prisma.user.upsert({
    where: { email: "james@demo.carecircle.app" },
    create: {
      email: "james@demo.carecircle.app",
      name: "James Wilson",
      phone: "+15551001005",
      passwordHash: hash,
      role: "CAREGIVER",
    },
    update: { name: "James Wilson", role: "CAREGIVER" },
  });

  // ─── Care Circle ──────────────────────────────────────────────────────────
  // Delete existing demo circle data
  const existing = await prisma.careCircle.findFirst({
    where: { name: "Margaret's Care Circle" },
  });
  if (existing) {
    await prisma.careCircle.delete({ where: { id: existing.id } });
  }

  const circle = await prisma.careCircle.create({
    data: {
      name: "Margaret's Care Circle",
      patientId: margaret.id,
      timezone: "America/Los_Angeles",
    },
  });

  // Members
  const members = [
    { userId: margaret.id, role: "PATIENT" as const },
    { userId: sarah.id, role: "PRIMARY_CAREGIVER" as const },
    { userId: david.id, role: "CAREGIVER" as const },
    { userId: maria.id, role: "MEAL_PROVIDER" as const },
    { userId: james.id, role: "CAREGIVER" as const },
  ];

  for (const m of members) {
    await prisma.careCircleMember.create({
      data: { careCircleId: circle.id, userId: m.userId, role: m.role },
    });
  }

  // ─── Shifts (this week) ───────────────────────────────────────────────────
  const caregivers = [sarah, david, james];
  const shifts = [];

  for (let d = 0; d < 7; d++) {
    const day = addDays(weekStart, d);
    const isPast = day < today;

    // Morning shift 7am - 3pm
    shifts.push({
      careCircleId: circle.id,
      date: day,
      startTime: setMinutes(setHours(day, 7), 0),
      endTime: setMinutes(setHours(day, 15), 0),
      primaryCaregiverId: caregivers[d % 3].id,
      status: isPast ? "COMPLETED" as const : "CONFIRMED" as const,
    });

    // Evening shift 3pm - 11pm
    shifts.push({
      careCircleId: circle.id,
      date: day,
      startTime: setMinutes(setHours(day, 15), 0),
      endTime: setMinutes(setHours(day, 23), 0),
      primaryCaregiverId: caregivers[(d + 1) % 3].id,
      status: isPast ? "COMPLETED" as const : "CONFIRMED" as const,
    });
  }

  for (const s of shifts) {
    await prisma.careShift.create({ data: s });
  }

  // ─── Meal Plan ────────────────────────────────────────────────────────────
  const mealPlan = await prisma.mealPlan.create({
    data: {
      careCircleId: circle.id,
      weekStartDate: weekStart,
      createdById: sarah.id,
      status: "ACTIVE",
    },
  });

  const mealTitles = {
    BREAKFAST: ["Oatmeal with berries", "Scrambled eggs & toast", "Yogurt parfait", "Banana pancakes", "Fruit smoothie bowl", "Avocado toast", "Granola & milk"],
    LUNCH: ["Chicken noodle soup", "Turkey sandwich", "Garden salad", "Grilled cheese", "Vegetable stir-fry", "Pasta primavera", "Tuna wrap"],
    DINNER: ["Baked salmon & rice", "Roast chicken", "Vegetable curry", "Beef stew", "Pasta bolognese", "Grilled fish tacos", "Shepherd's pie"],
  };

  for (let d = 0; d < 7; d++) {
    const day = addDays(weekStart, d);
    const isPast = day < today;

    for (const [mealType, titles] of Object.entries(mealTitles)) {
      await prisma.meal.create({
        data: {
          mealPlanId: mealPlan.id,
          date: day,
          mealType: mealType as "BREAKFAST" | "LUNCH" | "DINNER",
          title: titles[d],
          calories: 300 + Math.floor(Math.random() * 400),
          proteinGrams: 15 + Math.floor(Math.random() * 30),
          status: isPast ? "DELIVERED" : "PLANNED",
          providerId: d % 3 === 0 ? maria.id : null,
        },
      });
    }
  }

  // ─── Appointments ─────────────────────────────────────────────────────────
  await prisma.appointment.create({
    data: {
      careCircleId: circle.id,
      title: "Oncology follow-up",
      description: "Monthly check-up with Dr. Park",
      location: "Seattle Cancer Care Alliance",
      dateTime: setMinutes(setHours(addDays(today, 3), 10), 30),
      duration: 60,
      type: "MEDICAL",
      transportationNeeded: true,
      transportationVolunteerId: david.id,
    },
  });

  await prisma.appointment.create({
    data: {
      careCircleId: circle.id,
      title: "Physical therapy",
      description: "Strength and mobility session",
      location: "Evergreen PT Clinic",
      dateTime: setMinutes(setHours(addDays(today, 5), 14), 0),
      duration: 45,
      type: "THERAPY",
    },
  });

  // ─── Mood Entries (last 7 days) ───────────────────────────────────────────
  const moods = [3, 3, 4, 2, 3, 4, 4];
  for (let d = 6; d >= 0; d--) {
    const day = subDays(today, d);
    day.setHours(0, 0, 0, 0);
    await prisma.moodEntry.upsert({
      where: { userId_date: { userId: margaret.id, date: day } },
      create: {
        userId: margaret.id,
        date: day,
        mood: moods[6 - d],
        energyLevel: moods[6 - d] - 1 || 1,
        painLevel: 10 - moods[6 - d] * 2,
        appetite: moods[6 - d],
        sleepQuality: Math.min(5, moods[6 - d] + 1),
        symptoms: d % 2 === 0 ? ["Fatigue", "Nausea"] : ["Fatigue"],
      },
      update: {},
    });
  }

  // ─── Medications ──────────────────────────────────────────────────────────
  await prisma.medicationEntry.createMany({
    data: [
      {
        patientId: margaret.id,
        careCircleId: circle.id,
        name: "Lisinopril",
        dosage: "10mg",
        frequency: "Once daily",
        timing: "Morning, with food",
        foodInteractions: ["Avoid high-potassium foods"],
      },
      {
        patientId: margaret.id,
        careCircleId: circle.id,
        name: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily",
        timing: "With breakfast and dinner",
        foodInteractions: ["Take with food to reduce nausea"],
      },
      {
        patientId: margaret.id,
        careCircleId: circle.id,
        name: "Ondansetron",
        dosage: "4mg",
        frequency: "As needed",
        timing: "30 min before meals for nausea",
        foodInteractions: [],
      },
    ],
  });

  // ─── Shopping List ────────────────────────────────────────────────────────
  const list = await prisma.shoppingList.create({
    data: {
      careCircleId: circle.id,
      title: "Weekly groceries",
      category: "FOOD",
      createdById: sarah.id,
    },
  });

  await prisma.shoppingItem.createMany({
    data: [
      { listId: list.id, name: "Chicken breasts", quantity: "2", unit: "lbs", priority: "HIGH", status: "NEEDED" },
      { listId: list.id, name: "Brown rice", quantity: "1", unit: "bag", priority: "MEDIUM", status: "NEEDED" },
      { listId: list.id, name: "Fresh berries", quantity: "2", unit: "pints", priority: "MEDIUM", status: "CLAIMED", assignedToId: maria.id },
      { listId: list.id, name: "Ensure nutrition shakes", quantity: "1", unit: "case", priority: "HIGH", status: "PURCHASED", assignedToId: david.id },
      { listId: list.id, name: "Ginger tea", quantity: "1", unit: "box", priority: "LOW", status: "DELIVERED", assignedToId: james.id },
    ],
  });

  // ─── Nutrition Profile ────────────────────────────────────────────────────
  await prisma.patientNutritionProfile.upsert({
    where: { patientId: margaret.id },
    create: {
      patientId: margaret.id,
      allergies: ["Shellfish"],
      intolerances: ["Lactose"],
      dietaryRestrictions: ["Low sodium", "Low sugar"],
      treatmentType: "CHEMO",
      currentSymptoms: ["Nausea", "Fatigue", "Loss of appetite"],
      calorieTarget: 1800,
      proteinTarget: 65,
      hydrationTarget: 10,
      preferredFoods: ["Chicken soup", "Rice", "Bananas", "Ginger tea"],
      dislikedFoods: ["Spicy food", "Raw vegetables"],
      texturePreference: "SOFT",
      oncologistNotes: "Increase protein intake during chemo weeks. Monitor hydration closely.",
    },
    update: {},
  });

  // ─── Notifications ────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: sarah.id,
        type: "SHIFT_REMINDER",
        title: "Shift starting soon",
        body: "Your morning shift starts in 30 minutes.",
      },
      {
        userId: margaret.id,
        type: "MEDICATION_REMINDER",
        title: "Medication reminder",
        body: "Don't forget to take: Lisinopril, Metformin",
      },
      {
        userId: david.id,
        type: "ENCOURAGEMENT",
        title: "You're making a difference",
        body: "Margaret's care team appreciates everything you do.",
        read: true,
        readAt: new Date(),
      },
    ],
  });

  // ─── Gratitude Messages ───────────────────────────────────────────────────
  await prisma.gratitudeMessage.createMany({
    data: [
      {
        careCircleId: circle.id,
        senderId: margaret.id,
        content: "Sarah, thank you for always being here with a warm smile. Your presence makes every day brighter.",
        isDelivered: true,
        deliveredAt: subDays(today, 2),
      },
      {
        careCircleId: circle.id,
        senderId: sarah.id,
        content: "Maria, your homemade soup last week was exactly what Mom needed. You're an angel!",
        isDelivered: true,
        deliveredAt: subDays(today, 1),
      },
    ],
  });

  // ─── Patient Requests ─────────────────────────────────────────────────────
  await prisma.patientRequest.create({
    data: {
      careCircleId: circle.id,
      patientId: margaret.id,
      type: "MEAL",
      description: "Would love some chicken noodle soup for dinner tonight",
      priority: "NORMAL",
      status: "OPEN",
    },
  });

  await prisma.patientRequest.create({
    data: {
      careCircleId: circle.id,
      patientId: margaret.id,
      type: "TRANSPORT",
      description: "Need a ride to pharmacy on Thursday afternoon",
      priority: "LOW",
      status: "IN_PROGRESS",
      assignedToId: james.id,
    },
  });

  console.log("Seed complete!");
  console.log(`  Care circle: ${circle.name} (${circle.id})`);
  console.log(`  Users: margaret/sarah/david/maria/james @demo.carecircle.app`);
  console.log(`  Password: ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
