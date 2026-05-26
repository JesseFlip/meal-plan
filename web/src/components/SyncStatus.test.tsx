import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SyncStatus } from './SyncStatus'

describe('SyncStatus', () => {
  it('renders "Connecting" when not connected and in auto mode', () => {
    render(
      <SyncStatus
        connected={false}
        syncMode="auto"
        pendingCount={0}
        onToggle={() => {}}
      />
    )
    expect(screen.getByText(/connecting/i)).toBeInTheDocument()
  })

  it('renders "Live" with pulse when connected in auto mode', () => {
    render(
      <SyncStatus
        connected={true}
        syncMode="auto"
        pendingCount={0}
        onToggle={() => {}}
      />
    )
    expect(screen.getByText(/live/i)).toBeInTheDocument()
    const pill = screen.getByRole('button')
    expect(pill).toHaveClass('animate-pulse')
  })

  it('renders "Manual" when in manual mode with no pending', () => {
    render(
      <SyncStatus
        connected={true}
        syncMode="manual"
        pendingCount={0}
        onToggle={() => {}}
      />
    )
    expect(screen.getByText(/manual/i)).toBeInTheDocument()
  })

  it('renders pending count when in manual mode with changes', () => {
    render(
      <SyncStatus
        connected={true}
        syncMode="manual"
        pendingCount={3}
        onToggle={() => {}}
      />
    )
    expect(screen.getByText(/3 changes pending/i)).toBeInTheDocument()
  })

  it('calls onToggle when clicked', () => {
    const handleToggle = vi.fn()
    render(
      <SyncStatus
        connected={true}
        syncMode="auto"
        pendingCount={0}
        onToggle={handleToggle}
      />
    )
    const pill = screen.getByRole('button')
    fireEvent.click(pill)
    expect(handleToggle).toHaveBeenCalledTimes(1)
  })

  it('meets minimum touch target size (44px)', () => {
    const { container } = render(
      <SyncStatus
        connected={true}
        syncMode="auto"
        pendingCount={0}
        onToggle={() => {}}
      />
    )
    const pill = container.querySelector('button')
    expect(pill).toHaveStyle({ minHeight: '44px' })
  })
})
