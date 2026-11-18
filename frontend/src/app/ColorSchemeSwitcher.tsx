import { useEffect, useState } from 'react'

type ThemeScheme = 'light' | 'dark' | 'system'

const storageKey = 'theme-scheme'
const options: { value: ThemeScheme; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'system', label: 'Sistema' },
]

function readStoredScheme(): ThemeScheme {
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    return 'system'
  }
  return 'system'
}

export function ColorSchemeSwitcher() {
  const [scheme, setScheme] = useState<ThemeScheme>(readStoredScheme)

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    const syncTheme = () => {
      const isDark = scheme === 'dark' || (scheme === 'system' && Boolean(media?.matches))
      document.documentElement.classList.toggle('dark', isDark)
    }

    syncTheme()
    try {
      localStorage.setItem(storageKey, scheme)
    } catch {
    }

    if (scheme !== 'system' || !media) return
    media.addEventListener?.('change', syncTheme)
    return () => media.removeEventListener?.('change', syncTheme)
  }, [scheme])

  return (
    <div className="theme-switcher" role="group" aria-label="Tema">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="theme-option"
          aria-pressed={scheme === option.value}
          onClick={() => setScheme(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
