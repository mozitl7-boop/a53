import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-lg border-2 px-3 py-1 text-xs font-bold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-primary/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-300 overflow-hidden shadow-md',
  {
    variants: {
      variant: {
        default:
          'border-primary bg-gradient-to-r from-primary/90 to-primary text-primary-foreground [a&]:hover:shadow-lg [a&]:hover:shadow-primary/50',
        secondary:
          'border-secondary bg-gradient-to-r from-secondary/80 to-secondary text-secondary-foreground [a&]:hover:shadow-lg [a&]:hover:shadow-secondary/50',
        destructive:
          'border-red-500 bg-red-500/20 text-red-300 [a&]:hover:bg-red-500/30 focus-visible:ring-destructive/30 dark:focus-visible:ring-destructive/50 shadow-destructive/20',
        outline:
          'border-primary/50 text-primary [a&]:hover:bg-primary/10 [a&]:hover:border-primary [a&]:hover:shadow-md [a&]:hover:shadow-primary/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
