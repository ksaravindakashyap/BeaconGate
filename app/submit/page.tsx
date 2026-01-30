import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SubmitForm } from "./submit-form";

export const dynamic = "force-dynamic";

export default function SubmitPage() {
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
          <SubmitForm />
        </CardContent>
      </Card>
    </div>
  );
}
