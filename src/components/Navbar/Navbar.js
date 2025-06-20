import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import styles from "./Navbar.module.css";

function Navbar({ user, handleLogout }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const isLandingPage = location.pathname === "/";
  const navigate = useNavigate();

  // Añadir un temporizador para debounce
  const scrollTimerRef = useRef(null);
  // Umbral de scroll mejorado
  const scrollThreshold = 20; // Aumentado para mayor estabilidad

  const handleLogoutAndCloseMenu = () => {
    setMenuOpen(false);
    setDropdownOpen(false);
    handleLogout();
    navigate("/");
  };

  useEffect(() => {
    const handleScroll = () => {
      // Limpiar cualquier temporizador pendiente
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }

      // Establecer un temporizador de 50ms para debounce
      scrollTimerRef.current = setTimeout(() => {
        // Solo cambiar el estado si estamos claramente por encima o por debajo del umbral
        if (window.scrollY > scrollThreshold + 10) {
          if (!isScrolled) setIsScrolled(true);
        } else if (window.scrollY < scrollThreshold - 10) {
          if (isScrolled) setIsScrolled(false);
        }
        // En la zona intermedia (scrollThreshold ± 10px) no cambiamos nada
      }, 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, [isScrolled]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getUserInitial = () => {
    if (user && user.email) {
      // Get the part before @ and take its first letter
      const username = user.email.split("@")[0];
      return username.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Get username (part before @)
  const getUsername = () => {
    if (user && user.email) {
      // Split at @ and take first part
      return user.email.split("@")[0];
    }
    return "";
  };

  return (
    <div
      className={`${styles.navbar} ${
        isScrolled ? styles["navbar-scrolled"] : ""
      }`}
    >
      <div className={styles["navbar-logo"]}>
        <Link to="/">
          <img src={logo} alt="Tablero 2.0" className={styles["logo-image"]} />
          <span className={styles["logo-text"]}>Tablero 2.0</span>
        </Link>
      </div>

      {/* Only show menu button if not on login page and user is logged in */}
      {!isLoginPage && user && (
        <button className={styles["menu-button"]} onClick={toggleMenu}>
          {menuOpen ? "✕" : "☰"}
        </button>
      )}

      <ul
        className={`${styles["navbar-links"]} ${menuOpen ? styles.show : ""}`}
      >
        {/* Navigation links - only show when user is logged in and not on login page */}
        {user && !isLoginPage && (
          <>
            <li>
              <Link
                to="/panel"
                className={location.pathname === "/panel" ? styles.active : ""}
              >
                Panel
              </Link>
            </li>
            <li>
              <Link
                to="/historial"
                className={
                  location.pathname === "/historial" ? styles.active : ""
                }
              >
                Historial
              </Link>
            </li>
            <li>
              <Link
                to="/tableros"
                className={
                  location.pathname === "/tableros" ? styles.active : ""
                }
              >
                Tableros
              </Link>
            </li>
          </>
        )}

        {/* Login link - only show on landing page when user is not logged in */}
        {!user && isLandingPage && (
          <li>
            <Link
              to="/login"
              className={location.pathname === "/login" ? styles.active : ""}
            >
              Iniciar sesión
            </Link>
          </li>
        )}

        {/* User dropdown - show when user is logged in and not on login page */}
        {user && !isLoginPage && (
          <li className={styles["user-dropdown"]} ref={dropdownRef}>
            <div className={styles["user-indicator"]} onClick={toggleDropdown}>
              <div className={styles["user-avatar"]}>{getUserInitial()}</div>
              <span>{getUsername()}</span>
            </div>
            {dropdownOpen && (
              <div className={styles["dropdown-menu"]}>
                <Link to="/cambiar-password" className={styles["dropdown-link"]}>
                  Cambiar Contraseña
                </Link>
                <button onClick={handleLogoutAndCloseMenu}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </li>
        )}
      </ul>
    </div>
  );
}

export default Navbar;
