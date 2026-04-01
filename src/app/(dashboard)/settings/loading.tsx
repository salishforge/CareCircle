export default function SettingsLoading() {
  return (
    <div className="py-6 space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-28 bg-muted rounded" />
        <div className="h-4 w-56 bg-muted rounded mt-2" />
      </div>
      {/* Account card */}
      <div className="border rounded-xl p-6 space-y-3">
        <div className="h-5 w-20 bg-muted rounded" />
        <div className="space-y-2">
          <div className="h-3 w-12 bg-muted rounded" />
          <div className="h-5 w-40 bg-muted rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-12 bg-muted rounded" />
          <div className="h-5 w-48 bg-muted rounded" />
        </div>
      </div>
      {/* Theme card */}
      <div className="border rounded-xl p-6 space-y-3">
        <div className="h-5 w-24 bg-muted rounded" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 flex-1 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
      {/* Notification prefs card */}
      <div className="border rounded-xl p-6 space-y-4">
        <div className="h-5 w-40 bg-muted rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-4 w-36 bg-muted rounded" />
            <div className="h-6 w-10 bg-muted rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
