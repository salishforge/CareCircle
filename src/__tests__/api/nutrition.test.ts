import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
  patientNutritionProfile: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

const mockSession = { user: { id: "user-1" } };
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}));

const { GET, PUT } = await import("@/app/api/nutrition/route");

describe("GET /api/nutrition", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when no profile exists", async () => {
    mockPrisma.patientNutritionProfile.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/nutrition");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toBeNull();
  });

  it("returns profile for current user", async () => {
    const profile = {
      id: "np-1",
      patientId: "user-1",
      allergies: ["Peanuts"],
      calorieTarget: 2000,
    };
    mockPrisma.patientNutritionProfile.findUnique.mockResolvedValue(profile);

    const req = new Request("http://localhost/api/nutrition");
    const res = await GET(req);
    const data = await res.json();

    expect(data.allergies).toEqual(["Peanuts"]);
  });

  it("always scopes to authenticated user (no IDOR via patientId param)", async () => {
    mockPrisma.patientNutritionProfile.findUnique.mockResolvedValue(null);

    // Even with patientId param, should use session user
    const req = new Request("http://localhost/api/nutrition?patientId=other-user");
    await GET(req);

    expect(mockPrisma.patientNutritionProfile.findUnique).toHaveBeenCalledWith({
      where: { patientId: "user-1" },
    });
  });
});

describe("PUT /api/nutrition", () => {
  beforeEach(() => vi.clearAllMocks());

  it("upserts profile with valid data", async () => {
    const profile = { id: "np-1", allergies: ["Shellfish"], calorieTarget: 1800 };
    mockPrisma.patientNutritionProfile.upsert.mockResolvedValue(profile);

    const req = new Request("http://localhost/api/nutrition", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        allergies: ["Shellfish"],
        calorieTarget: 1800,
      }),
    });

    const res = await PUT(req);
    expect(res.status).toBe(200);
  });

  it("rejects invalid treatmentType", async () => {
    const req = new Request("http://localhost/api/nutrition", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ treatmentType: "INVALID" }),
    });

    const res = await PUT(req);
    expect(res.status).toBe(400);
  });
});
