import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FaCalendarAlt, FaMapMarkerAlt, FaUser, FaSearch } from 'react-icons/fa';
import './Compras.css';

function Compras() {
  const { usuario } = useAuth();
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [correoInput, setCorreoInput] = useState('');

  const buscarCompras = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const resVentas = await API.get(`/Ventas/mis-compras/${email}`);
      setCompras(resVentas.data || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.mensaje || "No se encontraron compras para este correo.");
      setCompras([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (usuario?.email) {
      // Si está logueado, busca SUS compras automáticamente
      const timer = setTimeout(() => {
        buscarCompras(usuario.email);
      }, 0);
      return () => clearTimeout(timer);
    } else {
      // Si es un invitado, usamos setTimeout para limpiar los estados 
      // y evitar la advertencia de "renderizados en cascada"
      const timerLimpieza = setTimeout(() => {
        setCompras([]);
        setCorreoInput('');
      }, 0);
      return () => clearTimeout(timerLimpieza);
    }
  }, [usuario]);

  const handleBuscar = (e) => {
    e.preventDefault();
    // Bloqueo de seguridad en el frontend: un usuario logueado no puede usar esta función
    if (!usuario && correoInput.trim()) {
      buscarCompras(correoInput.trim());
    }
  };

  return (
    <div className="mis-compras-container">
      <h1 className="titulo-compras">Mi Historial de Compras</h1>
      
      {/* 
        Manejo de Vistas:
        - Si NO hay usuario (invitado): Muestra el buscador.
        - Si SÍ hay usuario (logueado): Oculta el buscador y muestra un mensaje confirmando su correo.
      */}
      {usuario ? (
        <div className="info-usuario-logueado" style={{ textAlign: 'center', marginBottom: '20px', color: '#40916c', fontWeight: '600' }}>
          <p>Mostrando el historial exclusivo para: <strong>{usuario.email}</strong></p>
        </div>
      ) : (
        <form onSubmit={handleBuscar} className="buscador-invitado">
          <p>Ingresa tu correo electrónico para ver el estado y detalles de tus compras:</p>
          <div className="buscador-input-group">
            <input 
              type="email" 
              placeholder="Ej: juan@correo.com" 
              value={correoInput}
              onChange={(e) => setCorreoInput(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              <FaSearch /> {loading ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </form>
      )}

      {loading && <div className="compras-loading">Cargando detalles...</div>}
      {error && <div className="compras-error">{error}</div>}

      {!loading && compras.length > 0 && (
        <div className="lista-compras">
          {compras.map((venta) => (
            <div key={venta.idVenta} className="tarjeta-compra">
              
              <div className="compra-header">
                <div className="compra-fecha">
                  <FaCalendarAlt /> 
                  <span>
                    {venta.fecha 
                      ? new Date(venta.fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' })
                      : 'Fecha no disponible'}
                  </span>
                </div>
                <div className="compra-orden">Orden #{venta.idVenta}</div>
                <div className="compra-total">Total: ${venta.total?.toFixed(2)}</div>
              </div>

              <div className="compra-body">
                <div className="compra-datos-envio">
                  <h3>Datos de Entrega</h3>
                  <p><FaUser /> {venta.envioNombre || 'No registrado'} {venta.envioApellido}</p>
                  <p><FaMapMarkerAlt /> {venta.envioDireccion || 'No registrada'}</p>
                  <p>📞 {venta.envioTelefono || 'No registrado'}</p>
                </div>

                <div className="compra-productos">
                  <h3>Productos Adquiridos</h3>
                  {venta.detalles?.map((detalle, index) => (
                    <div key={index} className="producto-item">
                      <img 
                        src={detalle.producto?.imagen || '/placeholder-mueble.png'} 
                        alt={detalle.producto?.nombre || 'Producto'} 
                        className="producto-img"
                      />
                      <div className="producto-info">
                        <h4>
                          {detalle.producto?.nombre} 
                          <span className="cantidad-badge">x{detalle.cantidad}</span>
                        </h4>
                        <p className="precio-unitario">${detalle.precioUnitario?.toFixed(2)} c/u</p>
                        
                        {detalle.producto?.detallesTecnicos ? (
                          <div className="detalles-tecnicos">
                            <p><strong>Dimensiones:</strong> {detalle.producto.detallesTecnicos.alto}cm (Alto) x {detalle.producto.detallesTecnicos.ancho}cm (Ancho) x {detalle.producto.detallesTecnicos.profundidad}cm (Prof.)</p>
                            <p><strong>Color:</strong> {detalle.producto.detallesTecnicos.color}</p>
                            <p><strong>Características:</strong> {detalle.producto.detallesTecnicos.caracteristicas}</p>
                          </div>
                        ) : (
                          <p className="sin-detalles">Detalles técnicos no especificados.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Compras;