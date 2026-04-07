import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

function Navbar() {
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem('user');
      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        setUser(null);
      }
    };
    
    checkUser();
    
    window.addEventListener('storage', checkUser);
    window.addEventListener('userChanged', checkUser);
    
    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('userChanged', checkUser);
    };
  }, [location]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setMobileMenuOpen(false);
    window.dispatchEvent(new Event('userChanged'));
    window.location.href = '/';
  };

  const navLinks = [
    { to: '/courses', label: 'Courses' },
    ...(user ? [{ to: '/dashboard', label: 'Dashboard' }] : []),
    ...(isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="text-lg sm:text-xl font-bold text-blue-600">
            EduTech
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-600 hover:text-blue-600 font-medium transition-colors text-sm min-h-[48px] flex items-center px-2"
              >
                {link.label}
              </Link>
            ))}
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/profile"
                  className="text-gray-600 hover:text-blue-600 text-sm font-medium min-h-[48px] flex items-center px-2"
                >
                  {user.name}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 text-sm font-medium min-h-[48px] flex items-center px-2"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors min-h-[48px] flex items-center"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors min-h-[48px] flex items-center"
                >
                  Signup
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 min-w-[48px] min-h-[48px] flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 bg-white z-50">
          <div className="flex flex-col p-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-gray-700 hover:bg-gray-50 px-4 py-3 min-h-[48px] rounded-lg font-medium text-base flex items-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            <div className="border-t border-gray-100 my-2" />
            
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="text-gray-700 hover:bg-gray-50 px-4 py-3 min-h-[48px] rounded-lg font-medium text-base flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {user.name}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-left text-red-600 hover:bg-red-50 px-4 py-3 min-h-[48px] rounded-lg font-medium text-base flex items-center"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:bg-gray-50 px-4 py-3 min-h-[48px] rounded-lg font-medium text-base flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white px-4 py-3 min-h-[48px] rounded-lg font-medium text-base text-center flex items-center justify-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Signup
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
