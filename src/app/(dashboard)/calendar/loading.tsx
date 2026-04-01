export default function CalendarLoading() {
  return (
    <div className="space-y-6 py-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 bg-muted rounded" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-muted rounded" />
          <div className="h-8 w-8 bg-muted rounded" />
        </div>
      </div>
      <div className="h-10 bg-muted rounded-lg" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="border rounded-xl overflow-hidden">
            <div className="h-8 bg-muted" />
            <div className="p-3 space-y-2">
              <div className="h-16 bg-muted/50 rounded-lg" />
              <div className="h-16 bg-muted/50 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
