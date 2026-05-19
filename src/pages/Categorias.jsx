import { useEffect, useState } from 'react';
import API from '../api/axios';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaCheck, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import './Categorias.css';

function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [esNuevo, setEsNuevo] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [expandidas, setExpandidas] = useState({});
  const [form, setForm] = useState({
    nombre: '', descripcion: '', idCategoriaPadre: ''
  });

  const cargarCategorias = async () => {
    try {
      const res = await API.get('/Categorias/padres');
      setCategorias(res.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    const inicializar = async () => {
      try {
        const res = await API.get('/Categorias/padres');
        setCategorias(res.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    inicializar();
  }, []);

  const toggleExpand = (id) => {
    setExpandidas(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const abrirNuevo = (idPadre = null) => {
    setEsNuevo(true);
    setForm({ nombre: '', descripcion: '', idCategoriaPadre: idPadre || '' });
    setModal({});
    setMensaje(null);
  };

  const abrirEditar = (cat) => {
    setEsNuevo(false);
    setForm({
      nombre: cat.nombre || '',
      descripcion: cat.descripcion || '',
      idCategoriaPadre: cat.idCategoriaPadre || ''
    });
    setModal(cat);
    setMensaje(null);
  };

  const cerrarModal = () => {
    setModal(null);
    setMensaje(null);
  };

  const guardar = async () => {
    if (!form.nombre) {
      setMensaje('⚠️ El nombre es obligatorio');
      return;
    }
    try {
      const dto = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        idCategoriaPadre: form.idCategoriaPadre ? parseInt(form.idCategoriaPadre) : null
      };
      if (esNuevo) {
        await API.post('/Categorias', dto);
        setMensaje('✅ Categoría creada correctamente');
      } else {
        await API.put(`/Categorias/${modal.idCategoria}`, dto);
        setMensaje('✅ Categoría actualizada correctamente');
      }
      await cargarCategorias();
      setTimeout(() => cerrarModal(), 1500);
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      setMensaje('❌ Error al guardar categoría');
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    try {
      await API.delete(`/Categorias/${id}`);
      await cargarCategorias();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="loading">⏳ Cargando categorías...</div>;

  return (
    <div className="categorias-container">
      <div className="categorias-header">
        <h1 className="page-title">🗂️ Gestión de Categorías</h1>
        <button className="btn-nueva-cat" onClick={() => abrirNuevo()}>
          <FaPlus /> Nueva Categoría
        </button>
      </div>

      <div className="categorias-lista">
        {categorias.map((cat) => (
          <div key={cat.idCategoria} className="categoria-padre-card">

            {/* Categoría padre */}
            <div className="cat-padre-row">
              <button className="btn-expand" onClick={() => toggleExpand(cat.idCategoria)}>
                {expandidas[cat.idCategoria] ? <FaChevronDown /> : <FaChevronRight />}
              </button>
              <div className="cat-icon-padre">🗂️</div>
              <div className="cat-info">
                <h3>{cat.nombre}</h3>
                <p>{cat.descripcion}</p>
              </div>
              <div className="cat-badges">
                <span className="badge-subcats">
                  {cat.subCategorias?.length || 0} subcategorías
                </span>
              </div>
              <div className="cat-acciones">
                <button className="btn-agregar-sub" onClick={() => abrirNuevo(cat.idCategoria)}>
                  <FaPlus /> Subcategoría
                </button>
                <button className="btn-editar-cat" onClick={() => abrirEditar(cat)}>
                  <FaEdit />
                </button>
                <button className="btn-eliminar-cat" onClick={() => eliminar(cat.idCategoria)}>
                  <FaTrash />
                </button>
              </div>
            </div>

            {/* Subcategorías */}
            {expandidas[cat.idCategoria] && cat.subCategorias?.length > 0 && (
              <div className="subcategorias-lista">
                {cat.subCategorias.map((sub) => (
                  <div key={sub.idCategoria} className="subcat-row">
                    <div className="subcat-icon">📁</div>
                    <div className="cat-info">
                      <h4>{sub.nombre}</h4>
                      <p>{sub.descripcion}</p>
                    </div>
                    <div className="cat-acciones">
                      <button className="btn-editar-cat" onClick={() => abrirEditar(sub)}>
                        <FaEdit />
                      </button>
                      <button className="btn-eliminar-cat" onClick={() => eliminar(sub.idCategoria)}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {expandidas[cat.idCategoria] && (!cat.subCategorias || cat.subCategorias.length === 0) && (
              <div className="sin-subcats">
                No hay subcategorías. <button onClick={() => abrirNuevo(cat.idCategoria)}>Agregar una</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {modal !== null && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-cat" onClick={(e) => e.stopPropagation()}>
            <div className="modal-cat-header">
              <h2>{esNuevo ? '➕ Nueva Categoría' : '✏️ Editar Categoría'}</h2>
              <button className="btn-cerrar-modal" onClick={cerrarModal}><FaTimes /></button>
            </div>

            <div className="modal-cat-body">
              <div className="form-grupo">
                <label>Nombre *</label>
                <input
                  placeholder="Ej: Closets de bebés"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div className="form-grupo">
                <label>Descripción</label>
                <input
                  placeholder="Descripción de la categoría"
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
              </div>
              <div className="form-grupo">
                <label>Categoría padre (opcional)</label>
                <select
                  value={form.idCategoriaPadre}
                  onChange={(e) => setForm({ ...form, idCategoriaPadre: e.target.value })}
                  className="checkout-select"
                >
                  <option value="">— Es una categoría principal —</option>
                  {categorias.map((c) => (
                    <option key={c.idCategoria} value={c.idCategoria}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {mensaje && (
              <p className={`modal-mensaje ${mensaje.includes('✅') ? 'success' : 'error'}`}>
                {mensaje}
              </p>
            )}

            <div className="modal-cat-footer">
              <button className="btn-cancelar" onClick={cerrarModal}>
                <FaTimes /> Cancelar
              </button>
              <button className="btn-guardar" onClick={guardar}>
                <FaCheck /> {esNuevo ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Categorias;