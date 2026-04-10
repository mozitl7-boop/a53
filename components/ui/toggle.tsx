'use client'

import * as React from 'react'
import * as TogglePrimitive from '@radix-ui/react-toggle'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const toggleVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-bold hover:shadow-md hover:shadow-primary/20 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-gradient-to-br data-[state=on]:from-primary data-[state=on]:to-primary/80 data-[state=on]:text-primary-foreground data-[state=on]:shadow-lg data-[state=on]:shadow-primary/50 [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-primary/50 focus-visible:ring-[3px] outline-none transition-all duration-300 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap border-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-transparent hover:bg-primary/10',
        outline:
          'border-primary/60 bg-card/50 shadow-md hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/30',
      },
      size: {
        default: 'h-10 px-3 min-w-10',
        sm: 'h-8 px-2 min-w-8',
        lg: 'h-12 px-4 min-w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
