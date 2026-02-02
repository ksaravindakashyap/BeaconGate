/**
 * Test fixture: final landing after redirect chain for E2E capture.
 * Use landingUrl = baseURL/test-pages/final so worker captures without hitting redirect chain from submit.
 */
export const dynamic = "force-dynamic";

export default function TestFinalPage() {
  return (
    <div>
      <h1>Final landing</h1>
      <p>You reached the final page. No redirects from here.</p>
    </div>
  );
}
