import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-white/10 placeholder:text-slate-500 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:shadow-lg focus-visible:shadow-primary/30 aria-invalid:ring-destructive/30 aria-invalid:border-destructive bg-[#0c1731] h-32 min-h-[7rem] w-full rounded-2xl border-2 px-4 py-3 text-sm font-medium text-foreground shadow-lg shadow-black/10 transition-all duration-300 ease-out outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:bg-muted hover:border-primary/60 hover:shadow-lg hover:shadow-primary/20',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
