export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-sage-dark tracking-tight">
            CareCircle
          </h1>
          <p className="text-muted-foreground mt-2">
            Community-powered care coordination
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
