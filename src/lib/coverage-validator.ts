import { prisma } from "@/lib/prisma";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachHourOfInterval,
  startOfDay,
  endOfDay,
  isWithinInterval,
  format,
} from "date-fns";

export interface CoverageGap {
  date: Date;
  startHour: number;
  endHour: number;
  duration: number; // hours
}

export interface CoverageReport {
  totalHours: number;
  coveredHours: number;
  coveragePercent: number;
  gaps: CoverageGap[];
  openSlots: number;
}

export async function getWeeklyCoverage(
  careCircleId: string,
  weekDate: Date
): Promise<CoverageReport> {
  const weekStart = startOfWeek(weekDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(weekDate, { weekStartsOn: 0 });

  const shifts = await prisma.careShift.findMany({
    where: {
      careCircleId,
      date: {
        gte: weekStart,
        lte: weekEnd,
      },
      status: { not: "OPEN" },
    },
    orderBy: { startTime: "asc" },
  });

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const totalHours = days.length * 24; // 168 hours in a week
  let coveredHours = 0;
  const gaps: CoverageGap[] = [];

  for (const day of days) {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    const hours = eachHourOfInterval({ start: dayStart, end: dayEnd });

    let currentGapStart: number | null = null;

    for (const hour of hours) {
      const hourNum = hour.getHours();
      const isCovered = shifts.some((shift) =>
        isWithinInterval(hour, {
          start: shift.startTime,
          end: shift.endTime,
        })
      );

      if (isCovered) {
        coveredHours++;
        if (currentGapStart !== null) {
          gaps.push({
            date: day,
            startHour: currentGapStart,
            endHour: hourNum,
            duration: hourNum - currentGapStart,
          });
          currentGapStart = null;
        }
      } else {
        if (currentGapStart === null) {
          currentGapStart = hourNum;
        }
      }
    }

    // Close any gap that extends to end of day
    if (currentGapStart !== null) {
      gaps.push({
        date: day,
        startHour: currentGapStart,
        endHour: 24,
        duration: 24 - currentGapStart,
      });
    }
  }

  const coveragePercent =
    totalHours > 0 ? Math.round((coveredHours / totalHours) * 100) : 0;

  // Count open shifts
  const openSlots = await prisma.careShift.count({
    where: {
      careCircleId,
      date: { gte: weekStart, lte: weekEnd },
      status: "OPEN",
    },
  });

  return {
    totalHours,
    coveredHours,
    coveragePercent,
    gaps,
    openSlots,
  };
}

export function formatGap(gap: CoverageGap): string {
  const formatHour = (h: number) => {
    if (h === 0 || h === 24) return "12am";
    if (h === 12) return "12pm";
    return h > 12 ? `${h - 12}pm` : `${h}am`;
  };

  return `${format(gap.date, "EEE MMM d")} ${formatHour(gap.startHour)}-${formatHour(gap.endHour)}`;
}
