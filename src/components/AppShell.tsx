import { Mic, Network, NotebookText, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';

const navItems = [
  { to: '/capturar', label: 'Capturar', icon: Mic },
  { to: '/notas', label: 'Notas', icon: NotebookText },
  { to: '/conexoes', label: 'Conexões', icon: Network },
  { to: '/ajustes', label: 'Ajustes', icon: Settings }
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <main className="app-main">{children}</main>
      <nav className="bottom-nav" aria-label="Navegação principal">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
