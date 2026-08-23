import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border border-transparent",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[var(--primary)] to-[var(--primary)/0.8] text-[var(--primary-foreground)] hover:shadow-lg hover:shadow-[var(--primary)/0.5] active:scale-95 hover:from-[var(--primary)] hover:to-[var(--primary)/0.7]",
        destructive: "bg-gradient-to-r from-[var(--destructive)] to-[var(--destructive-foreground)] text-[var(--destructive-foreground)] hover:shadow-lg hover:shadow-[var(--destructive)/0.5] active:scale-95",
        outline: "border-2 border-[var(--primary)] text-[var(--primary)] bg-transparent hover:bg-[var(--primary)/0.1] active:bg-[var(--primary)/0.2] hover:shadow-md hover:shadow-[var(--primary)/0.3]",
        secondary: "bg-gradient-to-r from-[var(--secondary)] to-[var(--secondary)/0.9] text-[var(--secondary-foreground)] hover:shadow-lg hover:shadow-[var(--secondary)/0.5] active:scale-95",
        ghost: "bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)/0.7] active:bg-[var(--muted)] hover:shadow-md",
        link: "text-[var(--primary)] underline-offset-4 hover:underline hover:text-[var(--primary)/0.8]",
      },
      size: {
        default: "h-10 px-6",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0",
        "icon-lg": "h-12 w-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, ...props }, ref) => {
    const Comp: any = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }), loading ? "opacity-80 pointer-events-none" : "")}
        aria-busy={loading ? "true" : undefined}
        disabled={loading || (props && (props as any).disabled)}
        {...props}
      >
        {loading && (
          <span className="inline-block mr-2 w-4 h-4 border-2 border-[var(--primary-foreground)] border-t-transparent rounded-full animate-spin" aria-hidden />
        )}
        {children}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
