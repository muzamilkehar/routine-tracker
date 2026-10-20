import { useEffect, useState } from 'react'

// Returns `value`, but only after it has stopped changing for `delay` milliseconds.
// Used so we search once you pause typing, not on every keystroke.
export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])

  return debounced
}