"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Minus, Plus } from "lucide-react";
import { useState } from "react";

interface DashboardWidgetProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  collapsible?: boolean;
}

export function DashboardWidget({
  id,
  title,
  icon,
  children,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  collapsible = true,
}: DashboardWidgetProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Card
      data-widget-id={id}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={draggable ? "cursor-grab active:cursor-grabbing" : ""}
    >
      <CardHeader className="pb-2 flex flex-row items-center gap-2">
        {draggable && (
          <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <CardTitle className="text-sm font-medium flex-1">{title}</CardTitle>
        {collapsible && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
          >
            {collapsed ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
          </Button>
        )}
      </CardHeader>
      {!collapsed && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}
