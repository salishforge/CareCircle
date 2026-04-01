import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
  moodEntry: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

const mockSession = { user: { id: "user-1" } };
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}));

const { GET, POST } = await import("@/app/api/wellness/route");

describe("GET /api/wellness", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns mood entries for the last 7 days by default", async () => {
    mockPrisma.moodEntry.findMany.mockResolvedValue([
      { id: "m1", mood: 4, date: new Date() },
    ]);

    const req = new Request("http://localhost/api/wellness");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it("accepts custom days parameter", async () => {
    mockPrisma.moodEntry.findMany.mockResolvedValue([]);

    const req = new Request("http://localhost/api/wellness?days=14");
    await GET(req);

    expect(mockPrisma.moodEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1" }),
      })
    );
  });
});

describe("POST /api/wellness", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a mood entry with valid data", async () => {
    const mockEntry = { id: "m1", mood: 4, energyLevel: 3 };
    mockPrisma.moodEntry.upsert.mockResolvedValue(mockEntry);

    const req = new Request("http://localhost/api/wellness", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood: 4, energyLevel: 3 }),
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
  });

  it("rejects invalid mood value", async () => {
    const req = new Request("http://localhost/api/wellness", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood: 10 }), // max is 5
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("rejects missing mood field", async () => {
    const req = new Request("http://localhost/api/wellness", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ energyLevel: 3 }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});
