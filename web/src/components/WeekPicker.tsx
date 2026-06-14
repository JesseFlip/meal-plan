type Props = {
  selectedWeek: string  // ISO date string (YYYY-MM-DD) for Monday
  onWeekChange: (week: string) => void
}

function getMondayOfWeek(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')  // Force local timezone
  const dayOfWeek = date.getDay()  // 0=Sun, 1=Mon, ..., 6=Sat
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(date)
  monday.setDate(date.getDate() + daysToMonday)
  return monday.toISOString().split('T')[0]
}

function formatWeekLabel(mondayStr: string): string {
  const monday = new Date(mondayStr + 'T00:00:00')
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

export function WeekPicker({ selectedWeek, onWeekChange }: Props) {
  const handlePrevWeek = () => {
    const monday = new Date(selectedWeek + 'T00:00:00')
    monday.setDate(monday.getDate() - 7)
    onWeekChange(monday.toISOString().split('T')[0])
  }

  const handleNextWeek = () => {
    const monday = new Date(selectedWeek + 'T00:00:00')
    monday.setDate(monday.getDate() + 7)
    onWeekChange(monday.toISOString().split('T')[0])
  }

  const handleToday = () => {
    const today = new Date().toISOString().split('T')[0]
    onWeekChange(getMondayOfWeek(today))
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      onWeekChange(getMondayOfWeek(e.target.value))
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Previous week button */}
      <button
        onClick={handlePrevWeek}
        className="p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors"
        title="Previous week"
        aria-label="Previous week"
      >
        <svg className="w-4 h-4 text-stone-600 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Week display + hidden date picker */}
      <div className="relative">
        <button
          onClick={() => {
            const picker = document.getElementById('week-date-picker') as HTMLInputElement
            try {
              // Try to use showPicker() if available (modern browsers)
              ;(picker as any).showPicker?.()
            } catch {
              // Fallback to click for older browsers
              picker?.click()
            }
          }}
          className="px-3 py-1.5 text-sm font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors cursor-pointer"
          title="Click to pick a date"
        >
          {formatWeekLabel(selectedWeek)}
        </button>
        <input
          id="week-date-picker"
          type="date"
          value={selectedWeek}
          onChange={handleDateChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
          aria-label="Select week"
        />
      </div>

      {/* Next week button */}
      <button
        onClick={handleNextWeek}
        className="p-2 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors"
        title="Next week"
        aria-label="Next week"
      >
        <svg className="w-4 h-4 text-stone-600 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Today button */}
      <button
        onClick={handleToday}
        className="px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
        title="Go to current week"
      >
        Today
      </button>
    </div>
  )
}
