export function ReportIssueButton() {
  const handleReportIssue = () => {
    // Pre-fill the GitHub issue template
    const title = encodeURIComponent('Bug Report: ')
    const body = encodeURIComponent(`## Description
<!-- Describe what went wrong -->

## Steps to Reproduce
1.
2.
3.

## Expected Behavior
<!-- What should have happened -->

## Actual Behavior
<!-- What actually happened -->

## Device Info
- Browser: ${navigator.userAgent}
- Screen: ${window.innerWidth}x${window.innerHeight}
- Date: ${new Date().toISOString()}

## Additional Context
<!-- Any other relevant information -->
`)

    const repoUrl = 'https://github.com/JesseFlip/meal-plan'
    const issueUrl = `${repoUrl}/issues/new?title=${title}&body=${body}`

    window.open(issueUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleReportIssue}
      className="px-3 py-2 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors flex items-center gap-2 shadow-sm hover:shadow"
      title="Report a bug or issue"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span className="hidden sm:inline">Report Issue</span>
    </button>
  )
}
