import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/coach', label: 'Coach', icon: '💬' },
  { to: '/strategies', label: 'QRL Verified', icon: '🛡' },
  { to: '/discover', label: 'Discover', icon: '🔍' },
  { to: '/iasg', label: 'IASG', icon: '📊' },
  { to: '/ledger', label: 'Ledger', icon: '⛓' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-brand">
          <img src="/phoenix.svg" alt="" className="header-logo" />
          <span className="header-title">QRL Phoenix</span>
        </div>
        <nav className="header-nav">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{t.icon}</span>
              <span className="nav-label">{t.label}</span>
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
