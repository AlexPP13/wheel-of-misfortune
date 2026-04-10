import type { ReactNode } from 'react'

type AppShellProps = {
  children: ReactNode
}

function AppShell({ children }: AppShellProps) {
  return (
    <main className="relative isolate overflow-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <div className="aurora aurora-a" />
        <div className="aurora aurora-b" />
        <div className="aurora aurora-c" />
        <div className="grid-haze" />
      </div>
      {children}
    </main>
  )
}

export default AppShell
