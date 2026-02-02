/**
 * Landing route group: no AppBackdrop. Landing page mounts LandingBackdrop (shader) itself.
 */
export default function LandingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
