import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex rounded-md border px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default:
          "border-border-soft bg-surface-elevated/25 text-text-muted",
        /* Status: queue / case */
        status_open:
          "border-accent/25 bg-accent-muted/20 text-accent",
        status_in_review:
          "border-warn/25 bg-warn-muted/20 text-warn",
        status_closed:
          "border-border-soft bg-surface-elevated/25 text-text-muted",
        status_capturing:
          "border-cyan-500/25 bg-cyan-500/15 text-cyan-400",
        status_ready:
          "border-accent/25 bg-accent-muted/20 text-accent",
        status_decided:
          "border-border-soft bg-surface-elevated/25 text-text-muted",
        /* Risk / severity (HIGH, MEDIUM, LOW) */
        risk_high:
          "border-danger/25 bg-danger-muted/20 text-danger",
        risk_medium:
          "border-warn/25 bg-warn-muted/20 text-warn",
        risk_low:
          "border-success/25 bg-success-muted/20 text-success",
        /* Category chip (HEALTH, FINANCE, etc.) */
        category:
          "border-border-soft bg-surface-elevated/25 text-text-muted",
        /* Legacy aliases for backward compatibility */
        high: "border-danger/25 bg-danger-muted/20 text-danger",
        medium: "border-warn/25 bg-warn-muted/20 text-warn",
        low: "border-success/25 bg-success-muted/20 text-success",
        accent: "border-accent/25 bg-accent-muted/20 text-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
