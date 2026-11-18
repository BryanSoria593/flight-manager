import type { ReactNode } from 'react'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  variant: AlertVariant
  title?: string
  children: ReactNode
}

export function Alert({ variant, title, children }: AlertProps) {
  const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status'
  return (
    <div role={role} className={`alert alert-${variant}`}>
      {title && <strong className="alert-title">{title}</strong>}
      <div>{children}</div>
    </div>
  )
}
