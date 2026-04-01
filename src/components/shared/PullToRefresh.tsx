"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const THRESHOLD = 80;

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only activate when scrolled to top
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling || refreshing) return;
      const diff = e.touches[0].clientY - startY.current;
      if (diff > 0) {
        setPullDistance(Math.min(diff * 0.5, THRESHOLD * 1.5));
      }
    },
    [pulling, refreshing]
  );

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(THRESHOLD * 0.5);
      router.refresh();
      // Reset after a short delay
      setTimeout(() => {
        setRefreshing(false);
        setPullDistance(0);
        setPulling(false);
      }, 1000);
    } else {
      setPullDistance(0);
      setPulling(false);
    }
  }, [pullDistance, refreshing, router]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      {(pullDistance > 0 || refreshing) && (
        <div
          className="flex items-center justify-center overflow-hidden transition-[height] duration-150"
          style={{ height: `${pullDistance}px` }}
        >
          <Loader2
            className={`h-5 w-5 text-primary ${
              refreshing ? "animate-spin" : ""
            }`}
            style={{
              opacity: Math.min(pullDistance / THRESHOLD, 1),
              transform: `rotate(${pullDistance * 3}deg)`,
            }}
          />
        </div>
      )}
      {children}
    </div>
  );
}
