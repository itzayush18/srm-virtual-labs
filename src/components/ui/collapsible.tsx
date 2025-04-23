
import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { cva } from "class-variance-authority"

const collapsibleContentVariants = cva(
  "overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down",
  {
    variants: {
      variant: {
        default: "rounded-md border border-slate-200 bg-white shadow-sm",
        plain: ""
      }
    },
    defaultVariants: {
      variant: "plain"
    }
  }
)

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

interface CollapsibleContentProps extends React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content> {
  variant?: "default" | "plain"
}

const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  CollapsibleContentProps
>(({ className, variant, ...props }, ref) => (
  <CollapsiblePrimitive.Content
    ref={ref}
    className={collapsibleContentVariants({ variant, className })}
    {...props}
  />
))
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
