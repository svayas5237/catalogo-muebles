import { useEffect, useState } from 'react';
import API from '../api/axios';
import { FaEdit, FaTrash, FaPlus, FaTimes, FaCheck, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './GestionMuebles.css';

function GestionMuebles() {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [errores, setErrores] = useState({});
  const [form, setForm] = useState({
    nombre: '', descripcion: '', precio: '', idCategoria: '', activo: true
  });

  const cargarDatos = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        API.get('/Productos'),
        API.get('/Categorias/padres'),
      ]);
      setProductos(prodRes.data);
      setCategorias(catRes.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    const inicializar = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          API.get('/Productos'),
          API.get('/Categorias/padres'),
        ]);
        setProductos(prodRes.data);
        setCategorias(catRes.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    inicializar();
  }, []);

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const abrirEditar = (producto) => {
    setForm({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      idCategoria: producto.idCategoria,
      activo: producto.activo,
    });
    setModal(producto);
    setMensaje(null);
    setErrores({});
  };

  const cerrarModal = () => {
    setModal(null);
    setMensaje(null);
    setErrores({});
  };

  const validar = () => {
    const nuevosErrores = {};
    if (!form.nombre.trim()) nuevosErrores.nombre = 'El nombre es obligatorio';
    else if (form.nombre.trim().length < 3) nuevosErrores.nombre = 'Mínimo 3 caracteres';
    if (!form.descripcion.trim()) nuevosErrores.descripcion = 'La descripción es obligatoria';
    else if (form.descripcion.trim().length < 10) nuevosErrores.descripcion = 'Mínimo 10 caracteres';
    if (!form.precio) nuevosErrores.precio = 'El precio es obligatorio';
    else if (isNaN(form.precio) || parseFloat(form.precio) <= 0) nuevosErrores.precio = 'Precio válido mayor a 0';
    if (!form.idCategoria) nuevosErrores.idCategoria = 'Selecciona una categoría';
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const guardar = async () => {
    if (!validar()) {
      setMensaje('⚠️ Corrige los errores antes de continuar');
      return;
    }
    try {
      await API.put(`/Productos/${modal.idProducto}`, {
        nombre: form.nombre,
        descripcion: form.descripcion,
        precio: parseFloat(form.precio),
        idCategoria: parseInt(form.idCategoria),
        activo: form.activo,
      });
      setMensaje('✅ Mueble actualizado correctamente');
      await cargarDatos();
      setTimeout(() => cerrarModal(), 1500);
    } catch (error) {
      console.error(error);
      setMensaje('❌ Error al actualizar el mueble');
    }
  };

  const eliminar = async (producto) => {
    if (!window.confirm(`¿Eliminar "${producto.nombre}" del catálogo?\n\nEsto eliminará también sus fotos, especificaciones e inventario.`)) return;
    try {
      await API.delete(`/Productos/${producto.idProducto}`);
      await cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al eliminar el mueble');
    }
  };

  if (loading) return <div className="loading">⏳ Cargando muebles...</div>;

  return (
    <div className="gestion-container">
      <div className="gestion-header">
        <h1 className="page-title">🛋️ Gestión de Muebles</h1>
        <button className="btn-nuevo-mueble" onClick={() => navigate('/registro-mueble')}>
          <FaPlus /> Nuevo Mueble
        </button>
      </div>

      {/* Buscador */}
      <div className="gestion-search">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Buscar mueble..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla */}
      <div className="tabla-wrapper">
        <table className="gestion-tabla">
          <thead>
            <tr>
              <th>Foto</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((p) => (
              <tr key={p.idProducto}>
                <td>
                  <div className="gestion-foto">
                    {p.imagenes?.length > 0 ? (
                      <img
                        src={p.imagenes.find(i => i.esPrincipal)?.urlImagen || p.imagenes[0].urlImagen}
                        alt={p.nombre}
                      />
                    ) : (
                      <span className="sin-foto">🪑</span>
                    )}
                  </div>
                </td>
                <td className="td-nombre-mueble">{p.nombre}</td>
                <td>{p.categoria?.nombre || '—'}</td>
                <td><strong>${p.precio.toFixed(2)}</strong></td>
                <td>
                  <span className={`badge-stock ${
                    p.inventario?.stock === 0 ? 'badge-agotado' :
                    p.inventario?.stock <= p.inventario?.stockMinimo ? 'badge-bajo' : 'badge-ok'
                  }`}>
                    {p.inventario?.stock ?? '—'}
                  </span>
                </td>
                <td>
                  <span className={p.activo ? 'badge-activo' : 'badge-inactivo'}>
                    {p.activo ? '✅ Activo' : '❌ Inactivo'}
                  </span>
                </td>
                <td>
                  <div className="gestion-acciones">
                    <button className="btn-editar-mueble" onClick={() => abrirEditar(p)}>
                      <FaEdit /> Editar
                    </button>
                    <button className="btn-eliminar-mueble" onClick={() => eliminar(p)}>
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {productosFiltrados.length === 0 && (
          <div className="sin-datos">😕 No se encontraron muebles</div>
        )}
      </div>

      {/* Modal Editar */}
      {modal && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-gestion" onClick={(e) => e.stopPropagation()}>
            <div className="modal-gestion-header">
              <h2>✏️ Editar Mueble</h2>
              <button className="btn-cerrar-modal" onClick={cerrarModal}><FaTimes /></button>
            </div>

            <div className="modal-gestion-body">
              <div className="form-grupo">
                <label>Nombre *</label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className={errores.nombre ? 'input-error' : ''}
                />
                {errores.nombre && <span className="error-msg">⚠️ {errores.nombre}</span>}
              </div>

              <div className="form-grupo">
                <label>Descripción *</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  rows={3}
                  className={errores.descripcion ? 'input-error' : ''}
                />
                {errores.descripcion && <span className="error-msg">⚠️ {errores.descripcion}</span>}
              </div>

              <div className="form-grupo">
                <label>Precio ($) *</label>
                <input
                  type="number"
                  min="0"
                  value={form.precio}
                  onChange={(e) => setForm({ ...form, precio: e.target.value })}
                  className={errores.precio ? 'input-error' : ''}
                />
                {errores.precio && <span className="error-msg">⚠️ {errores.precio}</span>}
              </div>

              <div className="form-grupo">
                <label>Categoría *</label>
                <select
                  value={form.idCategoria}
                  onChange={(e) => setForm({ ...form, idCategoria: e.target.value })}
                  className={errores.idCategoria ? 'input-error' : ''}
                >
                  <option value="">— Seleccionar —</option>
                  {categorias.map((c) => (
                    <option key={c.idCategoria} value={c.idCategoria}>{c.nombre}</option>
                  ))}
                </select>
                {errores.idCategoria && <span className="error-msg">⚠️ {errores.idCategoria}</span>}
              </div>

              <div className="form-grupo">
                <label>Estado</label>
                <div className="estado-selector">
                  <div
                    className={`estado-opcion ${form.activo ? 'activo' : ''}`}
                    onClick={() => setForm({ ...form, activo: true })}
                  >
                    ✅ Activo
                    {form.activo && <FaCheck className="estado-check" />}
                  </div>
                  <div
                    className={`estado-opcion ${!form.activo ? 'inactivo' : ''}`}
                    onClick={() => setForm({ ...form, activo: false })}
                  >
                    ❌ Inactivo
                    {!form.activo && <FaCheck className="estado-check" />}
                  </div>
                </div>
              </div>
            </div>

            {mensaje && (
              <p className={`modal-mensaje ${mensaje.includes('✅') ? 'success' : 'error'}`}>
                {mensaje}
              </p>
            )}

            <div className="modal-gestion-footer">
              <button className="btn-cancelar" onClick={cerrarModal}>
                <FaTimes /> Cancelar
              </button>
              <button className="btn-guardar" onClick={guardar}>
                <FaCheck /> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionMuebles;