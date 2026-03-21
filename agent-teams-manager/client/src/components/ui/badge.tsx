import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20",
        secondary: "bg-slate-700 text-slate-300 border border-slate-600/20",
        destructive: "bg-red-600/10 text-red-400 border border-red-600/20",
        outline: "text-slate-300 border border-slate-600",
        success: "bg-emerald-600/10 text-emerald-400 border border-emerald-600/20",
        warning: "bg-amber-600/10 text-amber-400 border border-amber-600/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
