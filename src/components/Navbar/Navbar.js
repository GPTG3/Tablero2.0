import { useState, useEffect, useRef } from 'react';
import './Navbar.css';
import { Link, useLocation } from 'react-router-dom';

function Navbar({ user, handleLogout }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isLandingPage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getUserInitial = () => {
    if (user && user.email) {
      // Get the part before @ and take its first letter
      const username = user.email.split('@')[0];
      return username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Get username (part before @)
  const getUsername = () => {
    if (user && user.email) {
      // Split at @ and take first part
      return user.email.split('@')[0];
    }
    return '';
  };

  return (
    <div className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-logo">
        <Link to="/">Tablero 2.0</Link>
      </div>

      {/* Only show menu button if not on login page and user is logged in */}
      {!isLoginPage && user && (
        <button className="menu-button" onClick={toggleMenu}>
          {menuOpen ? '✕' : '☰'}
        </button>
      )}

      <ul className={`navbar-links ${menuOpen ? 'show' : ''}`}>
        {/* Navigation links - only show when user is logged in and not on login page */}
        {user && !isLoginPage && (
          <>
            <li>
              <Link to="/panel" className={location.pathname === '/panel' ? 'active' : ''}>
                Panel
              </Link>
            </li>
            <li>
              <Link to="/historial" className={location.pathname === '/historial' ? 'active' : ''}>
                Historial
              </Link>
            </li>
          </>
        )}
        
        {/* Login link - only show on landing page when user is not logged in */}
        {!user && isLandingPage && (
          <li>
            <Link to="/login" className={location.pathname === '/login' ? 'active' : ''}>
              Iniciar sesión
            </Link>
          </li>
        )}
        
        {/* User dropdown - show when user is logged in and not on login page */}
        {user && !isLoginPage && (
          <li className="user-dropdown" ref={dropdownRef}>
            <div className="user-indicator" onClick={toggleDropdown}>
              <div className="user-avatar">{getUserInitial()}</div>
              <span>{getUsername()}</span>
            </div>
            {dropdownOpen && (
              <div className="dropdown-menu">
                <button onClick={handleLogout}>Cerrar sesión</button>
              </div>
            )}
          </li>
        )}
      </ul>
    </div>
  );
}

export default Navbar;
