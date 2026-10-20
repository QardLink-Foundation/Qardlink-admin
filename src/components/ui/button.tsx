import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet'
type Size = 'sm' | 'md'

const base =
  'inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap ' +
  'transition-[background-color,border-color,color,transform] duration-100 ease-out ' +
  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 select-none'

const variants: Record<Variant, string> = {
  primary:
    'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-panel',
  secondary:
    'border border-line-strong bg-surface text-ink hover:border-emerald-300 hover:bg-emerald-50/60',
  ghost: 'text-ink-muted hover:bg-emerald-50 hover:text-emerald-800',
  danger: 'bg-overdue text-white hover:brightness-110 active:brightness-95',
  quiet: 'text-ink-muted hover:text-ink underline underline-offset-2 decoration-line-strong',
}

const sizes: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-[12.5px]',
  md: 'h-9 px-3.5 text-[13px]',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {icon}
      {children}
    </button>
  )
}

export function IconButton({
  label,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md text-ink-muted',
        'hover:bg-emerald-50 hover:text-emerald-800 active:scale-95 disabled:opacity-45',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
