import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaPlus, FaMinus, FaShoppingCart, FaWhatsapp, FaArrowRight } from 'react-icons/fa';
import './Carrito.css';

function Carrito() {
  const [carrito, setCarrito] = useState([]);
  const [avisoStock, setAvisoStock] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('carrito') || '[]');
    setCarrito(data);
  }, []);

  const actualizarCantidad = (idProducto, delta) => {
    setAvisoStock(null);
    const updated = carrito.map((p) => {
      if (p.idProducto === idProducto) {
        const nueva = p.cantidad + delta;
        if (nueva <= 0) return null;
        const maxStock = p.inventario?.stock || 999;
        if (nueva > maxStock) {
          setAvisoStock(`⚠️ Solo hay ${maxStock} unidades disponibles de "${p.nombre}"`);
          return p;
        }
        return { ...p, cantidad: nueva };
      }
      return p;
    }).filter(Boolean);
    setCarrito(updated);
    localStorage.setItem('carrito', JSON.stringify(updated));
  };

  const eliminarProducto = (idProducto) => {
    const producto = carrito.find(p => p.idProducto === idProducto);
    if (!window.confirm(`¿Eliminar "${producto?.nombre}" del carrito?`)) return;
    const updated = carrito.filter((p) => p.idProducto !== idProducto);
    setCarrito(updated);
    localStorage.setItem('carrito', JSON.stringify(updated));
  };

  const limpiarCarrito = () => {
    if (!window.confirm('¿Estás seguro que deseas vaciar todo el carrito?')) return;
    setCarrito([]);
    localStorage.removeItem('carrito');
  };

  const total = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

  if (carrito.length === 0) {
    return (
      <div className="carrito-vacio">
        <FaShoppingCart className="carrito-vacio-icon" />
        <h2>Tu carrito está vacío</h2>
        <p>Agrega productos desde el catálogo</p>
        <a href="/catalogo" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}>
          Ver Catálogo
        </a>
      </div>
    );
  }

  return (
    <div className="carrito-container">
      <h1 className="page-title">🛒 Carrito de Compras</h1>

      {avisoStock && (
        <div className="aviso-stock">
          {avisoStock}
        </div>
      )}

      <div className="carrito-layout">

        {/* Lista productos */}
        <div className="carrito-productos">
          <div className="carrito-header">
            <h2>Productos ({carrito.length})</h2>
            <button className="btn-danger" onClick={limpiarCarrito}>
              <FaTrash /> Vaciar
            </button>
          </div>

          {carrito.map((producto) => (
            <div key={producto.idProducto} className="carrito-item">
              <div className="item-imagen">
                {producto.imagenes && producto.imagenes.length > 0 ? (
                  <img
                    src={producto.imagenes.find((i) => i.esPrincipal)?.urlImagen || producto.imagenes[0].urlImagen}
                    alt={producto.nombre}
                  />
                ) : (
                  <div className="item-sin-imagen">🪑</div>
                )}
              </div>
              <div className="item-info">
                <h3>{producto.nombre}</h3>
                <p className="item-categoria">{producto.categoria?.nombre}</p>
                <p className="item-precio">${producto.precio.toFixed(2)} c/u</p>
                {producto.inventario?.stock && (
                  <p className="item-stock-max">
                    Stock disponible: {producto.inventario.stock} unidades
                  </p>
                )}
              </div>
              <div className="item-cantidad">
                <button
                  onClick={() => actualizarCantidad(producto.idProducto, -1)}
                  disabled={producto.cantidad <= 1}
                >
                  <FaMinus />
                </button>
                <span>{producto.cantidad}</span>
                <button
                  onClick={() => actualizarCantidad(producto.idProducto, 1)}
                  disabled={producto.cantidad >= (producto.inventario?.stock || 999)}
                >
                  <FaPlus />
                </button>
              </div>
              <div className="item-subtotal">
                <span>${(producto.precio * producto.cantidad).toFixed(2)}</span>
              </div>
              <button className="item-eliminar" onClick={() => eliminarProducto(producto.idProducto)}>
                <FaTrash />
              </button>
            </div>
          ))}
        </div>

        {/* Panel resumen */}
        <div className="carrito-resumen">
          <div className="card">
            <h2>Resumen del Pedido</h2>

            <div className="resumen-lineas">
              {carrito.map((p) => (
                <div key={p.idProducto} className="resumen-linea">
                  <span>{p.nombre} x{p.cantidad}</span>
                  <span>${(p.precio * p.cantidad).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="resumen-total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <div className="pago-resumen">
              <h3>💳 Métodos de Pago Disponibles</h3>
              <div className="pago-metodos-resumen">
                <div className="pago-metodo-item">
                  <FaWhatsapp className="pago-metodo-icon whatsapp" />
                  <span>Tarjeta de Crédito via WhatsApp</span>
                </div>
                <div className="pago-metodo-item">
                  <span className="pago-metodo-icon pichincha-dot"></span>
                  <span>Transferencia Banco Pichincha</span>
                </div>
                <div className="pago-metodo-item">
                  <span className="pago-metodo-icon guayaquil-dot"></span>
                  <span>Transferencia Banco Guayaquil</span>
                </div>
              </div>
            </div>

            <button className="btn-confirmar" onClick={() => navigate('/checkout')}>
              🛍️ Proceder al Pago <FaArrowRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Carrito;