export default function DashboardIcon({ name }) {
  const paths = {
    arrow: 'M5 12h14 M14 7l5 5-5 5',
    chevron: 'M9 5l7 7-7 7',
    plus: 'M12 5v14 M5 12h14',
    up: 'M7 17 17 7 M7 7h10v10',
    groceries: 'M3 9h18l-2 11H5z M7 9l5-7 5 7 M9 13v4 M15 13v4',
    utilities: 'M13 2 4 14h7l-1 8L20 9h-8z',
    dining: 'M4 3h12v11a6 6 0 0 1-12 0z M16 5h2a4 4 0 0 1 0 8h-2 M2 22h17',
    household: 'M5 12V5h14v7 M3 10v10h18V10 M3 16h18 M6 20v2 M18 20v2',
    overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    expenses: 'M5 3h14v18l-3-2-4 2-4-2-3 2z M8 7h8 M8 11h8 M8 15h4',
    balances: 'M3 6h16v14H3z M3 6V3h13v3 M15 11h6v5h-6z',
    upcoming: 'M4 5h16v16H4z M8 2v6 M16 2v6 M4 11h16',
    insights: 'M4 20V10 M10 20V4 M16 20v-7 M22 20V7',
    activity: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 4a4 4 0 0 1 0 7 M22 21v-2a4 4 0 0 0-3-4',
    home: 'M3 10l9-7 9 7v11H3z M9 21v-8h6v8',
  }

  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={paths[name]} />
    </svg>
  )
}

