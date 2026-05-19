import { useEffect, useState } from 'react';
import API from '../api/axios';
import { FaUserCog, FaEdit, FaTrash, FaPlus, FaTimes, FaCheck, FaEye, FaEyeSlash, FaShieldAlt } from 'react-icons/fa';
import './Usuarios.css';

// ===== VALIDACIONES =====
const soloLetras = (v) => /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/.test(v.trim());

const nombrePropio = (v) => {
  const palabras = v.trim().split(/\s+/);
  return palabras.length >= 2 && palabras.every(p => p.length >= 2);
};

const DOMINIOS_VALIDOS = [
  'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com',
  'icloud.com', 'live.com', 'yahoo.es', 'hotmail.es',
  'outlook.es', 'me.com', 'msn.com', 'protonmail.com',
  'ecology.com', 'empresa.com'
];

const correoValido = (v) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(v)) return false;
  const dominio = v.split('@')[1]?.toLowerCase();
  return DOMINIOS_VALIDOS.includes(dominio);
};

const passwordFuerte = (v) => ({
  longitud: v.length >= 8,
  mayuscula: /[A-Z]/.test(v),
  minuscula: /[a-z]/.test(v),
  numero: /[0-9]/.test(v),
  especial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v),
});

const PERMISOS_DISPONIBLES = [
  { key: 'inicio', label: 'Inicio', desc: 'Ver la página de inicio' },
  { key: 'catalogo', label: 'Catálogo', desc: 'Ver el catálogo de muebles' },
  { key: 'carrito', label: 'Carrito', desc: 'Ver y gestionar el carrito' },
  { key: 'ventas', label: 'Ventas', desc: 'Ver ventas del día y semana' },
  { key: 'inventario', label: 'Inventario', desc: 'Ver y gestionar el inventario' },
  { key: 'usuarios', label: 'Usuarios', desc: 'Gestionar usuarios del sistema' },
  { key: 'categorias', label: 'Categorías', desc: 'Gestionar categorías de muebles' },
  { key: 'registro-mueble', label: 'Nuevo Mueble', desc: 'Registrar nuevos muebles' },
  { key: 'gestion-muebles', label: 'Mis Muebles', desc: 'Editar y eliminar muebles' },
];

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [modalPermisos, setModalPermisos] = useState(null);
  const [modalRoles, setModalRoles] = useState(false);
  const [modalNuevoRol, setModalNuevoRol] = useState(null);
  const [esNuevoRol, setEsNuevoRol] = useState(false);
  const [permisosSeleccionados, setPermisosSeleccionados] = useState([]);
  const [esNuevo, setEsNuevo] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [mensajePermisos, setMensajePermisos] = useState(null);
  const [mensajeRol, setMensajeRol] = useState(null);
  const [errores, setErrores] = useState({});
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [formRol, setFormRol] = useState({ nombre: '', descripcion: '' });
  const [form, setForm] = useState({
    nombre: '', email: '', password: '', rol: 'vendedor'
  });

  const checksPassword = form.password
    ? passwordFuerte(form.password)
    : { longitud: false, mayuscula: false, minuscula: false, numero: false, especial: false };

  const cargarUsuarios = async () => {
    try {
      const res = await API.get('/Usuarios');
      setUsuarios(res.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const cargarRoles = async () => {
    try {
      const res = await API.get('/Roles');
      setRoles(res.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    const inicializar = async () => {
      try {
        const [usRes, rolRes] = await Promise.all([
          API.get('/Usuarios'),
          API.get('/Roles'),
        ]);
        setUsuarios(usRes.data);
        setRoles(rolRes.data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    inicializar();
  }, []);

  const validarCampo = (campo, valor) => {
    let error = '';
    switch (campo) {
      case 'nombre':
        if (!valor.trim())
          error = 'El nombre es obligatorio';
        else if (!soloLetras(valor))
          error = 'Solo se permiten letras y espacios, sin números ni símbolos';
        else if (!nombrePropio(valor))
          error = 'Ingresa nombre y apellido (Ej: Juan Pérez)';
        break;
      case 'email':
        if (!valor.trim())
          error = 'El correo es obligatorio';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor))
          error = 'Formato inválido (Ej: nombre@gmail.com)';
        else if (!correoValido(valor))
          error = 'Usa un correo conocido: @gmail.com, @hotmail.com, @outlook.com, @yahoo.com...';
        break;
      case 'password':
        if (esNuevo && !valor) {
          error = 'La contraseña es obligatoria';
        } else if (valor) {
          const checks = passwordFuerte(valor);
          if (!checks.longitud) error = 'Mínimo 8 caracteres';
          else if (!checks.mayuscula) error = 'Debe tener al menos una mayúscula';
          else if (!checks.minuscula) error = 'Debe tener al menos una minúscula';
          else if (!checks.numero) error = 'Debe tener al menos un número';
          else if (!checks.especial) error = 'Debe tener al menos un carácter especial';
        }
        break;
      default:
        break;
    }
    setErrores(prev => ({ ...prev, [campo]: error }));
    return error === '';
  };

  const handleCambioCampo = (campo, valor) => {
    if (campo === 'nombre' && valor && !/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]*$/.test(valor)) return;
    setForm(prev => ({ ...prev, [campo]: valor }));
    if (errores[campo]) validarCampo(campo, valor);
  };

  const abrirNuevo = () => {
    setEsNuevo(true);
    setForm({ nombre: '', email: '', password: '', rol: 'vendedor' });
    setErrores({});
    setModal({});
    setMensaje(null);
    setMostrarPassword(false);
  };

  const abrirEditar = (usuario) => {
    setEsNuevo(false);
    setForm({ nombre: usuario.nombre, email: usuario.email, password: '', rol: usuario.rol });
    setErrores({});
    setModal(usuario);
    setMensaje(null);
    setMostrarPassword(false);
  };

  const cerrarModal = () => {
    setModal(null);
    setMensaje(null);
    setErrores({});
  };

  const abrirPermisos = async (usuario) => {
    try {
      const res = await API.get(`/UsuarioPermisos/usuario/${usuario.idUsuario}`);
      setPermisosSeleccionados(res.data);
      setModalPermisos(usuario);
      setMensajePermisos(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const togglePermiso = (key) => {
    setPermisosSeleccionados(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const guardarPermisos = async () => {
    try {
      await API.post(`/UsuarioPermisos/usuario/${modalPermisos.idUsuario}`, permisosSeleccionados);
      setMensajePermisos('✅ Permisos guardados correctamente');
      setTimeout(() => {
        setModalPermisos(null);
        setMensajePermisos(null);
      }, 1500);
    } catch (error) {
      console.error(error);
      setMensajePermisos('❌ Error al guardar permisos');
    }
  };

  const abrirNuevoRol = () => {
    setEsNuevoRol(true);
    setFormRol({ nombre: '', descripcion: '' });
    setModalNuevoRol({});
    setMensajeRol(null);
  };

  const abrirEditarRol = (rol) => {
    setEsNuevoRol(false);
    setFormRol({
      nombre: rol.nombre,
      descripcion: rol.descripcion || '',
    });
    setModalNuevoRol(rol);
    setMensajeRol(null);
  };

  const guardarRol = async () => {
    if (!formRol.nombre.trim()) {
      setMensajeRol('⚠️ El nombre del rol es obligatorio');
      return;
    }
    try {
      if (esNuevoRol) {
        await API.post('/Roles', { ...formRol, permisos: [] });
        setMensajeRol('✅ Rol creado correctamente');
      } else {
        await API.put(`/Roles/${modalNuevoRol.idRol}`, { ...formRol, permisos: [] });
        setMensajeRol('✅ Rol actualizado correctamente');
      }
      await cargarRoles();
      setTimeout(() => {
        setModalNuevoRol(null);
        setMensajeRol(null);
      }, 1500);
    } catch (error) {
      console.error(error);
      setMensajeRol('❌ Error al guardar rol');
    }
  };

  const eliminarRol = async (rol) => {
    if (rol.nombre === 'gerente' || rol.nombre === 'vendedor') {
      alert('No se pueden eliminar los roles base del sistema');
      return;
    }
    if (!window.confirm(`¿Eliminar el rol "${rol.nombre}"?`)) return;
    try {
      await API.delete(`/Roles/${rol.idRol}`);
      await cargarRoles();
    } catch (error) {
      console.error(error);
    }
  };

  const guardar = async () => {
    const nombreOk = validarCampo('nombre', form.nombre);
    const emailOk = validarCampo('email', form.email);
    const passOk = validarCampo('password', form.password);

    if (!nombreOk || !emailOk || !passOk) {
      setMensaje('⚠️ Corrige los errores antes de continuar');
      return;
    }

    try {
      if (esNuevo) {
        await API.post('/Usuarios/registro', form);
        setMensaje('✅ Usuario creado correctamente');
      } else {
        await API.put(`/Usuarios/${modal.idUsuario}`, form);
        setMensaje('✅ Usuario actualizado correctamente');
      }
      await cargarUsuarios();
      setTimeout(() => cerrarModal(), 1500);
    } catch (error) {
      console.error(error);
      setMensaje('❌ Error al guardar usuario');
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este usuario?')) return;
    try {
      await API.delete(`/Usuarios/${id}`);
      await cargarUsuarios();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getRolBadge = (rol) => {
    if (rol === 'gerente') return { clase: 'badge-gerente', texto: 'Gerente' };
    if (rol === 'vendedor') return { clase: 'badge-vendedor', texto: 'Vendedor' };
    return { clase: 'badge-personalizado', texto: rol.charAt(0).toUpperCase() + rol.slice(1) };
  };

  if (loading) return <div className="loading">Cargando usuarios...</div>;

  return (
    <div className="usuarios-container">
      <div className="usuarios-header">
        <h1 className="page-title">Gestión de Usuarios</h1>
        <div className="usuarios-header-btns">
          <button className="btn-gestionar-roles" onClick={() => setModalRoles(true)}>
            <FaShieldAlt /> Gestionar Roles
          </button>
          <button className="btn-nuevo-usuario" onClick={abrirNuevo}>
            <FaPlus /> Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="usuarios-grid">
        {usuarios.map((u) => {
          const badge = getRolBadge(u.rol);
          return (
            <div key={u.idUsuario} className="usuario-card">
              <div className="usuario-avatar">
                {u.nombre?.charAt(0).toUpperCase()}
              </div>
              <div className="usuario-info">
                <h3>{u.nombre}</h3>
                <p>{u.email}</p>
                <span className={`rol-badge-card ${badge.clase}`}>
                  {badge.texto}
                </span>
              </div>
              <div className="usuario-acciones">
                <button className="btn-editar" onClick={() => abrirEditar(u)}>
                  <FaEdit /> Editar
                </button>
                {u.rol !== 'gerente' && (
                  <button className="btn-permisos" onClick={() => abrirPermisos(u)}>
                    Permisos
                  </button>
                )}
                <button className="btn-eliminar-u" onClick={() => eliminar(u.idUsuario)}>
                  <FaTrash />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Editar/Crear Usuario */}
      {modal !== null && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-usuario" onClick={(e) => e.stopPropagation()}>
            <div className="modal-usuario-header">
              <h2>
                <FaUserCog />
                {esNuevo ? ' Nuevo Usuario' : ' Editar Usuario'}
              </h2>
              <button className="btn-cerrar-modal" onClick={cerrarModal}><FaTimes /></button>
            </div>
            <div className="modal-usuario-body">

              <div className="form-grupo">
                <label>Nombre completo * (nombre y apellido)</label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={form.nombre}
                  onChange={(e) => handleCambioCampo('nombre', e.target.value)}
                  onBlur={(e) => validarCampo('nombre', e.target.value)}
                  className={errores.nombre ? 'input-error' : ''}
                />
                {errores.nombre && <span className="error-msg">⚠️ {errores.nombre}</span>}
              </div>

              <div className="form-grupo">
                <label>Correo electrónico *</label>
                <input
                  type="email"
                  placeholder="correo@gmail.com"
                  value={form.email}
                  onChange={(e) => handleCambioCampo('email', e.target.value)}
                  onBlur={(e) => validarCampo('email', e.target.value)}
                  className={errores.email ? 'input-error' : ''}
                />
                {errores.email && <span className="error-msg">⚠️ {errores.email}</span>}
              </div>

              <div className="form-grupo">
                <label>{esNuevo ? 'Contraseña *' : 'Nueva contraseña (vacío = no cambiar)'}</label>
                <div className="password-wrapper">
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    placeholder="Min. 8 caracteres, mayúscula, número y símbolo"
                    value={form.password}
                    onChange={(e) => handleCambioCampo('password', e.target.value)}
                    onBlur={(e) => validarCampo('password', e.target.value)}
                    className={errores.password ? 'input-error' : ''}
                  />
                  <button type="button" className="btn-toggle-password"
                    onClick={() => setMostrarPassword(!mostrarPassword)}>
                    {mostrarPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errores.password && <span className="error-msg">⚠️ {errores.password}</span>}
                {form.password && (
                  <div className="password-checks">
                    <span className={checksPassword.longitud ? 'check-ok' : 'check-fail'}>
                      {checksPassword.longitud ? '✅' : '❌'} Mínimo 8 caracteres
                    </span>
                    <span className={checksPassword.mayuscula ? 'check-ok' : 'check-fail'}>
                      {checksPassword.mayuscula ? '✅' : '❌'} Una mayúscula
                    </span>
                    <span className={checksPassword.minuscula ? 'check-ok' : 'check-fail'}>
                      {checksPassword.minuscula ? '✅' : '❌'} Una minúscula
                    </span>
                    <span className={checksPassword.numero ? 'check-ok' : 'check-fail'}>
                      {checksPassword.numero ? '✅' : '❌'} Un número
                    </span>
                    <span className={checksPassword.especial ? 'check-ok' : 'check-fail'}>
                      {checksPassword.especial ? '✅' : '❌'} Un carácter especial
                    </span>
                  </div>
                )}
              </div>

              <div className="form-grupo">
                <label>Rol del usuario *</label>
                <div className="rol-selector">
                  <div
                    className={`rol-opcion ${form.rol === 'vendedor' ? 'activo vendedor' : ''}`}
                    onClick={() => setForm({ ...form, rol: 'vendedor' })}
                  >
                    <div>
                      <strong>Vendedor</strong>
                      <p>Acceso básico</p>
                    </div>
                    {form.rol === 'vendedor' && <FaCheck className="rol-check" />}
                  </div>

                  <div
                    className={`rol-opcion ${form.rol === 'gerente' ? 'activo gerente' : ''}`}
                    onClick={() => setForm({ ...form, rol: 'gerente' })}
                  >
                    <div>
                      <strong>Gerente</strong>
                      <p>Acceso completo</p>
                    </div>
                    {form.rol === 'gerente' && <FaCheck className="rol-check" />}
                  </div>

                  {roles.filter(r => r.nombre !== 'gerente' && r.nombre !== 'vendedor').map(r => (
                    <div
                      key={r.idRol}
                      className={`rol-opcion ${form.rol === r.nombre ? 'activo personalizado' : ''}`}
                      onClick={() => setForm({ ...form, rol: r.nombre })}
                    >
                      <div>
                        <strong>{r.nombre.charAt(0).toUpperCase() + r.nombre.slice(1)}</strong>
                        <p>{r.descripcion || 'Rol personalizado'}</p>
                      </div>
                      {form.rol === r.nombre && <FaCheck className="rol-check" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {mensaje && (
              <p className={`modal-mensaje ${mensaje.includes('✅') ? 'success' : 'error'}`}>
                {mensaje}
              </p>
            )}
            <div className="modal-usuario-footer">
              <button className="btn-cancelar" onClick={cerrarModal}>
                <FaTimes /> Cancelar
              </button>
              <button className="btn-guardar" onClick={guardar}>
                <FaCheck /> {esNuevo ? 'Crear Usuario' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Permisos */}
      {modalPermisos && (
        <div className="modal-overlay" onClick={() => setModalPermisos(null)}>
          <div className="modal-usuario" onClick={(e) => e.stopPropagation()}>
            <div className="modal-usuario-header">
              <h2>Permisos — {modalPermisos.nombre}</h2>
              <button className="btn-cerrar-modal" onClick={() => setModalPermisos(null)}><FaTimes /></button>
            </div>
            <div className="modal-usuario-body">
              <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
                Selecciona las páginas a las que tendrá acceso:
              </p>
              <div className="permisos-lista">
                {PERMISOS_DISPONIBLES.map((p) => (
                  <div
                    key={p.key}
                    className={`permiso-item ${permisosSeleccionados.includes(p.key) ? 'activo' : ''}`}
                    onClick={() => togglePermiso(p.key)}
                  >
                    <div className="permiso-check">
                      {permisosSeleccionados.includes(p.key) ? '✅' : '☐'}
                    </div>
                    <div className="permiso-info">
                      <strong>{p.label}</strong>
                      <span>{p.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {mensajePermisos && (
              <p className={`modal-mensaje ${mensajePermisos.includes('✅') ? 'success' : 'error'}`}>
                {mensajePermisos}
              </p>
            )}
            <div className="modal-usuario-footer">
              <button className="btn-cancelar" onClick={() => setModalPermisos(null)}>
                <FaTimes /> Cancelar
              </button>
              <button className="btn-guardar" onClick={guardarPermisos}>
                <FaCheck /> Guardar Permisos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gestionar Roles */}
      {modalRoles && (
        <div className="modal-overlay" onClick={() => setModalRoles(false)}>
          <div className="modal-usuario modal-roles" onClick={(e) => e.stopPropagation()}>
            <div className="modal-usuario-header">
              <h2><FaShieldAlt /> Gestionar Roles</h2>
              <button className="btn-cerrar-modal" onClick={() => setModalRoles(false)}><FaTimes /></button>
            </div>
            <div className="modal-usuario-body">
              <div className="roles-lista">
                {roles.map((r) => (
                  <div key={r.idRol} className="rol-fila">
                    <div className="rol-fila-info">
                      <strong>{r.nombre.charAt(0).toUpperCase() + r.nombre.slice(1)}</strong>
                      <span>{r.descripcion || 'Sin descripción'}</span>
                      <span className="rol-permisos-count">{r.permisos?.length || 0} permisos</span>
                    </div>
                    <div className="rol-fila-acciones">
                      {r.nombre !== 'gerente' && r.nombre !== 'vendedor' && (
                        <>
                          <button className="btn-editar-cat" onClick={() => abrirEditarRol(r)}>
                            <FaEdit />
                          </button>
                          <button className="btn-eliminar-cat" onClick={() => eliminarRol(r)}>
                            <FaTrash />
                          </button>
                        </>
                      )}
                      {(r.nombre === 'gerente' || r.nombre === 'vendedor') && (
                        <span className="rol-base-badge">Base</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-nuevo-rol" onClick={abrirNuevoRol}>
                <FaPlus /> Crear Nuevo Rol
              </button>
            </div>
            <div className="modal-usuario-footer">
              <button className="btn-cancelar" onClick={() => setModalRoles(false)}>
                <FaTimes /> Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear/Editar Rol */}
      {modalNuevoRol !== null && (
        <div className="modal-overlay" onClick={() => setModalNuevoRol(null)}>
          <div className="modal-usuario" onClick={(e) => e.stopPropagation()}>
            <div className="modal-usuario-header">
              <h2>{esNuevoRol ? 'Nuevo Rol' : 'Editar Rol'}</h2>
              <button className="btn-cerrar-modal" onClick={() => setModalNuevoRol(null)}><FaTimes /></button>
            </div>
            <div className="modal-usuario-body">
              <div className="form-grupo">
                <label>Nombre del rol * (solo letras)</label>
                <input
                  placeholder="Ej: administrador"
                  value={formRol.nombre}
                  onChange={(e) => {
                    if (e.target.value && !/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]*$/.test(e.target.value)) return;
                    setFormRol({ ...formRol, nombre: e.target.value });
                  }}
                />
              </div>
              <div className="form-grupo">
                <label>Descripción</label>
                <input
                  placeholder="Ej: Gestiona inventario y reportes"
                  value={formRol.descripcion}
                  onChange={(e) => setFormRol({ ...formRol, descripcion: e.target.value })}
                />
              </div>
            </div>
            {mensajeRol && (
              <p className={`modal-mensaje ${mensajeRol.includes('✅') ? 'success' : 'error'}`}>
                {mensajeRol}
              </p>
            )}
            <div className="modal-usuario-footer">
              <button className="btn-cancelar" onClick={() => setModalNuevoRol(null)}>
                <FaTimes /> Cancelar
              </button>
              <button className="btn-guardar" onClick={guardarRol}>
                <FaCheck /> {esNuevoRol ? 'Crear Rol' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Usuarios;