import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { FaShoppingCart, FaArrowLeft, FaChevronLeft, FaChevronRight, FaRuler, FaBox, FaPalette, FaClock, FaStar } from 'react-icons/fa';
import './ProductoDetalle.css';

function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imagenActual, setImagenActual] = useState(0);
  const [agregado, setAgregado] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [prodRes, detalleRes, imagenesRes] = await Promise.all([
          API.get(`/Productos/${id}`),
          API.get(`/ProductoDetalles/producto/${id}`).catch(() => ({ data: null })),
          API.get(`/ProductoDetalleImagenes/producto/${id}`).catch(() => ({ data: [] })),
        ]);
        setProducto(prodRes.data);
        setDetalle(detalleRes.data);
        setImagenes(imagenesRes.data || []);
      } catch (error) {
        console.error('Error cargando producto:', error);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [id]);

  // Carrusel automático cada 4 segundos
  useEffect(() => {
    if (imagenes.length <= 1) return;
    const intervalo = setInterval(() => {
      setImagenActual((prev) =>
        prev === imagenes.length - 1 ? 0 : prev + 1
      );
    }, 2000);
    return () => clearInterval(intervalo);
  }, [imagenes]);

  const anterior = () => {
    setImagenActual((prev) =>
      prev === 0 ? imagenes.length - 1 : prev - 1
    );
  };

  const siguiente = () => {
    setImagenActual((prev) =>
      prev === imagenes.length - 1 ? 0 : prev + 1
    );
  };

  const agregarAlCarrito = () => {
    const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    const existe = carrito.find((p) => p.idProducto === producto.idProducto);
    if (existe) {
      existe.cantidad += 1;
    } else {
      carrito.push({ ...producto, cantidad: 1 });
    }
    localStorage.setItem('carrito', JSON.stringify(carrito));
    navigate('/carrito');
  };

  if (loading) return <div className="loading">⏳ Cargando producto...</div>;
  if (!producto) return <div className="loading">😕 Producto no encontrado</div>;

  return (
    <div className="detalle-container">

      {/* Botón volver */}
      <button className="btn-volver" onClick={() => navigate('/catalogo')}>
        <FaArrowLeft /> Volver al Catálogo
      </button>

      <div className="detalle-layout">

        {/* Carrusel imágenes */}
        <div className="detalle-carrusel">
          {imagenes.length > 0 ? (
            <>
              <div className="carrusel-principal">
                <img
                  src={imagenes[imagenActual]?.urlImagen}
                  alt={producto.nombre}
                  className="carrusel-imagen"
                />
                {imagenes.length > 1 && (
                  <>
                    <button className="carrusel-btn izq" onClick={anterior}>
                      <FaChevronLeft />
                    </button>
                    <button className="carrusel-btn der" onClick={siguiente}>
                      <FaChevronRight />
                    </button>
                  </>
                )}
              </div>

              {/* Miniaturas */}
              {imagenes.length > 1 && (
                <div className="carrusel-miniaturas">
                  {imagenes.map((img, index) => (
                    <img
                      key={img.idImagenDetalle}
                      src={img.urlImagen}
                      alt={`imagen ${index + 1}`}
                      className={`miniatura ${imagenActual === index ? 'activa' : ''}`}
                      onClick={() => setImagenActual(index)}
                    />
                  ))}
                </div>
              )}

              {/* Dots */}
              {imagenes.length > 1 && (
                <div className="carrusel-dots">
                  {imagenes.map((_, index) => (
                    <button
                      key={index}
                      className={`dot ${imagenActual === index ? 'activo' : ''}`}
                      onClick={() => setImagenActual(index)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="sin-imagen-detalle">🪑</div>
          )}
        </div>

        {/* Info del producto */}
        <div className="detalle-info">
          <span className="detalle-categoria">
            {producto.categoria?.nombre}
          </span>

          <h1 className="detalle-nombre">{producto.nombre}</h1>
          <p className="detalle-descripcion">{producto.descripcion}</p>

          {/* Especificaciones */}
          {detalle && (
            <div className="detalle-specs">
              <h3><FaRuler /> Especificaciones</h3>
              <div className="specs-grid">
                {detalle.alto && (
                  <div className="spec-item">
                    <span className="spec-label">Alto</span>
                    <span className="spec-valor">{detalle.alto}</span>
                  </div>
                )}
                {detalle.ancho && (
                  <div className="spec-item">
                    <span className="spec-label">Ancho</span>
                    <span className="spec-valor">{detalle.ancho}</span>
                  </div>
                )}
                {detalle.profundidad && (
                  <div className="spec-item">
                    <span className="spec-label">Profundidad</span>
                    <span className="spec-valor">{detalle.profundidad}</span>
                  </div>
                )}
                {detalle.color && (
                  <div className="spec-item">
                    <span className="spec-label"><FaPalette /> Color</span>
                    <span className="spec-valor">{detalle.color}</span>
                  </div>
                )}
                {detalle.material && (
                  <div className="spec-item spec-full">
                    <span className="spec-label">Material</span>
                    <span className="spec-valor">{detalle.material}</span>
                  </div>
                )}
                {detalle.duracion && (
                  <div className="spec-item spec-full">
                    <span className="spec-label"><FaClock /> Duración</span>
                    <span className="spec-valor">{detalle.duracion}</span>
                  </div>
                )}
              </div>

              {/* Características */}
              {detalle.caracteristicas && (
                <div className="caracteristicas">
                  <h4><FaStar /> Características</h4>
                  <p>{detalle.caracteristicas}</p>
                </div>
              )}
            </div>
          )}

          {/* Stock */}
          <div className="detalle-stock">
            <FaBox />
            {producto.inventario ? (
              <span className={`badge-stock ${
                producto.inventario.stock === 0 ? 'badge-agotado' :
                producto.inventario.stock <= producto.inventario.stockMinimo
                  ? 'badge-bajo' : 'badge-ok'
              }`}>
                {producto.inventario.stock === 0
                  ? '❌ Agotado'
                  : producto.inventario.stock <= producto.inventario.stockMinimo
                  ? `⚠️ Últimas ${producto.inventario.stock} unidades`
                  : `✅ En stock: ${producto.inventario.stock} unidades`}
              </span>
            ) : (
              <span className="badge-stock badge-bajo">Sin inventario</span>
            )}
          </div>

          {/* Precio y botón */}
          <div className="detalle-footer">
            <div className="detalle-precio">
              <span>${producto.precio.toFixed(2)}</span>
            </div>
            <button
              className={`btn-agregar ${agregado ? 'agregado' : ''}`}
              onClick={agregarAlCarrito}
              disabled={producto.inventario?.stock === 0}
            >
              <FaShoppingCart />
              {agregado ? '✅ ¡Agregado al carrito!' : 'Agregar al Carrito'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductoDetalle;