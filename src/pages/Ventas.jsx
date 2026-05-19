import { useEffect, useState } from 'react';
import API from '../api/axios';
import { FaCalendarDay, FaCalendarWeek, FaSearch } from 'react-icons/fa';
import './Ventas.css';

function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('hoy');
  const [busqueda, setBusqueda] = useState('');

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

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  inicioSemana.setHours(0, 0, 0, 0);

  const ventasFiltradas = ventas.filter((v) => {
    const fecha = new Date(v.fecha);
    const coincideBusqueda =
      v.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.cliente?.apellido?.toLowerCase().includes(busqueda.toLowerCase());

    if (filtro === 'hoy') return fecha >= hoy && coincideBusqueda;
    if (filtro === 'semana') return fecha >= inicioSemana && coincideBusqueda;
    return coincideBusqueda;
  });

  const totalFiltrado = ventasFiltradas.reduce((acc, v) => acc + v.total, 0);

  if (loading) return <div className="loading">⏳ Cargando ventas...</div>;

  return (
    <div className="ventas-container">
      <h1 className="page-title">🧾 Registro de Ventas</h1>

      {/* Filtros */}
      <div className="ventas-filtros">
        <div className="filtro-btns">
          <button
            className={filtro === 'hoy' ? 'filtro-btn activo' : 'filtro-btn'}
            onClick={() => setFiltro('hoy')}
          >
            <FaCalendarDay /> Hoy
          </button>
          <button
            className={filtro === 'semana' ? 'filtro-btn activo' : 'filtro-btn'}
            onClick={() => setFiltro('semana')}
          >
            <FaCalendarWeek /> Esta Semana
          </button>
          <button
            className={filtro === 'todas' ? 'filtro-btn activo' : 'filtro-btn'}
            onClick={() => setFiltro('todas')}
          >
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
            ${ventasFiltradas.length > 0
              ? (totalFiltrado / ventasFiltradas.length).toFixed(2)
              : '0.00'}
          </span>
          <span className="vr-label">Promedio por venta</span>
        </div>
      </div>

      {/* Lista ventas */}
      {ventasFiltradas.length === 0 ? (
        <div className="sin-ventas">😕 No hay ventas en este período</div>
      ) : (
        <div className="ventas-lista">
          {ventasFiltradas
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .map((venta) => (
              <div key={venta.idVenta} className="venta-card">
                <div className="venta-header">
                  <div className="venta-id">
                    <span>Venta #{venta.idVenta}</span>
                    <span className="venta-fecha">
                      {new Date(venta.fecha).toLocaleDateString('es-EC', {
                        day: '2-digit', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <span className="venta-total">${venta.total?.toFixed(2)}</span>
                </div>

                <div className="venta-cliente">
                  👤 {venta.cliente?.nombre} {venta.cliente?.apellido} —
                  📞 {venta.cliente?.telefono}
                </div>

                <div className="venta-productos">
                  {venta.detalles?.map((d, i) => (
                    <div key={i} className="venta-producto-item">
                      <span>{d.producto?.nombre}</span>
                      <span>x{d.cantidad}</span>
                      <span>${d.subtotal?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default Ventas;