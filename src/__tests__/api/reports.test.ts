import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
  careShift: { count: vi.fn() },
  checkIn: { count: vi.fn() },
  moodEntry: { findMany: vi.fn() },
  meal: { count: vi.fn() },
  patientRequest: { count: vi.fn() },
  careCircleMember: {
    count: vi.fn(),
    findFirst: vi.fn(() => Promise.resolve({ id: "m1", role: "CAREGIVER" })),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

vi.mock("@/lib/coverage-validator", () => ({
  getWeeklyCoverage: vi.fn(() =>
    Promise.resolve({
      coveragePercent: 75,
      coveredHours: 126,
      totalHours: 168,
      openSlots: 3,
      gaps: [{ date: new Date(), startHour: 0, endHour: 6, duration: 6 }],
    })
  ),
}));

const mockSession = { user: { id: "user-1" } };
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}));

const { GET } = await import("@/app/api/reports/route");

describe("GET /api/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // careShift.count called 3 times: total, completed, missed
    mockPrisma.careShift.count
      .mockResolvedValueOnce(14)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(1);
    // checkIn.count called 2 times: total, onTime
    mockPrisma.checkIn.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(8);
    mockPrisma.moodEntry.findMany.mockResolvedValue([
      { date: new Date(), mood: 4, energyLevel: 3, painLevel: 2 },
    ]);
    // meal.count called 2 times: total, delivered
    mockPrisma.meal.count
      .mockResolvedValueOnce(21)
      .mockResolvedValueOnce(18);
    // patientRequest.count called 3 times: total, fulfilled, open
    mockPrisma.patientRequest.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2);
  });

  it("returns 400 when careCircleId is missing", async () => {
    const req = new Request("http://localhost/api/reports");
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it("returns structured report data", async () => {
    const req = new Request("http://localhost/api/reports?careCircleId=cc1");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveProperty("coverage");
    expect(data).toHaveProperty("shifts");
    expect(data).toHaveProperty("checkIns");
    expect(data).toHaveProperty("meals");
    expect(data).toHaveProperty("requests");
    expect(data).toHaveProperty("moodTrend");
    expect(data.coverage.percent).toBe(75);
  });

  it("respects days parameter", async () => {
    const req = new Request("http://localhost/api/reports?careCircleId=cc1&days=30");
    const res = await GET(req);
    const data = await res.json();

    expect(data.period.days).toBe(30);
  });
});
