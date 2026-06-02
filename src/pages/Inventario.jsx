import { useEffect, useState, useRef } from 'react';
import API from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend as ChartLegend } from 'chart.js';
import { FaBoxes, FaExclamationTriangle, FaSearch, FaSyncAlt, FaChartBar, FaPlus, FaMinus, FaFilePdf, FaFileExcel } from 'react-icons/fa';
import './Inventario.css';

ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

function Inventario() {
  const [inventarios, setInventarios] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [movimiento, setMovimiento] = useState({ tipo: 'COMPRA', cantidad: 1, entregado: 'No', fechaEntrega: '', clienteId: '' });
  const [mensaje, setMensaje] = useState(null);
  const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear());
  const [filtroMes, setFiltroMes] = useState('todos');
  const graficasRef = useRef(null);

  const meses = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ];

  const COLORS_BG = ['#b7e4c7','#a8d8ea','#ffd6a5','#ffadad','#d4b8e0','#ffc8dd','#caffbf','#fdffb6','#a8dadc'];
  const COLORS_BORDER = ['#40916c','#1a7fa8','#f4a261','#e63946','#9b5de5','#f72585','#70c84d','#e9c46a','#1a7fa8'];
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

  // ===== CLIENTES QUE COMPRARON EL PRODUCTO DEL MODAL =====
  const clientesParaComboBox = [];
  if (modal) {
    const mapClientes = new Set();
    ventas.forEach(v => {
      const comproElProducto = v.detalles?.some(d =>
        d.idProducto === modal.idProducto ||
        d.producto?.idProducto === modal.idProducto ||
        d.id_producto === modal.idProducto
      );
      if (comproElProducto && v.cliente && v.cliente.nombre) {
        const identificador = (v.cliente.nombre + ' ' + (v.cliente.apellido || '')).trim();
        if (!mapClientes.has(identificador)) {
          mapClientes.add(identificador);
          clientesParaComboBox.push({
            id: v.cliente.idCliente || v.id_cliente || identificador,
            nombreCompleto: identificador
          });
        }
      }
    });
  }

  // ===== EXPORTAR PDF =====
  const exportarPDF = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.setTextColor(45, 106, 79);
    doc.text('Reporte de Ventas - Ecology Muebles', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(
      'Año: ' + filtroAnio + '  |  Período: ' + (filtroMes === 'todos' ? 'Todos los meses' : meses[filtroMes]),
      pageWidth / 2, 22, { align: 'center' }
    );
    doc.text('Total del período: $' + totalPeriodo.toFixed(2), pageWidth / 2, 28, { align: 'center' });

    const ventasAnio = ventas.filter(v => new Date(v.fecha).getFullYear() === parseInt(filtroAnio));
    const totalAnio = ventasAnio.reduce((acc, v) => acc + v.total, 0);
    const promedio = ventasAnio.length > 0 ? (totalAnio / ventasAnio.length).toFixed(2) : '0.00';

    autoTable(doc, {
      startY: 34,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total Ventas del Año', '$' + totalAnio.toFixed(2)],
        ['Número de Ventas', String(ventasAnio.length)],
        ['Promedio por Venta', '$' + promedio],
        ['Productos en Inventario', String(inventarios.length)],
        ['Total Unidades en Stock', String(inventarios.reduce((acc, i) => acc + i.stock, 0))],
        ['Ventas del Período', '$' + totalPeriodo.toFixed(2)],
      ],
      headStyles: { fillColor: [45, 106, 79] },
      styles: { fontSize: 10 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['#', 'Producto', 'Categoría', 'Stock', 'Stock Mín', 'Estado']],
      body: inventarioFiltrado.map((inv, i) => [
        i + 1,
        inv.producto?.nombre || '—',
        inv.producto?.categoria?.nombre || '—',
        inv.stock,
        inv.stockMinimo,
        inv.stock === 0 ? 'Agotado' : inv.stock <= inv.stockMinimo ? 'Stock Bajo' : 'Disponible',
      ]),
      headStyles: { fillColor: [45, 106, 79] },
      styles: { fontSize: 9 },
    });

    // Tabla detalles de entrega por producto
    const detallesConEntrega = [];
    ventas.forEach(v => {
      v.detalles?.forEach(d => {
        if (d.entregado || d.fechaEntrega) {
          detallesConEntrega.push([
            v.idVenta,
            d.producto?.nombre || '—',
            (v.cliente?.nombre || '') + ' ' + (v.cliente?.apellido || ''),
            d.entregado || 'No',
            d.fechaEntrega ? new Date(d.fechaEntrega).toLocaleDateString('es-EC') : '—',
          ]);
        }
      });
    });

    if (detallesConEntrega.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Venta #', 'Producto', 'Cliente', 'Entregado', 'Fecha Entrega']],
        body: detallesConEntrega,
        headStyles: { fillColor: [45, 106, 79] },
        styles: { fontSize: 9 },
      });
    }

    const ultimasVentas = ventasAnio
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 5);

    if (ultimasVentas.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['#', 'Cliente', 'Fecha', 'Productos', 'Total']],
        body: ultimasVentas.map((v, i) => [
          i + 1,
          (v.cliente?.nombre || '') + ' ' + (v.cliente?.apellido || ''),
          new Date(v.fecha).toLocaleDateString('es-EC'),
          (v.detalles?.length || 0) + ' producto(s)',
          '$' + v.total?.toFixed(2),
        ]),
        headStyles: { fillColor: [45, 106, 79] },
        styles: { fontSize: 10 },
      });
    }

    if (graficasRef.current) {
      try {
        const canvas = await html2canvas(graficasRef.current, {
          scale: 1.2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        });
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        doc.addPage();
        doc.setFontSize(13);
        doc.setTextColor(45, 106, 79);
        doc.text('Gráficas de Ventas e Inventario', pageWidth / 2, 12, { align: 'center' });
        doc.addImage(imgData, 'PNG', 10, 18, imgWidth, imgHeight);
      } catch (e) {
        console.error('Error capturando gráficas:', e);
      }
    }

    doc.save('Reporte_Inventario_' + filtroAnio + '.pdf');
  };

  // ===== EXPORTAR EXCEL =====
  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Inventario
    const inventarioData = inventarioFiltrado.map((inv, i) => ({
      '#': i + 1,
      'Producto': inv.producto?.nombre || '—',
      'Categoría': inv.producto?.categoria?.nombre || '—',
      'Stock Actual': inv.stock,
      'Stock Mínimo': inv.stockMinimo,
      'Estado': inv.stock === 0 ? 'Agotado' : inv.stock <= inv.stockMinimo ? 'Stock Bajo' : 'Disponible',
    }));
    const wsInventario = XLSX.utils.json_to_sheet(inventarioData);
    wsInventario['!cols'] = [{ wch: 5 }, { wch: 26 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsInventario, 'Inventario');

    // Hoja 2: Entregas (desde DetalleVenta)
    const entregasData = [];
    ventas.forEach(v => {
      v.detalles?.forEach(d => {
        entregasData.push({
          'Venta #': v.idVenta,
          'Producto': d.producto?.nombre || '—',
          'Cliente': (v.cliente?.nombre || '') + ' ' + (v.cliente?.apellido || ''),
          'Cantidad': d.cantidad,
          'Subtotal': '$' + (d.subtotal || 0).toFixed(2),
          'Entregado': d.entregado || 'No',
          'Fecha Entrega': d.fechaEntrega
            ? new Date(d.fechaEntrega).toLocaleDateString('es-EC')
            : '—',
        });
      });
    });
    const wsEntregas = XLSX.utils.json_to_sheet(entregasData);
    wsEntregas['!cols'] = [
      { wch: 10 }, { wch: 26 }, { wch: 22 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 16 }
    ];
    XLSX.utils.book_append_sheet(wb, wsEntregas, 'Entregas');

    // Hoja 3: Resumen ingresos
    const ventasAnio = ventas.filter(v => new Date(v.fecha).getFullYear() === parseInt(filtroAnio));
    const totalAnio = ventasAnio.reduce((acc, v) => acc + v.total, 0);
    const promedio = ventasAnio.length > 0 ? (totalAnio / ventasAnio.length) : 0;
    const resumenData = [
      { 'Métrica': 'Total Ventas del Año', 'Valor': '$' + totalAnio.toFixed(2) },
      { 'Métrica': 'Número de Ventas', 'Valor': ventasAnio.length },
      { 'Métrica': 'Promedio por Venta', 'Valor': '$' + promedio.toFixed(2) },
      { 'Métrica': 'Productos en Inventario', 'Valor': inventarios.length },
      { 'Métrica': 'Total Unidades en Stock', 'Valor': inventarios.reduce((acc, i) => acc + i.stock, 0) },
      { 'Métrica': 'Ventas del Período', 'Valor': '$' + totalPeriodo.toFixed(2) },
    ];
    const wsResumen = XLSX.utils.json_to_sheet(resumenData);
    wsResumen['!cols'] = [{ wch: 28 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen ' + filtroAnio);

    // Hoja 4: Ventas por mes
    const ventasMesData = ventasPorMes.map(v => ({
      'Mes': v.mes,
      'Total Ventas': '$' + v.total.toFixed(2),
    }));
    const wsVentasMes = XLSX.utils.json_to_sheet(ventasMesData);
    wsVentasMes['!cols'] = [{ wch: 12 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsVentasMes, 'Ventas por Mes');

    XLSX.writeFile(wb, 'Reporte_Inventario_' + filtroAnio + '.xlsx');
  };

  const fetchInventarios = async () => {
    try {
      const res = await API.get('/Inventarios');
      setInventarios(res.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchVentas = async () => {
    try {
      const res = await API.get('/Ventas');
      setVentas(res.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const abrirModal = (inventario) => {
    setModal(inventario);
    let entregadoActual = 'No';
    let fechaEntregaActual = '';
    ventas.forEach(v => {
      v.detalles?.forEach(d => {
        if (
          (d.idProducto === inventario.idProducto || d.id_producto === inventario.idProducto) &&
          d.entregado === 'Si'
        ) {
          entregadoActual = 'Si';
          if (d.fechaEntrega) {
            fechaEntregaActual = new Date(d.fechaEntrega).toISOString().split('T')[0];
          }
        }
      });
    });
    setMovimiento({
      tipo: 'COMPRA',
      cantidad: 1,
      entregado: entregadoActual,
      fechaEntrega: fechaEntregaActual,
      clienteId: ''
    });
  };

  const cerrarModal = () => {
    setModal(null);
    setMensaje(null);
  };

  // ===== REGISTRAR MOVIMIENTO — actualiza DetalleVenta, no Inventario =====
  const registrarMovimiento = async () => {
    if (movimiento.cantidad <= 0) return;

    if (movimiento.entregado === 'Si' && !movimiento.clienteId) {
      setMensaje('⚠️ Debes seleccionar el cliente al que se le entregó el mueble');
      return;
    }

    try {
      await API.post('/MovimientosInventario', {
        idProducto: modal.idProducto,
        tipo: movimiento.tipo,
        cantidad: parseInt(movimiento.cantidad),
      });

      if (movimiento.entregado === 'Si') {
        const detallesAActualizar = [];

        ventas.forEach(v => {
          const idClienteVenta = v.cliente?.idCliente || v.id_cliente;
          const clienteCoincide = String(idClienteVenta) === String(movimiento.clienteId);

          if (clienteCoincide) {
            v.detalles?.forEach(d => {
              const idProd = d.idProducto || d.id_producto;
              if (idProd === modal.idProducto) {
                detallesAActualizar.push({ detalle: d, venta: v });
              }
            });
          }
        });

        if (detallesAActualizar.length === 0) {
          setMensaje('⚠️ No se encontró el detalle de venta para este cliente y producto');
          return;
        }

        for (const { detalle } of detallesAActualizar) {
          const idDetalle = detalle.idDetalle || detalle.id_detalle;
          if (idDetalle) {
            await API.put('/DetalleVenta/' + idDetalle, {
              idDetalle: idDetalle,
              idProducto: detalle.idProducto || detalle.id_producto,
              cantidad: detalle.cantidad,
              precioUnitario: detalle.precioUnitario || detalle.precio_unitario,
              subtotal: detalle.subtotal,
              entregado: 'Si',
              fechaEntrega: movimiento.fechaEntrega || null,
            });
          }
        }

      } else {
        if (movimiento.clienteId) {
          const detallesAResetear = [];
          ventas.forEach(v => {
            const idClienteVenta = v.cliente?.idCliente || v.id_cliente;
            const clienteCoincide = String(idClienteVenta) === String(movimiento.clienteId);
            if (clienteCoincide) {
              v.detalles?.forEach(d => {
                const idProd = d.idProducto || d.id_producto;
                if (idProd === modal.idProducto && d.entregado === 'Si') {
                  detallesAResetear.push(d);
                }
              });
            }
          });

          for (const detalle of detallesAResetear) {
            const idDetalle = detalle.idDetalle || detalle.id_detalle;
            if (idDetalle) {
              await API.put('/DetalleVenta/' + idDetalle, {
                idDetalle: idDetalle,
                idProducto: detalle.idProducto || detalle.id_producto,
                cantidad: detalle.cantidad,
                precioUnitario: detalle.precioUnitario || detalle.precio_unitario,
                subtotal: detalle.subtotal,
                entregado: 'No',
                fechaEntrega: null,
              });
            }
          }
        }
      }

      setMensaje('✅ Movimiento registrado correctamente');
      await fetchInventarios();
      await fetchVentas();
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

  const getEntregaProducto = (idProducto) => {
    let entregado = 'No';
    let fechaEntrega = null;
    let totalEntregados = 0;
    let totalVendidos = 0;

    ventas.forEach(v => {
      v.detalles?.forEach(d => {
        const idProd = d.idProducto || d.id_producto;
        if (idProd === idProducto) {
          totalVendidos++;
          if (d.entregado === 'Si') {
            totalEntregados++;
            if (d.fechaEntrega) fechaEntrega = d.fechaEntrega;
          }
        }
      });
    });

    if (totalEntregados > 0 && totalEntregados === totalVendidos) {
      entregado = 'Si';
    } else if (totalEntregados > 0) {
      entregado = 'Parcial';
    }

    return { entregado, fechaEntrega, totalEntregados, totalVendidos };
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
      const nombre = detalle.producto?.nombre || 'Producto ' + detalle.idProducto;
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
  }));

  ventas
    .filter(v => new Date(v.fecha).getFullYear() === parseInt(filtroAnio))
    .forEach((v) => {
      const mes = new Date(v.fecha).getMonth();
      ventasPorMes[mes].total += v.total;
    });

  const totalPeriodo = ventasFiltradas.reduce((acc, v) => acc + v.total, 0);

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
    animation: false,
    maintainAspectRatio: false,
    cutout: '55%',
    layout: { padding: { right: 40, left: 0, top: 10, bottom: 10 } },
    plugins: {
      legend: {
        position: 'right',
        labels: { boxWidth: 12, padding: 15, font: { size: 12, family: 'Segoe UI' }, usePointStyle: true, pointStyle: 'circle', color: '#333' }
      },
      tooltip: {
        callbacks: { label: (ctx) => ' ' + ctx.label + ': ' + ctx.raw + ' unidades' },
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

      <div className="resumen-cards">
        <div className="resumen-card verde">
          <FaBoxes className="resumen-icon" />
          <div>
            <span className="resumen-numero">{inventarios.filter((i) => i.stock > i.stockMinimo).length}</span>
            <span className="resumen-label">En buen stock</span>
          </div>
        </div>
        <div className="resumen-card amarillo">
          <FaExclamationTriangle className="resumen-icon" />
          <div>
            <span className="resumen-numero">{inventarios.filter((i) => i.stock > 0 && i.stock <= i.stockMinimo).length}</span>
            <span className="resumen-label">Stock bajo</span>
          </div>
        </div>
        <div className="resumen-card rojo">
          <FaBoxes className="resumen-icon" />
          <div>
            <span className="resumen-numero">{inventarios.filter((i) => i.stock === 0).length}</span>
            <span className="resumen-label">Agotados</span>
          </div>
        </div>
      </div>

      <div className="inv-search">
        <FaSearch className="search-icon" />
        <input type="text" placeholder="Buscar producto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </div>

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
              <th>Entregado</th>
              {/* Se eliminó <th>Fecha Entrega</th> de aquí */}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {inventarioFiltrado.map((inv, index) => {
              const badge = getBadge(inv);
              const entrega = getEntregaProducto(inv.idProducto);
              return (
                <tr key={inv.idInventario} className={inv.stock === 0 ? 'fila-agotada' : entrega.entregado === 'Si' ? 'fila-entregada' : ''}>
                  <td>{index + 1}</td>
                  <td className="td-nombre">{inv.producto?.nombre}</td>
                  <td>{inv.producto?.categoria?.nombre || '—'}</td>
                  <td className="td-stock">{inv.stock}</td>
                  <td>{inv.stockMinimo}</td>
                  <td><span className={'badge-stock ' + badge.clase}>{badge.texto}</span></td>
                  <td>
                    {(() => {
                      if (entrega.entregado === 'Si') {
                        return <span className="badge-entregado entregado-si">✅ Todos entregados</span>;
                      } else if (entrega.entregado === 'Parcial') {
                        return (
                          <span className="badge-entregado entregado-parcial">
                            ⚠️ {entrega.totalEntregados}/{entrega.totalVendidos} entregados
                          </span>
                        );
                      } else {
                        return <span className="badge-entregado entregado-no">❌ No entregado</span>;
                      }
                    })()}
                  </td>
                  {/* Se eliminó el <td> de Fecha Entrega de aquí */}
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
        <div className="reportes-header">
          <h2 className="reportes-titulo"><FaChartBar /> Reportes de Ventas</h2>
          <div className="reportes-export-btns">
            <button onClick={exportarPDF} className="btn-export pdf"><FaFilePdf /> PDF</button>
            <button onClick={exportarExcel} className="btn-export excel"><FaFileExcel /> Excel</button>
          </div>
        </div>

        <div className="reportes-filtros">
          <div className="filtro-item">
            <label>Año</label>
            <select value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)}>
              {[2023, 2024, 2025, 2026].map((a) => (<option key={a} value={a}>{a}</option>))}
            </select>
          </div>
          <div className="filtro-item">
            <label>Mes</label>
            <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
              <option value="todos">Todos los meses</option>
              {meses.map((m, i) => (<option key={i} value={i}>{m}</option>))}
            </select>
          </div>
          <div className="filtro-total">
            <span>Total del período:</span>
            <strong>${totalPeriodo.toFixed(2)}</strong>
          </div>
        </div>

        <div className="reportes-graficas" ref={graficasRef}>

          <div className="grafica-card">
            <h3>📈 Ventas por Mes — {filtroAnio}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ventasPorMes} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => ['$' + v.toFixed(2), 'Total']} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                  {ventasPorMes.map((_, index) => (
                    <Cell key={index} fill={COLORS_VENTAS_BG[index % COLORS_VENTAS_BG.length]} stroke={COLORS_VENTAS_BORDER[index % COLORS_VENTAS_BORDER.length]} strokeWidth={1.5} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

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

          <div className="grafica-card">
            <h3>📦 Stock Actual por Producto</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={inventarios.map((inv) => ({ nombre: inv.producto?.nombre?.split(' ')[0] || 'N/A', stock: inv.stock, minimo: inv.stockMinimo }))}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="stock" name="Stock Actual" radius={[6,6,0,0]} isAnimationActive={false}>
                  {inventarios.map((_, index) => (
                    <Cell key={index} fill={COLORES_STOCK[index % COLORES_STOCK.length]} stroke={COLORES_STOCK_BORDER[index % COLORES_STOCK_BORDER.length]} strokeWidth={1.5} />
                  ))}
                </Bar>
                <Bar dataKey="minimo" name="Stock Mínimo" radius={[6,6,0,0]} fill="#ffd6a5" stroke="#f4a261" strokeWidth={1.5} opacity={0.7} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grafica-card">
            <h3>💰 Resumen de Ingresos — {filtroAnio}</h3>
            <div className="resumen-ingresos">
              <div className="ingreso-item" style={{ borderTop: '3px solid #40916c' }}>
                <span className="ingreso-label">Total Ventas del Año</span>
                <span className="ingreso-valor" style={{ color: '#40916c' }}>${ventas.filter(v => new Date(v.fecha).getFullYear() === parseInt(filtroAnio)).reduce((acc, v) => acc + v.total, 0).toFixed(2)}</span>
              </div>
              <div className="ingreso-item" style={{ borderTop: '3px solid #1a7fa8' }}>
                <span className="ingreso-label">Número de Ventas</span>
                <span className="ingreso-valor" style={{ color: '#1a7fa8' }}>{ventas.filter(v => new Date(v.fecha).getFullYear() === parseInt(filtroAnio)).length}</span>
              </div>
              <div className="ingreso-item" style={{ borderTop: '3px solid #f4a261' }}>
                <span className="ingreso-label">Promedio por Venta</span>
                <span className="ingreso-valor" style={{ color: '#f4a261' }}>
                  ${(() => {
                    const va = ventas.filter(v => new Date(v.fecha).getFullYear() === parseInt(filtroAnio));
                    return va.length > 0 ? (va.reduce((acc, v) => acc + v.total, 0) / va.length).toFixed(2) : '0.00';
                  })()}
                </span>
              </div>
              <div className="ingreso-item" style={{ borderTop: '3px solid #9b5de5' }}>
                <span className="ingreso-label">Productos en Inventario</span>
                <span className="ingreso-valor" style={{ color: '#9b5de5' }}>{inventarios.length}</span>
              </div>
              <div className="ingreso-item" style={{ borderTop: '3px solid #e63946' }}>
                <span className="ingreso-label">Total Unidades en Stock</span>
                <span className="ingreso-valor" style={{ color: '#e63946' }}>{inventarios.reduce((acc, i) => acc + i.stock, 0)}</span>
              </div>
              <div className="ingreso-item" style={{ borderTop: '3px solid #f72585' }}>
                <span className="ingreso-label">Ventas del Período</span>
                <span className="ingreso-valor" style={{ color: '#f72585' }}>${totalPeriodo.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="grafica-card grafica-full">
            <h3>🕒 Últimas 5 Ventas Realizadas</h3>
            <table className="ventas-recientes-tabla">
              <thead>
                <tr><th>#</th><th>Cliente</th><th>Fecha</th><th>Productos</th><th>Total</th></tr>
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
                    className={'tipo-btn ' + (movimiento.tipo === t ? 'activo ' : '') + 'tipo-' + t.toLowerCase()}
                    onClick={() => setMovimiento({ ...movimiento, tipo: t })}
                  >
                    {t === 'COMPRA' && <FaPlus />}{t === 'VENTA' && <FaMinus />}{t === 'AJUSTE' && <FaSyncAlt />} {t}
                  </button>
                ))}
              </div>

              <label>Cantidad</label>
              <input type="number" min="1" value={movimiento.cantidad} onChange={(e) => setMovimiento({ ...movimiento, cantidad: e.target.value })} className="modal-input" />

              <label>¿Fue entregado?</label>
              <div className="tipo-btns">
                <button
                  className={'tipo-btn ' + (movimiento.entregado === 'No' ? 'activo tipo-venta' : '')}
                  onClick={() => setMovimiento({ ...movimiento, entregado: 'No', fechaEntrega: '', clienteId: '' })}
                >
                  No entregado
                </button>
                <button
                  className={'tipo-btn ' + (movimiento.entregado === 'Si' ? 'activo tipo-compra' : '')}
                  onClick={() => setMovimiento({ ...movimiento, entregado: 'Si' })}
                >
                  Sí entregado
                </button>
              </div>

              {movimiento.entregado === 'Si' && (
                <>
                  <label>Seleccionar Cliente</label>
                  <select
                    className="modal-input"
                    value={movimiento.clienteId}
                    onChange={(e) => setMovimiento({ ...movimiento, clienteId: e.target.value })}
                  >
                    {clientesParaComboBox.length === 0 ? (
                      <option value="">— No ha comprado este producto —</option>
                    ) : (
                      <>
                        <option value="">— Seleccione el cliente —</option>
                        {clientesParaComboBox.map((cliente, idx) => (
                          <option key={idx} value={cliente.id}>{cliente.nombreCompleto}</option>
                        ))}
                      </>
                    )}
                  </select>

                  <label>Fecha de entrega</label>
                  <input
                    type="date"
                    value={movimiento.fechaEntrega}
                    onChange={(e) => setMovimiento({ ...movimiento, fechaEntrega: e.target.value })}
                    className="modal-input"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </>
              )}
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