import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
  medicationEntry: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
  },
  medicationLog: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

const mockSession = { user: { id: "user-1" } };
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(() => Promise.resolve(mockSession)),
}));

const { GET, POST } = await import("@/app/api/medications/route");

describe("GET /api/medications", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns medications and today's logs", async () => {
    mockPrisma.medicationEntry.findMany.mockResolvedValue([
      { id: "med1", name: "Aspirin", dosage: "100mg" },
    ]);
    mockPrisma.medicationLog.findMany.mockResolvedValue([]);

    const req = new Request("http://localhost/api/medications");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.medications).toHaveLength(1);
    expect(data.todayLogs).toHaveLength(0);
  });
});

describe("POST /api/medications", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a medication with valid data", async () => {
    const mockMed = { id: "med1", name: "Aspirin", dosage: "100mg" };
    mockPrisma.medicationEntry.create.mockResolvedValue(mockMed);

    const req = new Request("http://localhost/api/medications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Aspirin", dosage: "100mg" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
  });

  it("rejects missing name", async () => {
    const req = new Request("http://localhost/api/medications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dosage: "100mg" }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});
