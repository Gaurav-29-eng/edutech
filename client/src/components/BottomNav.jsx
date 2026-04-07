import { Link, useLocation } from 'react-router-dom';

function BottomNav() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/courses', label: 'Courses', icon: '📚' },
    ...(user ? [{ path: '/dashboard', label: 'Dashboard', icon: '📊' }] : []),
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav 
      className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] px-2 py-1 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="text-xl mb-0.5">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default BottomNav;
