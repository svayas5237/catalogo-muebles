import { useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBoxes, FaShoppingCart, FaPlusSquare, FaStore, FaHome, FaSignOutAlt, FaUserCircle, FaSignInAlt, FaReceipt, FaUserCog, FaThList, FaBars, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import './Navbar.css';

function Navbar() {
  const location = useLocation();
  const { usuario, logout, tienePermiso } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const linksRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuAbierto(false);
  };

  const scrollLinks = (dir) => {
    if (linksRef.current) {
      linksRef.current.scrollBy({ left: dir * 120, behavior: 'smooth' });
    }
  };

  const links = [
    { to: '/', label: 'Inicio', icon: <FaHome />, acceso: 'todos', permiso: 'inicio' },
    { to: '/catalogo', label: 'Catálogo', icon: <FaStore />, acceso: 'todos', permiso: 'catalogo' },
    { to: '/carrito', label: 'Carrito', icon: <FaShoppingCart />, acceso: 'todos', permiso: 'carrito' },
    { to: '/ventas', label: 'Ventas', icon: <FaReceipt />, acceso: ['vendedor', 'gerente'], permiso: 'ventas' },
    { to: '/inventario', label: 'Inventario', icon: <FaBoxes />, acceso: ['gerente'], permiso: 'inventario' },
    { to: '/usuarios', label: 'Usuarios', icon: <FaUserCog />, acceso: ['gerente'], permiso: 'usuarios' },
    { to: '/categorias', label: 'Categorías', icon: <FaThList />, acceso: ['vendedor', 'gerente'], permiso: 'categorias' },
    { to: '/registro-mueble', label: 'Nuevo Mueble', icon: <FaPlusSquare />, acceso: ['vendedor', 'gerente'], permiso: 'registro-mueble' },
    { to: '/gestion-muebles', label: 'Mis Muebles', icon: <FaThList />, acceso: ['vendedor', 'gerente'], permiso: 'gestion-muebles' },
  ];

  const linksFiltrados = links.filter(link => {
    if (link.acceso === 'todos') return true;
    if (!usuario) return false;
    if (usuario.rol === 'gerente') return true;
    return tienePermiso(link.permiso);
  });
  return (
    <nav className="navbar">

      {/* Brand */}
      <div className="navbar-brand">
        <img src={logo} alt="Ecology Muebles" className="brand-logo" />
        <span className="brand-texto">ECOLOGY MUEBLES</span>
      </div>

      {/* Centro: flecha izq + links + flecha der */}
      <div className="navbar-center">
        <button className="navbar-scroll-btn" onClick={() => scrollLinks(-1)}>
          <FaChevronLeft />
        </button>

        <ul className="navbar-links" ref={linksRef}>
          {linksFiltrados.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className={location.pathname === link.to ? 'active' : ''}
                onClick={() => setMenuAbierto(false)}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <button className="navbar-scroll-btn" onClick={() => scrollLinks(1)}>
          <FaChevronRight />
        </button>
      </div>

      {/* Sesión — siempre visible al lado derecho */}
      <div className="navbar-sesion">
        {usuario ? (
          <>
            <span className="usuario-nombre">
              <FaUserCircle />
              <span className="usuario-nombre-texto">{usuario.nombre}</span>
              <span className={`rol-badge ${usuario.rol}`}>
                {usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}
              </span>
            </span>
            <button className="btn-logout" onClick={handleLogout}>
              <FaSignOutAlt />
              <span className="logout-texto"> Salir</span>
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className={`btn-login ${location.pathname === '/login' ? 'active' : ''}`}
            onClick={() => setMenuAbierto(false)}
          >
            <FaSignInAlt />
            <span> Ingresar</span>
          </Link>
        )}
      </div>

      {/* Hamburguesa — solo mobile */}
      <button
        className="navbar-hamburguesa"
        onClick={() => setMenuAbierto(!menuAbierto)}
      >
        {menuAbierto ? <FaTimes /> : <FaBars />}
      </button>

      {/* Menú mobile */}
      {menuAbierto && (
        <>
          <ul className="navbar-mobile-menu">
            {linksFiltrados.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={location.pathname === link.to ? 'active' : ''}
                  onClick={() => setMenuAbierto(false)}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
            <li className="navbar-sesion-mobile">
              {usuario ? (
                <>
                  <span className="usuario-nombre">
                    <FaUserCircle />
                    {usuario.nombre}
                    <span className={`rol-badge ${usuario.rol}`}>
                      {usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}
                    </span>
                  </span>
                  <button className="btn-logout" onClick={handleLogout}>
                    <FaSignOutAlt /> Salir
                  </button>
                </>
              ) : (
                <Link to="/login" className="btn-login" onClick={() => setMenuAbierto(false)}>
                  <FaSignInAlt /> Ingresar
                </Link>
              )}
            </li>
          </ul>
          <div className="navbar-overlay" onClick={() => setMenuAbierto(false)} />
        </>
      )}
    </nav>
  );
}

export default Navbar;