export default function MealsLoading() {
  return (
    <div className="space-y-6 py-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-36 bg-muted rounded" />
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-muted rounded" />
          <div className="h-8 w-8 bg-muted rounded" />
        </div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border-2 rounded-xl overflow-hidden">
            <div className="h-8 bg-muted" />
            <div className="divide-y">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="flex gap-3 px-4 py-3">
                  <div className="h-4 w-20 bg-muted rounded" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
