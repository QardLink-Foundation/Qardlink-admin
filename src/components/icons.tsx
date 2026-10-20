import type { ReactNode } from 'react'

export type IconName =
  | 'grid'
  | 'inbox'
  | 'receipt'
  | 'droplet'
  | 'handshake'
  | 'users'
  | 'alert'
  | 'shield'
  | 'chart'
  | 'team'
  | 'bell'
  | 'server'
  | 'userList'
  | 'list'
  | 'user'
  | 'search'
  | 'logout'
  | 'chevronRight'
  | 'chevronDown'
  | 'plus'
  | 'check'
  | 'x'
  | 'arrowRight'
  | 'menu'
  | 'phone'
  | 'mail'
  | 'download'
  | 'refresh'
  | 'clock'

const paths: Record<IconName, ReactNode> = {
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.4" />
    </>
  ),
  inbox: (
    <>
      <path d="M4 13.5V6a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 20 6v7.5" />
      <path d="M4 13.5h4l1.5 2.5h5L16 13.5h4v4.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18v-4.5Z" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3.5h12v17l-2-1.4-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4v-17Z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  droplet: <path d="M12 3.5c3.2 4 6 7.1 6 10.2a6 6 0 0 1-12 0C6 10.6 8.8 7.5 12 3.5Z" />,
  handshake: (
    <>
      <path d="m8 12 2.5-2.5a2 2 0 0 1 2.8 0L16 12" />
      <path d="M3.5 10.5 7 7h4M20.5 10.5 17 7h-4" />
      <path d="M3.5 10.5 8 15m12.5-4.5L16 15M8 15l2 2 2-2 2 2 2-2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 5.4a3.2 3.2 0 0 1 0 5.2M17.5 14.8c1.8.6 3 2.2 3 4.2" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4 21 19.5H3L12 4Z" />
      <path d="M12 9.5v4M12 16.5h.01" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5 19.5 6v6c0 4.2-3.2 7.2-7.5 8.5C7.7 19.2 4.5 16.2 4.5 12V6L12 3.5Z" />
      <path d="m8.8 11.8 2.2 2.2 4.4-4.4" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4M4 20h16" />
      <path d="M8 16v-4M12 16V8M16 16v-6M20 16v-2" />
    </>
  ),
  team: (
    <>
      <circle cx="12" cy="7" r="3" />
      <path d="M5.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15L6 16.5Z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  server: (
    <>
      <rect x="3.5" y="4" width="17" height="6.5" rx="1.4" />
      <rect x="3.5" y="13.5" width="17" height="6.5" rx="1.4" />
      <path d="M7 7.2h.01M7 16.7h.01" />
    </>
  ),
  userList: (
    <>
      <circle cx="8" cy="8" r="3" />
      <path d="M3 19c0-3 2.2-5 5-5s5 2 5 5M15 7h6M15 11h6M15 15h4" />
    </>
  ),
  list: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.4 3.1-6 7-6s7 2.6 7 6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  logout: (
    <>
      <path d="M14 4.5H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 19.5h8" />
      <path d="M16 8.5 19.5 12 16 15.5M10 12h9.5" />
    </>
  ),
  chevronRight: <path d="m9.5 6 6 6-6 6" />,
  chevronDown: <path d="m6 9.5 6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  arrowRight: <path d="M4 12h16m-5.5-5.5L20 12l-5.5 5.5" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  phone: (
    <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" />
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.6" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </>
  ),
  download: <path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14" />,
  refresh: (
    <>
      <path d="M20 11a8 8 0 1 0-2.3 6" />
      <path d="M20 4.5V11h-6.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
}

export function Icon({
  name,
  className = 'size-4',
  strokeWidth = 1.7,
}: {
  name: IconName
  className?: string
  strokeWidth?: number
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}
