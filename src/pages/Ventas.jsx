import { useEffect, useState } from 'react';
import API from '../api/axios';
import { FaCalendarDay, FaCalendarWeek, FaSearch, FaEye, FaTimes, FaFileInvoiceDollar, FaTruck, FaMapMarkerAlt, FaReceipt, FaDownload, FaBoxOpen } from 'react-icons/fa';
import './Ventas.css';

function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [imagenComprobanteUrl, setImagenComprobanteUrl] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await API.get('/Ventas');
        setVentas(res.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  const construirUrlComprobante = (ruta) => {
    if (!ruta) return null;
    if (ruta.startsWith('http://') || ruta.startsWith('https://')) return ruta;
    const urlBaseServidor = API.defaults.baseURL ? API.defaults.baseURL.replace('/api', '') : 'http://localhost:5000';
    return `${urlBaseServidor}/${ruta.replace(/^\//, '')}`;
  };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  inicioSemana.setHours(0, 0, 0, 0);

  const ventasFiltradas = ventas.filter((v) => {
    const fecha = new Date(v.fecha);
    const textoBusqueda = busqueda.trim().toLowerCase();
    
    const coincideBusqueda = textoBusqueda === '' ||
      (v.cliente?.nombre || '').toLowerCase().includes(textoBusqueda) ||
      (v.cliente?.apellido || '').toLowerCase().includes(textoBusqueda);

    if (filtro === 'hoy') return fecha >= hoy && coincideBusqueda;
    if (filtro === 'semana') return fecha >= inicioSemana && coincideBusqueda;
    return coincideBusqueda;
  });

  const totalFiltrado = ventasFiltradas.reduce((acc, v) => acc + (parseFloat(v.total) || 0), 0);

  const abrirModal = (venta) => setVentaSeleccionada(venta);
  const cerrarModal = () => setVentaSeleccionada(null);

  const verCapturaComprobante = (ruta) => {
    const urlCompleta = construirUrlComprobante(ruta);
    setImagenComprobanteUrl(urlCompleta);
  };

  // =================================================================================
  // LÓGICA DE ESTADO DE ENTREGA (Basada en DetalleVenta)
  // =================================================================================
  const obtenerEstadoEntrega = (venta) => {
    if (!venta || !venta.detalles || venta.detalles.length === 0) {
      return { estaEntregado: false, esParcial: false, fecha: null };
    }

    // Leer directamente de DetalleVenta — ya no cruza con inventario
    const todosEntregados = venta.detalles.every(d => d.entregado === 'Si');
    const algunoEntregado = venta.detalles.some(d => d.entregado === 'Si');

    // Tomar la fecha más reciente de entrega
    let fechaMasReciente = null;
    venta.detalles.forEach(d => {
      if (d.entregado === 'Si' && d.fechaEntrega) {
        const f = new Date(d.fechaEntrega);
        if (!fechaMasReciente || f > fechaMasReciente) {
          fechaMasReciente = f;
        }
      }
    });

    return {
      estaEntregado: todosEntregados,
      esParcial: algunoEntregado && !todosEntregados,
      fecha: fechaMasReciente,
    };
  };

  // Guardamos el estado del modal antes de imprimir (para no calcularlo varias veces)
  const estadoSel = ventaSeleccionada ? obtenerEstadoEntrega(ventaSeleccionada) : { estaEntregado: false, esParcial: false, fecha: null };

  if (loading) return <div className="loading">⏳ Cargando ventas...</div>;

  return (
    <div className="ventas-container">
      <h1 className="page-title">🧾 Registro de Ventas</h1>

      {/* Filtros */}
      <div className="ventas-filtros">
        <div className="filtro-btns">
          <button className={filtro === 'hoy' ? 'filtro-btn activo' : 'filtro-btn'} onClick={() => setFiltro('hoy')}>
            <FaCalendarDay /> Hoy
          </button>
          <button className={filtro === 'semana' ? 'filtro-btn activo' : 'filtro-btn'} onClick={() => setFiltro('semana')}>
            <FaCalendarWeek /> Esta Semana
          </button>
          <button className={filtro === 'todas' ? 'filtro-btn activo' : 'filtro-btn'} onClick={() => setFiltro('todas')}>
            📋 Todas
          </button>
        </div>

        <div className="ventas-search">
          <FaSearch />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="ventas-total">
          <span>Total:</span>
          <strong>${totalFiltrado.toFixed(2)}</strong>
        </div>
      </div>

      {/* Resumen cards */}
      <div className="ventas-resumen">
        <div className="venta-resumen-card">
          <span className="vr-numero">{ventasFiltradas.length}</span>
          <span className="vr-label">Ventas realizadas</span>
        </div>
        <div className="venta-resumen-card">
          <span className="vr-numero">${totalFiltrado.toFixed(2)}</span>
          <span className="vr-label">Total recaudado</span>
        </div>
        <div className="venta-resumen-card">
          <span className="vr-numero">
            ${ventasFiltradas.length > 0 ? (totalFiltrado / ventasFiltradas.length).toFixed(2) : '0.00'}
          </span>
          <span className="vr-label">Promedio por venta</span>
        </div>
      </div>

      {/* Lista ventas maestras */}
      {ventasFiltradas.length === 0 ? (
        <div className="sin-ventas">😕 No hay ventas en este período</div>
      ) : (
        <div className="ventas-lista">
          {ventasFiltradas
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .map((venta) => {
              
              // Verificamos el estado con la función actualizada
              const { estaEntregado, esParcial } = obtenerEstadoEntrega(venta);

              return (
                <div key={venta.idVenta} className="venta-card">
                  <div className="venta-header">
                    <div className="venta-id">
                      <div style={{display:'flex', alignItems: 'center', gap: '10px'}}>
                        <span>Venta #{venta.idVenta}</span>
                        {/* BADGE DE ESTADO DE ORDEN EN LA TARJETA */}
                        <span className={`badge-orden ${
                          estaEntregado ? 'orden-entregada' : 
                          esParcial ? 'orden-parcial' : 
                          'orden-pendiente'
                        }`}>
                          {estaEntregado ? '✅ Entregado' : esParcial ? '⚠️ Parcial' : '⏳ Pendiente'}
                        </span>
                      </div>
                      <span className="venta-fecha">
                        {new Date(venta.fecha).toLocaleDateString('es-EC', {
                          day: '2-digit', month: 'long', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="venta-acciones-header">
                      <span className="venta-total">${(parseFloat(venta.total) || 0).toFixed(2)}</span>
                      <button className="btn-detalles" onClick={() => abrirModal(venta)}>
                        <FaEye /> Detalles
                      </button>
                    </div>
                  </div>

                  <div className="venta-cliente">
                    👤 {venta.cliente?.nombre || 'Desconocido'} {venta.cliente?.apellido || ''} — 📞 {venta.cliente?.telefono || 'N/A'}
                  </div>

                  <div className="venta-productos">
                    {venta.detalles?.map((d, i) => (
                      <div key={i} className="venta-producto-item">
                        <span>{d.producto?.nombre}</span>
                        <span>x{d.cantidad}</span>
                        <span>${(parseFloat(d.subtotal) || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* === SUBPANTALLA (MODAL) DE DETALLES DE VENTA === */}
      {ventaSeleccionada && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-ventas-detalle" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header-ventas">
              <h2>Detalle de Venta #{ventaSeleccionada.idVenta}</h2>
              <button className="btn-cerrar-modal" onClick={cerrarModal}><FaTimes /></button>
            </div>

            <div className="modal-body-ventas">
              
              {/* Sección de Facturación */}
              <div className="detalle-seccion">
                <h3 className="seccion-titulo"><FaFileInvoiceDollar /> Datos de Facturación</h3>
                <div className="seccion-grid">
                  <div className="dato-item">
                    <span className="dato-label">Nombre Completo:</span>
                    <span className="dato-valor">
                      {ventaSeleccionada.facturacionNombre || ventaSeleccionada.facturacion_nombre || ventaSeleccionada.cliente?.nombre} {ventaSeleccionada.facturacionApellido || ventaSeleccionada.facturacion_apellido || ventaSeleccionada.cliente?.apellido}
                    </span>
                  </div>
                  <div className="dato-item">
                    <span className="dato-label">Cédula/RUC:</span>
                    <span className="dato-valor">{ventaSeleccionada.facturacionCedula || ventaSeleccionada.facturacion_cedula || '—'}</span>
                  </div>
                  <div className="dato-item">
                    <span className="dato-label">Teléfono:</span>
                    <span className="dato-valor">{ventaSeleccionada.facturacionTelefono || ventaSeleccionada.facturacion_telefono || '—'}</span>
                  </div>
                  <div className="dato-item">
                    <span className="dato-label">Dirección:</span>
                    <span className="dato-valor">{ventaSeleccionada.facturacionDireccion || ventaSeleccionada.facturacion_direccion || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Sección de Envío Y ESTADO DE ENTREGA (Actualizado) */}
              <div className="detalle-seccion">
                <h3 className="seccion-titulo"><FaTruck /> Logística y Envío</h3>
                <div className="seccion-grid">
                  <div className="dato-item">
                    <span className="dato-label">Estado de Entrega:</span>
                    <div className="estado-entrega-container" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '8px' }}>
                      {estadoSel.estaEntregado ? (
                        <div style={{color: '#40916c', fontWeight: 'bold', textAlign: 'center'}}>
                          ✅ Entregado
                          <br/>
                          <span style={{fontSize: '0.85rem', fontWeight: 'normal'}}>
                            {estadoSel.fecha ? new Date(estadoSel.fecha).toLocaleDateString('es-EC') : 'fecha no registrada'}
                          </span>
                        </div>
                      ) : estadoSel.esParcial ? (
                        <div style={{color: '#856404', fontWeight: 'bold', textAlign: 'center'}}>
                          ⚠️ Entrega Parcial
                          <br/>
                          <span style={{fontSize: '0.85rem', fontWeight: 'normal'}}>
                            Algunos productos pendientes
                          </span>
                        </div>
                      ) : (
                        <div style={{color: '#e63946', fontWeight: 'bold', textAlign: 'center'}}>
                          ⏳ Pendiente de Entrega
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="dato-item">
                    <span className="dato-label">Recibe:</span>
                    <span className="dato-valor">
                      {ventaSeleccionada.envioNombre || ventaSeleccionada.envio_nombre || '—'} {ventaSeleccionada.envioApellido || ventaSeleccionada.envio_apellido || ''}
                    </span>
                  </div>
                  <div className="dato-item">
                    <span className="dato-label">Teléfono Envío:</span>
                    <span className="dato-valor">{ventaSeleccionada.envioTelefono || ventaSeleccionada.envio_telefono || '—'}</span>
                  </div>
                  <div className="dato-item full-width">
                    <span className="dato-label">Dirección de Envío:</span>
                    <span className="dato-valor">{ventaSeleccionada.envioDireccion || ventaSeleccionada.envio_direccion || '—'}</span>
                  </div>
                  
                  {(ventaSeleccionada.envioLinkMaps || ventaSeleccionada.envio_link_maps) && (
                    <div className="dato-item full-width">
                      <a href={ventaSeleccionada.envioLinkMaps || ventaSeleccionada.envio_link_maps} target="_blank" rel="noopener noreferrer" className="btn-link-maps">
                        <FaMapMarkerAlt /> Ver en Google Maps
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Lista Muebles Comprados */}
              <div className="detalle-seccion">
                <h3 className="seccion-titulo"><FaBoxOpen /> Muebles Adquiridos</h3>
                <div className="productos-entrega-lista">
                  {ventaSeleccionada.detalles?.map((d, i) => (
                    <div key={i} className="producto-entrega-item">
                      <div className="prod-entrega-info">
                        <span className="prod-entrega-nombre">{d.producto?.nombre}</span>
                        <span className="prod-entrega-cantidad">Cantidad: x{d.cantidad}</span>
                      </div>
                      <div className="prod-entrega-status">
                        <span style={{fontWeight: '700', color: '#1a7fa8'}}>${(parseFloat(d.subtotal) || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sección de Resumen de Pago */}
              <div className="detalle-seccion bg-light">
                <h3 className="seccion-titulo"><FaReceipt /> Resumen de Pago</h3>
                <div className="seccion-grid">
                  <div className="dato-item">
                    <span className="dato-label">Total Pagado:</span>
                    <span className="dato-valor total-destacado">${(parseFloat(ventaSeleccionada.total) || 0).toFixed(2)}</span>
                  </div>
                  <div className="dato-item">
                    <span className="dato-label">Fecha de Compra:</span>
                    <span className="dato-valor">{new Date(ventaSeleccionada.fecha).toLocaleDateString('es-EC')}</span>
                  </div>
                  
                  {(ventaSeleccionada.urlComprobante || ventaSeleccionada.url_comprobante) && (
                    <div className="dato-item full-width mt-2">
                      <button 
                        type="button"
                        className="btn-link-comprobante"
                        onClick={() => verCapturaComprobante(ventaSeleccionada.urlComprobante || ventaSeleccionada.url_comprobante)}
                      >
                        <FaReceipt /> Ver Captura de Comprobante
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visor de comprobante */}
      {imagenComprobanteUrl && (
        <div className="lightbox-overlay" onClick={() => setImagenComprobanteUrl(null)}>
          <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-btn-cerrar" onClick={() => setImagenComprobanteUrl(null)}>
              <FaTimes />
            </button>
            <div className="lightbox-content">
              <img src={imagenComprobanteUrl} alt="Captura del Comprobante" className="lightbox-img-real" />
            </div>
            <div className="lightbox-footer">
              <a href={imagenComprobanteUrl} download target="_blank" rel="noopener noreferrer" className="lightbox-btn-descargar">
                <FaDownload /> Descargar Archivo Original
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ventas;