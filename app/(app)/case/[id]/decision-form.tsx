"use client";

import { submitDecision } from "@/app/actions/submit-decision";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const inputClass =
  "flex w-full rounded-md border border-border-soft bg-surface-elevated/35 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/70 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background [color-scheme:dark]";

export function DecisionForm({ caseId }: { caseId: string }) {
  return (
    <form action={submitDecision} className="space-y-4">
      <input type="hidden" name="caseId" value={caseId} />
      <div className="space-y-2">
        <Label>Outcome</Label>
        <select name="outcome" required className={`h-10 ${inputClass}`}>
          <option value="APPROVE">Approve</option>
          <option value="REJECT">Reject</option>
          <option value="NEEDS_MORE_INFO">Needs more info</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reviewerNotes">Notes (optional)</Label>
        <textarea
          id="reviewerNotes"
          name="reviewerNotes"
          rows={3}
          className={inputClass}
          placeholder="Add reviewer notes..."
        />
      </div>
      <Button type="submit" data-testid="submit-decision-btn">Submit decision</Button>
    </form>
  );
}
