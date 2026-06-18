import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/map', label: 'Risk Map' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/repeat-offenders', label: 'Repeat Offenders' },
  { to: '/patrol', label: 'Patrol Planner' },
];

export default function Navigation() {
  return (
    <nav aria-label="Main navigation" className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex-shrink-0 font-semibold text-gray-900 text-lg">
            Parking Violation System
          </div>
          <div className="flex space-x-1 overflow-x-auto">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
