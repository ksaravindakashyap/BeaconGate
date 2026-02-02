/**
 * Test fixture: landing page with hidden text for E2E capture.
 * Used by E2E tests; not a product feature.
 */
export const dynamic = "force-dynamic";

export default function TestLandingPage() {
  return (
    <div>
      <h1>Test landing</h1>
      <p>Visible content for capture.</p>
      <div style={{ display: "none" }} aria-hidden="true">
        Hidden disclaimer. Consult your doctor. Not medical advice.
      </div>
      <span style={{ visibility: "hidden" }}>More hidden</span>
      <p style={{ fontSize: 0 }}>Zero font size</p>
      <div style={{ display: "none" }}>x</div>
      <div style={{ visibility: "hidden" }}>y</div>
      <span style={{ fontSize: 0 }}>z</span>
    </div>
  );
}
