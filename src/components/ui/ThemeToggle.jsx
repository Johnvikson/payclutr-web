import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme.jsx'

export default function ThemeToggle({ size = 17 }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 transition-colors"
    >
      {isDark ? <Sun size={size} /> : <Moon size={size} />}
    </button>
  )
}
