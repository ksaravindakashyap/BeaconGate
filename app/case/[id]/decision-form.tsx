"use client";

import { submitDecision } from "@/app/actions/submit-decision";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function DecisionForm({ caseId }: { caseId: string }) {
  return (
    <form action={submitDecision} className="space-y-4">
      <input type="hidden" name="caseId" value={caseId} />
      <div className="space-y-2">
        <Label>Outcome</Label>
        <select
          name="outcome"
          required
          className="flex h-10 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-slate-950 [color-scheme:dark]"
        >
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
          className="flex w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-slate-950"
          placeholder="Add reviewer notes..."
        />
      </div>
      <Button type="submit" data-testid="submit-decision-btn">Submit decision</Button>
    </form>
  );
}
