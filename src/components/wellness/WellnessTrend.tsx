"use client";

import { format } from "date-fns";

interface Entry {
  date: string;
  mood: number;
  energyLevel: number | null;
  painLevel: number | null;
}

interface WellnessTrendProps {
  entries: Entry[];
}

export function WellnessTrend({ entries }: WellnessTrendProps) {
  if (entries.length < 2) return null;

  const maxMood = 5;
  const chartHeight = 80;
  const chartWidth = 100; // percentage-based

  const points = entries.map((e, i) => ({
    x: (i / (entries.length - 1)) * chartWidth,
    y: chartHeight - (e.mood / maxMood) * chartHeight,
    date: format(new Date(e.date), "MMM d"),
    mood: e.mood,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const MOOD_EMOJIS = ["😞", "😕", "😐", "🙂", "😊"];

  return (
    <div>
      <svg
        viewBox={`-5 -5 ${chartWidth + 10} ${chartHeight + 10}`}
        className="w-full h-20"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {[1, 2, 3, 4, 5].map((v) => (
          <line
            key={v}
            x1={0}
            x2={chartWidth}
            y1={chartHeight - (v / maxMood) * chartHeight}
            y2={chartHeight - (v / maxMood) * chartHeight}
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth={0.5}
          />
        ))}
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={2.5}
            fill="hsl(var(--primary))"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted-foreground">
          {points[0]?.date}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {points[points.length - 1]?.date}
        </span>
      </div>

      {/* Latest mood */}
      {entries.length > 0 && (
        <div className="text-center mt-2 text-sm">
          <span className="text-muted-foreground">Latest: </span>
          <span className="text-lg">{MOOD_EMOJIS[entries[entries.length - 1].mood - 1]}</span>
        </div>
      )}
    </div>
  );
}
