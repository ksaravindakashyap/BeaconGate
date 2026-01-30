"use client";

import { useActionState } from "react";
import { submitCase } from "@/app/actions/submit-case";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CATEGORIES = [
  { value: "GENERAL", label: "General" },
  { value: "HEALTH", label: "Health" },
  { value: "FINANCE", label: "Finance" },
  { value: "DATING", label: "Dating" },
  { value: "GAMBLING", label: "Gambling" },
] as const;

export function SubmitForm() {
  const [state, formAction] = useActionState(submitCase, null);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="adText">Ad text</Label>
        <textarea
          id="adText"
          name="adText"
          required
          rows={4}
          className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          placeholder="Paste or type the ad creative text..."
        />
        {state?.error?.adText && (
          <p className="text-xs text-danger">{state.error.adText.join(" ")}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          name="category"
          required
          className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="landingUrl">Landing URL</Label>
        <Input
          id="landingUrl"
          name="landingUrl"
          type="url"
          required
          placeholder="https://example.com/landing"
        />
        {state?.error?.landingUrl && (
          <p className="text-xs text-danger">{state.error.landingUrl.join(" ")}</p>
        )}
      </div>
      <p className="text-xs text-text-muted">
        Optional screenshot upload is not available in Phase 1. Evidence will store the URL and a hash.
      </p>
      <Button type="submit" size="lg">
        Submit case
      </Button>
    </form>
  );
}
