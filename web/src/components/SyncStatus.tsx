type Props = {
  connected: boolean
  syncMode: 'auto' | 'manual'
  pendingCount: number
  onToggle: () => void
}

export function SyncStatus({ connected, syncMode, pendingCount, onToggle }: Props) {
  if (syncMode === 'auto') {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-xs sm:text-sm font-medium bg-white px-3 py-1.5 rounded-full border border-stone-200 shadow-sm text-stone-600 min-h-[44px] hover:bg-stone-50 active:bg-stone-100 transition-colors"
        aria-label="Sync mode: Live. Tap to switch to Manual."
      >
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}
          aria-hidden="true"
        />
        <span>{connected ? 'Live' : 'Reconnecting…'}</span>
      </button>
    )
  }

  if (pendingCount > 0) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-xs sm:text-sm font-medium bg-amber-100 px-3 py-1.5 rounded-full border border-amber-400 shadow-sm text-amber-800 min-h-[44px] hover:bg-amber-200 active:bg-amber-300 transition-colors"
        aria-label={`${pendingCount} ${pendingCount === 1 ? 'change' : 'changes'} pending. Tap to sync.`}
      >
        <span className="flex-shrink-0" aria-hidden="true">⏸</span>
        <span>{pendingCount} {pendingCount === 1 ? 'change' : 'changes'} pending</span>
      </button>
    )
  }

  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 text-xs sm:text-sm font-medium bg-amber-50 px-3 py-1.5 rounded-full border border-amber-300 shadow-sm text-amber-700 min-h-[44px] hover:bg-amber-100 active:bg-amber-200 transition-colors"
      aria-label="Sync mode: Manual. Tap to go Live."
    >
      <span className="flex-shrink-0" aria-hidden="true">⏸</span>
      <span>Manual</span>
    </button>
  )
}
