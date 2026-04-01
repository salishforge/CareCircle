export default function DashboardLoading() {
  return (
    <div className="space-y-6 py-6 animate-pulse">
      {/* Greeting */}
      <div>
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-4 w-64 bg-muted rounded mt-2" />
      </div>

      {/* Check-in button */}
      <div className="h-14 bg-muted rounded-xl" />

      {/* Who is here */}
      <div className="border rounded-xl p-4 space-y-3">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-muted rounded-full" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        </div>
      </div>

      {/* Quick actions grid */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[88px] bg-muted rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg" />
          ))}
        </div>
      </div>

      {/* Today overview */}
      <div className="border rounded-xl p-4 space-y-3">
        <div className="h-4 w-28 bg-muted rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-4 w-8 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
