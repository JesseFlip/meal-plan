type Props = {
  connected: boolean
}

export function SyncStatus({ connected }: Props) {
  return (
    <div className="flex items-center gap-2 text-xs sm:text-sm bg-white px-3 py-1.5 rounded-full border border-stone-200 shadow-sm">
      <span
        className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}
        aria-hidden
      />
      <span className="text-stone-600 font-medium">
        {connected ? 'Live' : 'Reconnecting…'}
      </span>
    </div>
  )
}
