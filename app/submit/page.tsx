import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SubmitForm } from "./submit-form";
import { isDemoMode } from "@/lib/runtime/mode";
import { DEMO_CASE_IDS_LIST } from "@/lib/demo/data";

export const dynamic = "force-dynamic";

export default function SubmitPage() {
  const demo = isDemoMode();
  const demoRedirectCaseId = demo ? DEMO_CASE_IDS_LIST[0] : undefined;
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">
        Submit new case
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Ad + landing URL</CardTitle>
        </CardHeader>
        <CardContent>
          <SubmitForm demoRedirectCaseId={demoRedirectCaseId} />
        </CardContent>
      </Card>
    </div>
  );
}
