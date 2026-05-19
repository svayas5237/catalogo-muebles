import { useEffect, useState } from 'react';
import API from '../api/axios';
import { FaSearch, FaTag, FaEye, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './Catalogo.css';

function Catalogo() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [submenuAbierto, setSubmenuAbierto] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          API.get('/Productos'),
          API.get('/Categorias/padres'),
        ]);
        setProductos(prodRes.data);
        setCategorias(catRes.data);
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const productosFiltrados = productos.filter((p) => {
    let coincideCategoria = categoriaSeleccionada === 'todas';

    if (!coincideCategoria) {
      const catSelec = categorias.find(c => String(c.idCategoria) === categoriaSeleccionada);
      if (catSelec) {
        const idsValidos = [catSelec.idCategoria, ...(catSelec.subCategorias?.map(s => s.idCategoria) || [])];
        coincideCategoria = idsValidos.includes(p.idCategoria);
      } else {
        coincideCategoria = p.idCategoria === parseInt(categoriaSeleccionada);
      }
    }

    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  if (loading) return <div className="loading">⏳ Cargando catálogo...</div>;

  return (
    <div className="catalogo-container">
      <h1 className="page-title">🛋️ Catálogo de Muebles</h1>

      {/* Filtros */}
      <div className="filtros">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar mueble..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="categorias-filter">
          <button
            className={categoriaSeleccionada === 'todas' ? 'cat-btn active' : 'cat-btn'}
            onClick={() => {
              setCategoriaSeleccionada('todas');
              setSubmenuAbierto(null);
            }}
          >
            Todas
          </button>

          {categorias.map((cat) => (
            <div key={cat.idCategoria} className="cat-btn-wrapper">
              <button
                className={`cat-btn ${categoriaSeleccionada === String(cat.idCategoria) ? 'active' : ''}`}
                onClick={() => {
                  if (cat.subCategorias && cat.subCategorias.length > 0) {
                    setSubmenuAbierto(submenuAbierto === cat.idCategoria ? null : cat.idCategoria);
                  } else {
                    setCategoriaSeleccionada(String(cat.idCategoria));
                    setSubmenuAbierto(null);
                  }
                }}
              >
                {cat.nombre}
                {cat.subCategorias?.length > 0 && (
                  <span className="cat-arrow">
                    {submenuAbierto === cat.idCategoria ? <FaChevronUp /> : <FaChevronDown />}
                  </span>
                )}
              </button>

              {submenuAbierto === cat.idCategoria && cat.subCategorias?.length > 0 && (
                <div className="cat-submenu">
                  <button
                    className={`cat-sub-btn ${categoriaSeleccionada === String(cat.idCategoria) ? 'active' : ''}`}
                    onClick={() => {
                      setCategoriaSeleccionada(String(cat.idCategoria));
                      setSubmenuAbierto(null);
                    }}
                  >
                    Todos los {cat.nombre}
                  </button>
                  {cat.subCategorias.map((sub) => (
                    <button
                      key={sub.idCategoria}
                      className={`cat-sub-btn ${categoriaSeleccionada === String(sub.idCategoria) ? 'active' : ''}`}
                      onClick={() => {
                        setCategoriaSeleccionada(String(sub.idCategoria));
                        setSubmenuAbierto(null);
                      }}
                    >
                      └ {sub.nombre}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Grid de productos */}
      {productosFiltrados.length === 0 ? (
        <div className="no-resultados">😕 No se encontraron productos</div>
      ) : (
        <div className="productos-grid">
          {productosFiltrados.map((producto) => (
            <div key={producto.idProducto} className="producto-card">

              {/* Imagen */}
              <div className="producto-imagen">
                {producto.imagenes && producto.imagenes.length > 0 ? (
                  <img
                    src={
                      producto.imagenes.find((i) => i.esPrincipal)?.urlImagen ||
                      producto.imagenes[0].urlImagen
                    }
                    alt={producto.nombre}
                  />
                ) : (
                  <div className="sin-imagen">🪑</div>
                )}
                <span className="categoria-badge">
                  <FaTag /> {producto.categoria?.nombre}
                </span>
              </div>

              {/* Info */}
              <div className="producto-info">
                <h3>{producto.nombre}</h3>
                <p className="producto-descripcion">{producto.descripcion}</p>

                {/* Stock */}
                <div className="stock-info">
                  {producto.inventario ? (
                    <span
                      className={`badge-stock ${
                        producto.inventario.stock === 0
                          ? 'badge-agotado'
                          : producto.inventario.stock <= producto.inventario.stockMinimo
                          ? 'badge-bajo'
                          : 'badge-ok'
                      }`}
                    >
                      {producto.inventario.stock === 0
                        ? '❌ Agotado'
                        : producto.inventario.stock <= producto.inventario.stockMinimo
                        ? `⚠️ Últimas ${producto.inventario.stock} unidades`
                        : `✅ Stock: ${producto.inventario.stock}`}
                    </span>
                  ) : (
                    <span className="badge-stock badge-bajo">Sin inventario</span>
                  )}
                </div>

                {/* Footer */}
                <div className="producto-footer">
                  <span className="precio">${producto.precio.toFixed(2)}</span>
                  <Link to={`/producto/${producto.idProducto}`} className="btn-ver-detalle">
                    <FaEye /> Ver Detalle
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Catalogo;