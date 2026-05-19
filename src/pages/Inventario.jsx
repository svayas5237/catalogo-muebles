import { useEffect, useState } from 'react';
import API from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend as ChartLegend } from 'chart.js';
import { FaBoxes, FaExclamationTriangle, FaSearch, FaSyncAlt, FaChartBar, FaPlus, FaMinus } from 'react-icons/fa';
import './Inventario.css';

ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

function Inventario() {
  const [inventarios, setInventarios] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [movimiento, setMovimiento] = useState({ tipo: 'COMPRA', cantidad: 1 });
  const [mensaje, setMensaje] = useState(null);
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear());
  const [filtroMes, setFiltroMes] = useState('todos');

  const meses = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ];

  // Colores pastel con bordes más oscuros
  const COLORS_BG = [
    '#b7e4c7', '#a8d8ea', '#ffd6a5',
    '#ffadad', '#d4b8e0', '#ffc8dd',
    '#caffbf', '#fdffb6', '#a8dadc'
  ];
  const COLORS_BORDER = [
    '#40916c', '#1a7fa8', '#f4a261',
    '#e63946', '#9b5de5', '#f72585',
    '#70c84d', '#e9c46a', '#1a7fa8'
  ];

  const COLORES_MESES = [
    '#b7e4c7','#a8dadc','#bee9e8','#caf0f8',
    '#90e0ef','#48cae4','#00b4d8','#0096c7',
    '#0077b6','#023e8a','#03045e','#c77dff',
  ];


  //Ventas por Mes en celeste pastel
  const COLORS_VENTAS_BG = Array(12).fill('#BFEBF8');   
  const COLORS_VENTAS_BORDER = Array(12).fill('#5AA9C4'); 

  const COLORES_STOCK = ['#b7e4c7','#a8d8ea','#ffd6a5','#ffadad','#d4b8e0','#ffc8dd'];
  const COLORES_STOCK_BORDER = ['#40916c','#1a7fa8','#f4a261','#e63946','#9b5de5','#f72585'];

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [invRes, ventasRes] = await Promise.all([
          API.get('/Inventarios'),
          API.get('/Ventas'),
        ]);
        setInventarios(invRes.data);
        setVentas(ventasRes.data);
      } catch (error) {
        console.error('Error cargando inventario:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  const fetchInventarios = async () => {
    try {
      const res = await API.get('/Inventarios');
      setInventarios(res.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const abrirModal = (inventario) => {
    setModal(inventario);
    setMovimiento({ tipo: 'COMPRA', cantidad: 1 });
  };

  const cerrarModal = () => {
    setModal(null);
    setMensaje(null);
  };

  const registrarMovimiento = async () => {
    if (movimiento.cantidad <= 0) return;
    try {
      await API.post('/MovimientosInventario', {
        idProducto: modal.idProducto,
        tipo: movimiento.tipo,
        cantidad: parseInt(movimiento.cantidad),
      });
      setMensaje('✅ Movimiento registrado correctamente');
      await fetchInventarios();
      setTimeout(() => cerrarModal(), 1500);
    } catch (error) {
      console.error(error);
      setMensaje('❌ Error al registrar movimiento');
    }
  };

  const inventarioFiltrado = inventarios.filter((inv) =>
    inv.producto?.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const getBadge = (inv) => {
    if (inv.stock === 0) return { clase: 'badge-agotado', texto: '❌ Agotado' };
    if (inv.stock <= inv.stockMinimo) return { clase: 'badge-bajo', texto: '⚠️ Stock Bajo' };
    return { clase: 'badge-ok', texto: '✅ Disponible' };
  };

  const ventasFiltradas = ventas.filter((v) => {
    const fecha = new Date(v.fecha);
    const mismoAnio = fecha.getFullYear() === parseInt(filtroAnio);
    const mismoMes = filtroMes === 'todos' || fecha.getMonth() === parseInt(filtroMes);
    return mismoAnio && mismoMes;
  });

  const productosVendidos = {};
  ventasFiltradas.forEach((venta) => {
    venta.detalles?.forEach((detalle) => {
      const nombre = detalle.producto?.nombre || `Producto ${detalle.idProducto}`;
      if (!productosVendidos[nombre]) productosVendidos[nombre] = 0;
      productosVendidos[nombre] += detalle.cantidad;
    });
  });

  const dataProductos = Object.entries(productosVendidos)
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  const ventasPorMes = Array(12).fill(0).map((_, i) => ({
    mes: meses[i].slice(0, 3),
    total: 0,
    color: COLORES_MESES[i],
  }));

  ventas
    .filter(v => new Date(v.fecha).getFullYear() === parseInt(filtroAnio))
    .forEach((v) => {
      const mes = new Date(v.fecha).getMonth();
      ventasPorMes[mes].total += v.total;
    });

  const totalPeriodo = ventasFiltradas.reduce((acc, v) => acc + v.total, 0);

  // Datos para Chart.js Doughnut
  const doughnutData = {
    labels: dataProductos.map(p => p.nombre),
    datasets: [{
      data: dataProductos.map(p => p.cantidad),
      backgroundColor: COLORS_BG.slice(0, dataProductos.length),
      borderColor: COLORS_BORDER.slice(0, dataProductos.length),
      borderWidth: 2.5,
      hoverOffset: 12,
    }]
  };

  const doughnutOptions = {
    responsive: true,
    cutout: '55%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 14,
          font: { size: 12, family: 'Segoe UI' },
          usePointStyle: true,
          pointStyle: 'circle',
          color: '#333',
        }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.raw} unidades`
        },
        backgroundColor: 'rgba(255,255,255,0.95)',
        titleColor: '#333',
        bodyColor: '#555',
        borderColor: '#ddd',
        borderWidth: 1,
      }
    }
  };

  if (loading) return <div className="loading">⏳ Cargando inventario...</div>;

  return (
    <div className="inventario-container">
      <h1 className="page-title">📦 Control de Inventario</h1>

      {/* Resumen cards */}
      <div className="resumen-cards">
        <div className="resumen-card verde">
          <FaBoxes className="resumen-icon" />
          <div>
            <span className="resumen-numero">
              {inventarios.filter((i) => i.stock > i.stockMinimo).length}
            </span>
            <span className="resumen-label">En buen stock</span>
          </div>
        </div>
        <div className="resumen-card amarillo">
          <FaExclamationTriangle className="resumen-icon" />
          <div>
            <span className="resumen-numero">
              {inventarios.filter((i) => i.stock > 0 && i.stock <= i.stockMinimo).length}
            </span>
            <span className="resumen-label">Stock bajo</span>
          </div>
        </div>
        <div className="resumen-card rojo">
          <FaBoxes className="resumen-icon" />
          <div>
            <span className="resumen-numero">
              {inventarios.filter((i) => i.stock === 0).length}
            </span>
            <span className="resumen-label">Agotados</span>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="inv-search">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className="tabla-wrapper">
        <table className="inv-tabla">
          <thead>
            <tr>
              <th>#</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock Actual</th>
              <th>Stock Mínimo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {inventarioFiltrado.map((inv, index) => {
              const badge = getBadge(inv);
              return (
                <tr key={inv.idInventario} className={inv.stock === 0 ? 'fila-agotada' : ''}>
                  <td>{index + 1}</td>
                  <td className="td-nombre">{inv.producto?.nombre}</td>
                  <td>{inv.producto?.categoria?.nombre || '—'}</td>
                  <td className="td-stock">{inv.stock}</td>
                  <td>{inv.stockMinimo}</td>
                  <td>
                    <span className={`badge-stock ${badge.clase}`}>
                      {badge.texto}
                    </span>
                  </td>
                  <td>
                    <button className="btn-movimiento" onClick={() => abrirModal(inv)}>
                      <FaSyncAlt /> Movimiento
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* REPORTES */}
      <div className="reportes-section">
        <h2 className="reportes-titulo"><FaChartBar /> Reportes de Ventas</h2>

        <div className="reportes-filtros">
          <div className="filtro-item">
            <label>Año</label>
            <select value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)}>
              {[2023, 2024, 2025, 2026].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="filtro-item">
            <label>Mes</label>
            <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
              <option value="todos">Todos los meses</option>
              {meses.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          </div>
          <div className="filtro-total">
            <span>Total del período:</span>
            <strong>${totalPeriodo.toFixed(2)}</strong>
          </div>
        </div>

        <div className="reportes-graficas">

          {/* Gráfica 1 - Ventas por mes */}
          <div className="grafica-card">
            <h3>📈 Ventas por Mes — {filtroAnio}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ventasPorMes} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Total']} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {ventasPorMes.map((_, index) => (
                  <Cell
                    key={index}
                    fill={COLORS_VENTAS_BG[index % COLORS_VENTAS_BG.length]}
                    stroke={COLORS_VENTAS_BORDER[index % COLORS_VENTAS_BORDER.length]}
                    strokeWidth={1.5}
                  />
                ))}
              </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfica 2 - Top 5 productos con Chart.js */}
          <div className="grafica-card">
            <h3>🏆 Top 5 Productos Más Vendidos</h3>
            {dataProductos.length > 0 ? (
              <div className="pie-wrapper">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            ) : (
              <div className="sin-datos">😕 No hay ventas en este período</div>
            )}
          </div>

          {/* Gráfica 3 - Stock actual */}
          <div className="grafica-card">
            <h3>📦 Stock Actual por Producto</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={inventarios.map((inv, i) => ({
                  nombre: inv.producto?.nombre?.split(' ')[0] || 'N/A',
                  stock: inv.stock,
                  minimo: inv.stockMinimo,
                }))}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="stock" name="Stock Actual" radius={[6,6,0,0]}>
                  {inventarios.map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORES_STOCK[index % COLORES_STOCK.length]}
                      stroke={COLORES_STOCK_BORDER[index % COLORES_STOCK_BORDER.length]}
                      strokeWidth={1.5}
                    />
                  ))}
                </Bar>
                <Bar dataKey="minimo" name="Stock Mínimo" radius={[6,6,0,0]} fill="#ffd6a5" stroke="#f4a261" strokeWidth={1.5} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfica 4 - Resumen ingresos */}
          <div className="grafica-card">
            <h3>💰 Resumen de Ingresos — {filtroAnio}</h3>
            <div className="resumen-ingresos">
              <div className="ingreso-item" style={{ borderTop: '3px solid #40916c' }}>
                <span className="ingreso-label">Total Ventas del Año</span>
                <span className="ingreso-valor" style={{ color: '#40916c' }}>
                  ${ventas.filter(v => new Date(v.fecha).getFullYear() === parseInt(filtroAnio)).reduce((acc, v) => acc + v.total, 0).toFixed(2)}
                </span>
              </div>
              <div className="ingreso-item" style={{ borderTop: '3px solid #1a7fa8' }}>
                <span className="ingreso-label">Número de Ventas</span>
                <span className="ingreso-valor" style={{ color: '#1a7fa8' }}>
                  {ventas.filter(v => new Date(v.fecha).getFullYear() === parseInt(filtroAnio)).length}
                </span>
              </div>
              <div className="ingreso-item" style={{ borderTop: '3px solid #f4a261' }}>
                <span className="ingreso-label">Promedio por Venta</span>
                <span className="ingreso-valor" style={{ color: '#f4a261' }}>
                  ${(() => {
                    const ventasAnio = ventas.filter(v => new Date(v.fecha).getFullYear() === parseInt(filtroAnio));
                    return ventasAnio.length > 0
                      ? (ventasAnio.reduce((acc, v) => acc + v.total, 0) / ventasAnio.length).toFixed(2)
                      : '0.00';
                  })()}
                </span>
              </div>
              <div className="ingreso-item" style={{ borderTop: '3px solid #9b5de5' }}>
                <span className="ingreso-label">Productos en Inventario</span>
                <span className="ingreso-valor" style={{ color: '#9b5de5' }}>{inventarios.length}</span>
              </div>
              <div className="ingreso-item" style={{ borderTop: '3px solid #e63946' }}>
                <span className="ingreso-label">Total Unidades en Stock</span>
                <span className="ingreso-valor" style={{ color: '#e63946' }}>
                  {inventarios.reduce((acc, i) => acc + i.stock, 0)}
                </span>
              </div>
              <div className="ingreso-item" style={{ borderTop: '3px solid #f72585' }}>
                <span className="ingreso-label">Ventas del Período</span>
                <span className="ingreso-valor" style={{ color: '#f72585' }}>${totalPeriodo.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Gráfica 5 - Últimas ventas */}
          <div className="grafica-card grafica-full">
            <h3>🕒 Últimas 5 Ventas Realizadas</h3>
            <table className="ventas-recientes-tabla">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Productos</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {ventas
                  .filter(v => new Date(v.fecha).getFullYear() === parseInt(filtroAnio))
                  .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                  .slice(0, 5)
                  .map((v, i) => (
                    <tr key={v.idVenta}>
                      <td>{i + 1}</td>
                      <td>{v.cliente?.nombre} {v.cliente?.apellido}</td>
                      <td>{new Date(v.fecha).toLocaleDateString('es-EC')}</td>
                      <td>{v.detalles?.length || 0} producto(s)</td>
                      <td><strong style={{ color: COLORS_BORDER[i % COLORS_BORDER.length] }}>${v.total?.toFixed(2)}</strong></td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {ventas.filter(v => new Date(v.fecha).getFullYear() === parseInt(filtroAnio)).length === 0 && (
              <div className="sin-datos">😕 No hay ventas en este año</div>
            )}
          </div>

        </div>
      </div>

      {/* Modal Movimiento */}
      {modal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>📋 Registrar Movimiento</h2>
            <p className="modal-producto">Producto: <strong>{modal.producto?.nombre}</strong></p>
            <p className="modal-stock">Stock actual: <strong>{modal.stock}</strong> unidades</p>
            <div className="modal-form">
              <label>Tipo de movimiento</label>
              <div className="tipo-btns">
                {['COMPRA', 'VENTA', 'AJUSTE'].map((t) => (
                  <button
                    key={t}
                    className={`tipo-btn ${movimiento.tipo === t ? 'activo' : ''} tipo-${t.toLowerCase()}`}
                    onClick={() => setMovimiento({ ...movimiento, tipo: t })}
                  >
                    {t === 'COMPRA' && <FaPlus />}
                    {t === 'VENTA' && <FaMinus />}
                    {t === 'AJUSTE' && <FaSyncAlt />}
                    {t}
                  </button>
                ))}
              </div>
              <label>Cantidad</label>
              <input
                type="number"
                min="1"
                value={movimiento.cantidad}
                onChange={(e) => setMovimiento({ ...movimiento, cantidad: e.target.value })}
                className="modal-input"
              />
            </div>
            {mensaje && <p className="modal-mensaje">{mensaje}</p>}
            <div className="modal-acciones">
              <button className="btn-primary" onClick={registrarMovimiento}>Confirmar</button>
              <button className="btn-secondary" onClick={cerrarModal}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventario;