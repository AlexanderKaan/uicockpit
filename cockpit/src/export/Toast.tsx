import { useEffect, useState } from 'react'

export interface ToastApi {
  show: (message: string) => void
}

interface ToastProps {
  message: string
  onDone: () => void
  ms?: number
}

export function Toast({ message, onDone, ms = 1600 }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setVisible(true)
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 200)
    }, ms)
    return () => clearTimeout(t)
  }, [message, ms, onDone])

  if (!visible) return null
  return <div className="toast" role="status" aria-live="polite">{message}</div>
}
