"use client";

import { useState, useCallback, useEffect } from "react";
import { DashboardWidget } from "./DashboardWidget";
import { Button } from "@/components/ui/button";
import { LayoutGrid, X } from "lucide-react";

export interface WidgetConfig {
  id: string;
  title: string;
  icon?: React.ReactNode;
  component: React.ReactNode;
  defaultVisible: boolean;
  /** Widgets with span=2 take full row on desktop */
  span?: 1 | 2;
}

interface WidgetGridProps {
  widgets: WidgetConfig[];
}

interface WidgetState {
  order: string[];
  hidden: string[];
}

const STORAGE_KEY = "carecircle-dashboard-layout";

function loadLayout(widgetIds: string[]): WidgetState {
  if (typeof window === "undefined") return { order: widgetIds, hidden: [] };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as WidgetState;
      // Merge: add any new widgets not in saved order
      const knownIds = new Set(parsed.order);
      const newIds = widgetIds.filter((id) => !knownIds.has(id));
      return {
        order: [...parsed.order.filter((id) => widgetIds.includes(id)), ...newIds],
        hidden: parsed.hidden.filter((id) => widgetIds.includes(id)),
      };
    }
  } catch {
    // ignore
  }
  return { order: widgetIds, hidden: [] };
}

function saveLayout(state: WidgetState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function WidgetGrid({ widgets }: WidgetGridProps) {
  const widgetIds = widgets.map((w) => w.id);
  const [layout, setLayout] = useState<WidgetState>(() => {
    const initial = loadLayout(widgetIds);
    // Hide widgets not defaultVisible unless user previously showed them
    const defaultHidden = widgets.filter((w) => !w.defaultVisible).map((w) => w.id);
    const hasSaved = typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY);
    if (!hasSaved) {
      initial.hidden = defaultHidden;
    }
    return initial;
  });
  const [configOpen, setConfigOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  // Persist on change
  useEffect(() => {
    saveLayout(layout);
  }, [layout]);

  const visibleWidgets = layout.order
    .filter((id) => !layout.hidden.includes(id))
    .map((id) => widgets.find((w) => w.id === id))
    .filter(Boolean) as WidgetConfig[];

  const toggleWidget = useCallback((id: string) => {
    setLayout((prev) => ({
      ...prev,
      hidden: prev.hidden.includes(id)
        ? prev.hidden.filter((h) => h !== id)
        : [...prev.hidden, id],
    }));
  }, []);

  function handleDragStart(e: React.DragEvent, id: string) {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!dragId || dragId === targetId) return;

    setLayout((prev) => {
      const newOrder = [...prev.order];
      const fromIdx = newOrder.indexOf(dragId);
      const toIdx = newOrder.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      newOrder.splice(fromIdx, 1);
      newOrder.splice(toIdx, 0, dragId);
      return { ...prev, order: newOrder };
    });
    setDragId(null);
  }

  return (
    <div>
      {/* Configure button — visible on xl (Smart Board) */}
      <div className="hidden xl:flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfigOpen(!configOpen)}
        >
          <LayoutGrid className="h-4 w-4 mr-1.5" />
          {configOpen ? "Done" : "Customize"}
        </Button>
      </div>

      {/* Widget configurator */}
      {configOpen && (
        <div className="mb-4 p-4 border border-border rounded-xl bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Toggle Widgets</p>
            <button onClick={() => setConfigOpen(false)} className="p-1 hover:bg-muted rounded">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {widgets.map((w) => {
              const isVisible = !layout.hidden.includes(w.id);
              return (
                <button
                  key={w.id}
                  onClick={() => toggleWidget(w.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    isVisible
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {w.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Widget grid — responsive columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleWidgets.map((widget) => (
          <div
            key={widget.id}
            className={widget.span === 2 ? "md:col-span-2" : ""}
          >
            <DashboardWidget
              id={widget.id}
              title={widget.title}
              icon={widget.icon}
              draggable={configOpen}
              onDragStart={(e) => handleDragStart(e, widget.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, widget.id)}
            >
              {widget.component}
            </DashboardWidget>
          </div>
        ))}
      </div>
    </div>
  );
}
