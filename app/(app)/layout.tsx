/**
 * App route group: main wrapper only. Non-landing backdrop is mounted by RouteBackdrops in root layout.
 */
export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="relative min-h-screen w-full text-text-primary">
      {children}
    </main>
  );
}
