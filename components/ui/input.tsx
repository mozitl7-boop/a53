import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-slate-500 selection:bg-primary selection:text-primary-foreground h-11 w-full rounded-2xl border-2 border-white/10 bg-[#0c1731] px-4 py-2.5 text-sm font-medium text-foreground shadow-lg shadow-black/10 transition-all duration-300 ease-out outline-none',
        'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:shadow-lg focus-visible:shadow-primary/30',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-muted',
        'aria-invalid:ring-destructive/30 aria-invalid:border-destructive aria-invalid:shadow-destructive/20',
        'hover:border-primary/60 hover:shadow-lg hover:shadow-primary/20',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
