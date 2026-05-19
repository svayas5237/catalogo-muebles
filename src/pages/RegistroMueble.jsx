import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { FaBox, FaRuler, FaImage, FaCheck, FaArrowLeft, FaArrowRight, FaUpload, FaTimes } from 'react-icons/fa';
import './RegistroMueble.css';

// ===== VALIDACIONES =====
const soloNumeros = (v) => /^\d+$/.test(v);
const precioValido = (v) => !isNaN(v) && parseFloat(v) > 0;
const medidaValida = (v) => /^\d+(\.\d+)?(cm|m|mm)?$/.test(v.trim());
const soloLetrasYEspacios = (v) => /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s\-]+$/.test(v.trim());

function RegistroMueble() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);
  const [categorias, setCategorias] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState({});

  const [infoBasica, setInfoBasica] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    idCategoria: '',
    idSubCategoria: '',
    activo: true,
  });

  const [inventario, setInventario] = useState({
    stock: '',
    stockMinimo: '',
  });

  const [especificaciones, setEspecificaciones] = useState({
    alto: '',
    ancho: '',
    profundidad: '',
    material: 'Melamina de alta calidad antihumedad y antirayaduras',
    color: '',
    duracion: '30 a 40 años',
    caracteristicas: '',
  });

  const [fotosCatalogo, setFotosCatalogo] = useState([]);
  const [fotosDetalle, setFotosDetalle] = useState([]);
  const [previstasCatalogo, setPrevistasCatalogo] = useState([]);
  const [previstasDetalle, setPrevistasDetalle] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await API.get('/Categorias/padres');
        setCategorias(res.data);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    cargar();
  }, []);

  const categoriaPadreSeleccionada = categorias.find(
    c => String(c.idCategoria) === String(infoBasica.idCategoria)
  );
  const subCategorias = categoriaPadreSeleccionada?.subCategorias || [];

  const handleFotosCatalogo = (e) => {
    const files = Array.from(e.target.files);
    setFotosCatalogo(prev => [...prev, ...files]);
    setPrevistasCatalogo(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const handleFotosDetalle = (e) => {
    const files = Array.from(e.target.files);
    setFotosDetalle(prev => [...prev, ...files]);
    setPrevistasDetalle(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const eliminarFotoCatalogo = (index) => {
    setFotosCatalogo(prev => prev.filter((_, i) => i !== index));
    setPrevistasCatalogo(prev => prev.filter((_, i) => i !== index));
  };

  const eliminarFotoDetalle = (index) => {
    setFotosDetalle(prev => prev.filter((_, i) => i !== index));
    setPrevistasDetalle(prev => prev.filter((_, i) => i !== index));
  };

  const subirFoto = async (file) => {
    const formData = new FormData();
    formData.append('archivo', file);
    const res = await fetch('http://localhost:5223/api/Archivos/subir', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Error al subir foto');
    const data = await res.json();
    return `http://localhost:5223${data.urlImagen}`;
  };

  const validarPaso1 = () => {
    const nuevosErrores = {};

    if (!infoBasica.nombre.trim())
      nuevosErrores.nombre = 'El nombre es obligatorio';
    else if (infoBasica.nombre.trim().length < 3)
      nuevosErrores.nombre = 'Mínimo 3 caracteres';

    if (!infoBasica.idCategoria)
      nuevosErrores.idCategoria = 'Selecciona una categoría';

    if (!infoBasica.precio)
      nuevosErrores.precio = 'El precio es obligatorio';
    else if (!precioValido(infoBasica.precio))
      nuevosErrores.precio = 'Ingresa un precio válido mayor a 0';

    if (!infoBasica.descripcion.trim())
      nuevosErrores.descripcion = 'La descripción es obligatoria';
    else if (infoBasica.descripcion.trim().length < 10)
      nuevosErrores.descripcion = 'Mínimo 10 caracteres';

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const validarPaso2 = () => {
    const nuevosErrores = {};

    if (!inventario.stock)
      nuevosErrores.stock = 'El stock es obligatorio';
    else if (!soloNumeros(inventario.stock) || parseInt(inventario.stock) < 0)
      nuevosErrores.stock = 'Solo números enteros positivos';

    if (!inventario.stockMinimo)
      nuevosErrores.stockMinimo = 'El stock mínimo es obligatorio';
    else if (!soloNumeros(inventario.stockMinimo) || parseInt(inventario.stockMinimo) < 0)
      nuevosErrores.stockMinimo = 'Solo números enteros positivos';
    else if (parseInt(inventario.stockMinimo) >= parseInt(inventario.stock))
      nuevosErrores.stockMinimo = 'El stock mínimo debe ser menor al stock actual';

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const validarPaso3 = () => {
    const nuevosErrores = {};

    if (especificaciones.alto && !medidaValida(especificaciones.alto))
      nuevosErrores.alto = 'Formato válido: 180 o 180cm';

    if (especificaciones.ancho && !medidaValida(especificaciones.ancho))
      nuevosErrores.ancho = 'Formato válido: 90 o 90cm';

    if (especificaciones.profundidad && !medidaValida(especificaciones.profundidad))
      nuevosErrores.profundidad = 'Formato válido: 52 o 52cm';

    if (especificaciones.color && !soloLetrasYEspacios(especificaciones.color))
      nuevosErrores.color = 'Solo letras y espacios';

    if (especificaciones.material && especificaciones.material.trim().length < 3)
      nuevosErrores.material = 'Mínimo 3 caracteres';

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const validarPaso4 = () => {
    const nuevosErrores = {};
    if (fotosCatalogo.length === 0)
      nuevosErrores.fotosCatalogo = 'Sube al menos una foto para el catálogo';
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const siguiente = () => {
    setMensaje(null);
    let valido = true;
    if (paso === 1) valido = validarPaso1();
    if (paso === 2) valido = validarPaso2();
    if (paso === 3) valido = validarPaso3();
    if (valido) {
      setErrores({});
      setPaso(paso + 1);
    } else {
      setMensaje('⚠️ Corrige los errores antes de continuar');
    }
  };

  const anterior = () => {
    setMensaje(null);
    setErrores({});
    setPaso(paso - 1);
  };

  const registrarMueble = async () => {
    if (!validarPaso4()) {
      setMensaje('⚠️ Sube al menos una foto del catálogo');
      return;
    }
    setLoading(true);
    setMensaje(null);
    try {
      const idCat = infoBasica.idSubCategoria || infoBasica.idCategoria;
      const prodRes = await API.post('/Productos', {
        idCategoria: parseInt(idCat),
        nombre: infoBasica.nombre,
        descripcion: infoBasica.descripcion,
        precio: parseFloat(infoBasica.precio),
        activo: true,
      });
      const idProducto = prodRes.data.idProducto;

      await API.post('/Inventarios', {
        idProducto,
        stock: parseInt(inventario.stock),
        stockMinimo: parseInt(inventario.stockMinimo),
      });

      await API.post('/ProductoDetalles', {
        idProducto,
        alto: especificaciones.alto,
        ancho: especificaciones.ancho,
        profundidad: especificaciones.profundidad,
        material: especificaciones.material,
        color: especificaciones.color,
        duracion: especificaciones.duracion,
        caracteristicas: especificaciones.caracteristicas,
      });

      for (let i = 0; i < fotosCatalogo.length; i++) {
        const urlImagen = await subirFoto(fotosCatalogo[i]);
        await API.post('/ProductoImagenes', {
          idProducto, urlImagen, esPrincipal: i === 0,
        });
      }

      for (let i = 0; i < fotosDetalle.length; i++) {
        const urlImagen = await subirFoto(fotosDetalle[i]);
        await API.post('/ProductoDetalleImagenes', {
          idProducto, urlImagen, esPrincipal: i === 0, orden: i + 1,
        });
      }

      setPaso(5);
    } catch (error) {
      console.error(error);
      setMensaje('❌ Error al registrar el mueble. Verifica que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPaso(1);
    setInfoBasica({ nombre: '', descripcion: '', precio: '', idCategoria: '', idSubCategoria: '', activo: true });
    setInventario({ stock: '', stockMinimo: '' });
    setEspecificaciones({ alto: '', ancho: '', profundidad: '', material: 'Melamina de alta calidad antihumedad y antirayaduras', color: '', duracion: '30 a 40 años', caracteristicas: '' });
    setFotosCatalogo([]);
    setFotosDetalle([]);
    setPrevistasCatalogo([]);
    setPrevistasDetalle([]);
    setMensaje(null);
    setErrores({});
  };

  return (
    <div className="registro-container">

      {paso < 5 && (
        <div className="registro-progress">
          {[
            { num: 1, label: 'Información', icon: <FaBox /> },
            { num: 2, label: 'Inventario', icon: <FaBox /> },
            { num: 3, label: 'Especificaciones', icon: <FaRuler /> },
            { num: 4, label: 'Fotos', icon: <FaImage /> },
          ].map((p, i, arr) => (
            <div key={p.num} className="progress-wrapper">
              <div className={`progress-step ${paso >= p.num ? 'activo' : ''} ${paso > p.num ? 'completado' : ''}`}>
                <div className="step-circle">
                  {paso > p.num ? '✓' : p.icon}
                </div>
                <span>{p.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div className={`progress-linea ${paso > p.num ? 'activa' : ''}`}></div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className={`registro-layout ${paso === 5 ? 'registro-layout-exito' : ''}`}>
        <div className="registro-card">

          {/* PASO 1 */}
          {paso === 1 && (
            <>
              <h2><FaBox /> Información del Mueble</h2>
              <p className="registro-subtitle">Datos principales del producto</p>
              <div className="form-grid">
                <div className="form-grupo form-full">
                  <label>Nombre del mueble *</label>
                  <input
                    placeholder="Ej: Closet Moderno 3 puertas"
                    value={infoBasica.nombre}
                    onChange={(e) => setInfoBasica({ ...infoBasica, nombre: e.target.value })}
                    className={errores.nombre ? 'input-error' : ''}
                  />
                  {errores.nombre && <span className="error-msg">⚠️ {errores.nombre}</span>}
                </div>

                <div className="form-grupo">
                  <label>Categoría *</label>
                  <select
                    value={infoBasica.idCategoria}
                    onChange={(e) => setInfoBasica({ ...infoBasica, idCategoria: e.target.value, idSubCategoria: '' })}
                    className={errores.idCategoria ? 'input-error' : ''}
                  >
                    <option value="">— Seleccionar —</option>
                    {categorias.map((c) => (
                      <option key={c.idCategoria} value={c.idCategoria}>{c.nombre}</option>
                    ))}
                  </select>
                  {errores.idCategoria && <span className="error-msg">⚠️ {errores.idCategoria}</span>}
                </div>

                {subCategorias.length > 0 && (
                  <div className="form-grupo">
                    <label>Subcategoría (opcional)</label>
                    <select
                      value={infoBasica.idSubCategoria}
                      onChange={(e) => setInfoBasica({ ...infoBasica, idSubCategoria: e.target.value })}
                    >
                      <option value="">— Seleccionar subcategoría —</option>
                      {subCategorias.map((s) => (
                        <option key={s.idCategoria} value={s.idCategoria}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-grupo">
                  <label>Precio ($) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    value={infoBasica.precio}
                    onChange={(e) => setInfoBasica({ ...infoBasica, precio: e.target.value })}
                    className={errores.precio ? 'input-error' : ''}
                  />
                  {errores.precio && <span className="error-msg">⚠️ {errores.precio}</span>}
                </div>

                <div className="form-grupo form-full">
                  <label>Descripción * (mínimo 10 caracteres)</label>
                  <textarea
                    placeholder="Describe brevemente el mueble"
                    value={infoBasica.descripcion}
                    onChange={(e) => setInfoBasica({ ...infoBasica, descripcion: e.target.value })}
                    rows={3}
                    className={errores.descripcion ? 'input-error' : ''}
                  />
                  {errores.descripcion && <span className="error-msg">⚠️ {errores.descripcion}</span>}
                </div>
              </div>
            </>
          )}

          {/* PASO 2 */}
          {paso === 2 && (
            <>
              <h2><FaBox /> Inventario</h2>
              <p className="registro-subtitle">Define el stock del mueble</p>
              <div className="form-grid">
                <div className="form-grupo">
                  <label>Stock actual *</label>
                  <input
                    type="number"
                    placeholder="Ej: 10"
                    min="0"
                    value={inventario.stock}
                    onChange={(e) => setInventario({ ...inventario, stock: e.target.value })}
                    className={errores.stock ? 'input-error' : ''}
                  />
                  {errores.stock && <span className="error-msg">⚠️ {errores.stock}</span>}
                </div>
                <div className="form-grupo">
                  <label>Stock mínimo *</label>
                  <input
                    type="number"
                    placeholder="Ej: 2"
                    min="0"
                    value={inventario.stockMinimo}
                    onChange={(e) => setInventario({ ...inventario, stockMinimo: e.target.value })}
                    className={errores.stockMinimo ? 'input-error' : ''}
                  />
                  {errores.stockMinimo && <span className="error-msg">⚠️ {errores.stockMinimo}</span>}
                </div>
              </div>
              <div className="stock-preview">
                <div className="stock-item">
                  <span className="stock-num">{inventario.stock || 0}</span>
                  <span className="stock-label">Unidades disponibles</span>
                </div>
                <div className="stock-item">
                  <span className="stock-num amarillo">{inventario.stockMinimo || 0}</span>
                  <span className="stock-label">Alerta de stock bajo</span>
                </div>
              </div>
            </>
          )}

          {/* PASO 3 */}
          {paso === 3 && (
            <>
              <h2><FaRuler /> Especificaciones</h2>
              <p className="registro-subtitle">Medidas en números (ej: 180 o 180cm) — todas opcionales</p>
              <div className="form-grid">
                <div className="form-grupo">
                  <label>Alto</label>
                  <input
                    placeholder="Ej: 180 o 180cm"
                    value={especificaciones.alto}
                    onChange={(e) => setEspecificaciones({ ...especificaciones, alto: e.target.value })}
                    className={errores.alto ? 'input-error' : ''}
                  />
                  {errores.alto && <span className="error-msg">⚠️ {errores.alto}</span>}
                </div>

                <div className="form-grupo">
                  <label>Ancho</label>
                  <input
                    placeholder="Ej: 90 o 90cm"
                    value={especificaciones.ancho}
                    onChange={(e) => setEspecificaciones({ ...especificaciones, ancho: e.target.value })}
                    className={errores.ancho ? 'input-error' : ''}
                  />
                  {errores.ancho && <span className="error-msg">⚠️ {errores.ancho}</span>}
                </div>

                <div className="form-grupo">
                  <label>Profundidad</label>
                  <input
                    placeholder="Ej: 52 o 52cm"
                    value={especificaciones.profundidad}
                    onChange={(e) => setEspecificaciones({ ...especificaciones, profundidad: e.target.value })}
                    className={errores.profundidad ? 'input-error' : ''}
                  />
                  {errores.profundidad && <span className="error-msg">⚠️ {errores.profundidad}</span>}
                </div>

                <div className="form-grupo">
                  <label>Color</label>
                  <input
                    placeholder="Ej: Blanco (solo letras)"
                    value={especificaciones.color}
                    onChange={(e) => {
                      if (e.target.value && !/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s\-]*$/.test(e.target.value)) return;
                      setEspecificaciones({ ...especificaciones, color: e.target.value });
                    }}
                    className={errores.color ? 'input-error' : ''}
                  />
                  {errores.color && <span className="error-msg">⚠️ {errores.color}</span>}
                </div>

                <div className="form-grupo form-full">
                  <label>Material</label>
                  <input
                    placeholder="Material"
                    value={especificaciones.material}
                    onChange={(e) => setEspecificaciones({ ...especificaciones, material: e.target.value })}
                    className={errores.material ? 'input-error' : ''}
                  />
                  {errores.material && <span className="error-msg">⚠️ {errores.material}</span>}
                </div>

                <div className="form-grupo">
                  <label>Duración estimada</label>
                  <input
                    placeholder="Ej: 30 a 40 años"
                    value={especificaciones.duracion}
                    onChange={(e) => setEspecificaciones({ ...especificaciones, duracion: e.target.value })}
                  />
                </div>

                <div className="form-grupo form-full">
                  <label>Características adicionales</label>
                  <textarea
                    placeholder="Ej: Espacio para vestidos, camisas, cajones para ropa"
                    value={especificaciones.caracteristicas}
                    onChange={(e) => setEspecificaciones({ ...especificaciones, caracteristicas: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
            </>
          )}

          {/* PASO 4 */}
          {paso === 4 && (
            <>
              <h2><FaImage /> Fotos del Mueble</h2>
              <p className="registro-subtitle">Sube las fotos del catálogo y del taller</p>

              <div className="fotos-section">
                <h3>📸 Fotos del Catálogo *</h3>
                <p className="fotos-hint">La primera foto será la principal en el catálogo</p>
                <label className="upload-btn">
                  <FaUpload /> Seleccionar fotos
                  <input type="file" multiple accept="image/*" onChange={handleFotosCatalogo} hidden />
                </label>
                {errores.fotosCatalogo && (
                  <span className="error-msg">⚠️ {errores.fotosCatalogo}</span>
                )}
                {previstasCatalogo.length > 0 && (
                  <div className="fotos-preview">
                    {previstasCatalogo.map((src, i) => (
                      <div key={i} className="foto-preview-item">
                        <img src={src} alt={`catalogo ${i}`} />
                        {i === 0 && <span className="foto-principal-badge">Principal</span>}
                        <button className="foto-eliminar" onClick={() => eliminarFotoCatalogo(i)}>
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="fotos-section">
                <h3>🏭 Fotos originales (opcional)</h3>
                <p className="fotos-hint">Fotos reales para el carrusel del detalle del mueble</p>
                <label className="upload-btn">
                  <FaUpload /> Seleccionar fotos originales
                  <input type="file" multiple accept="image/*" onChange={handleFotosDetalle} hidden />
                </label>
                {previstasDetalle.length > 0 && (
                  <div className="fotos-preview">
                    {previstasDetalle.map((src, i) => (
                      <div key={i} className="foto-preview-item">
                        <img src={src} alt={`detalle ${i}`} />
                        {i === 0 && <span className="foto-principal-badge">Principal</span>}
                        <button className="foto-eliminar" onClick={() => eliminarFotoDetalle(i)}>
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* PASO 5 */}
          {paso === 5 && (
            <div className="registro-exito">
              <FaCheck className="exito-icon-registro" />
              <h2>¡Mueble Registrado!</h2>
              <p>El mueble fue registrado exitosamente con todas sus fotos.</p>
              <div className="exito-acciones">
                <button className="btn-siguiente" onClick={() => navigate('/catalogo')}>
                  Ver en Catálogo
                </button>
                <button className="btn-volver-checkout" onClick={resetForm}>
                  Registrar otro mueble
                </button>
              </div>
            </div>
          )}

          {mensaje && (
            <p className={`checkout-mensaje ${mensaje.includes('✅') ? 'success' : 'error'}`}>
              {mensaje}
            </p>
          )}

          {paso < 5 && (
            <div className="checkout-acciones">
              {paso > 1 ? (
                <button className="btn-volver-checkout" onClick={anterior}>
                  <FaArrowLeft /> Volver
                </button>
              ) : (
                <button className="btn-volver-checkout" onClick={() => navigate('/inventario')}>
                  <FaArrowLeft /> Cancelar
                </button>
              )}
              {paso < 4 ? (
                <button className="btn-siguiente" onClick={siguiente}>
                  Siguiente <FaArrowRight />
                </button>
              ) : (
                <button className="btn-confirmar-checkout" onClick={registrarMueble} disabled={loading}>
                  {loading ? '⏳ Registrando...' : '✅ Registrar Mueble'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Resumen lateral */}
        {paso < 5 && (
          <div className="registro-resumen">
            <h3>📋 Resumen</h3>
            {infoBasica.nombre && (
              <div className="resumen-dato">
                <span className="resumen-label">Mueble</span>
                <span className="resumen-valor">{infoBasica.nombre}</span>
              </div>
            )}
            {infoBasica.precio && (
              <div className="resumen-dato">
                <span className="resumen-label">Precio</span>
                <span className="resumen-valor">${infoBasica.precio}</span>
              </div>
            )}
            {infoBasica.idCategoria && (
              <div className="resumen-dato">
                <span className="resumen-label">Categoría</span>
                <span className="resumen-valor">
                  {categorias.find(c => String(c.idCategoria) === String(infoBasica.idCategoria))?.nombre}
                  {infoBasica.idSubCategoria && ` › ${subCategorias.find(s => String(s.idCategoria) === String(infoBasica.idSubCategoria))?.nombre}`}
                </span>
              </div>
            )}
            {inventario.stock && (
              <div className="resumen-dato">
                <span className="resumen-label">Stock</span>
                <span className="resumen-valor">{inventario.stock} unidades</span>
              </div>
            )}
            {especificaciones.alto && (
              <div className="resumen-dato">
                <span className="resumen-label">Medidas</span>
                <span className="resumen-valor">{especificaciones.alto} x {especificaciones.ancho} x {especificaciones.profundidad}</span>
              </div>
            )}
            {previstasCatalogo.length > 0 && (
              <div className="resumen-dato">
                <span className="resumen-label">Fotos catálogo</span>
                <span className="resumen-valor">{previstasCatalogo.length} foto(s)</span>
              </div>
            )}
            {previstasDetalle.length > 0 && (
              <div className="resumen-dato">
                <span className="resumen-label">Fotos taller</span>
                <span className="resumen-valor">{previstasDetalle.length} foto(s)</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default RegistroMueble;