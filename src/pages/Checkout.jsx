import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { FaUser, FaCreditCard, FaCheckCircle, FaArrowLeft, FaArrowRight, FaWhatsapp } from 'react-icons/fa';
import './Checkout.css';

// ===== FUNCIONES DE VALIDACIÓN =====
const soloLetras = (valor) => /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/.test(valor.trim());
const soloNumeros = (valor) => /^\d+$/.test(valor);
const telefonoValido = (valor) => /^\d{10}$/.test(valor);
const correoValido = (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);

function Checkout() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);
  const [carrito, setCarrito] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [metodoPago, setMetodoPago] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [ventaConfirmada, setVentaConfirmada] = useState(null);
  const [errores, setErrores] = useState({});
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '', apellido: '', telefono: '', direccion: '', correo: ''
  });

  const total = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

  useEffect(() => {
    const inicializar = async () => {
      const data = JSON.parse(localStorage.getItem('carrito') || '[]');
      if (data.length === 0) {
        navigate('/carrito');
        return;
      }
      setCarrito(data);
      try {
        const res = await API.get('/Clientes');
        setClientes(res.data);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    inicializar();
  }, []);

  // Validar campo individual en tiempo real
  const validarCampo = (campo, valor) => {
    let error = '';
    switch (campo) {
      case 'nombre':
        if (!valor.trim()) error = 'El nombre es obligatorio';
        else if (valor.trim().length < 3) error = 'Mínimo 3 caracteres';
        else if (!soloLetras(valor)) error = 'Solo se permiten letras';
        break;
      case 'apellido':
        if (valor && !soloLetras(valor)) error = 'Solo se permiten letras';
        break;
      case 'telefono':
        if (!valor.trim()) error = 'El teléfono es obligatorio';
        else if (!soloNumeros(valor)) error = 'Solo se permiten números';
        else if (!telefonoValido(valor)) error = 'Debe tener exactamente 10 dígitos';
        break;
      case 'correo':
        if (valor && !correoValido(valor)) error = 'Ingresa un correo válido (ej: nombre@dominio.com)';
        break;
      case 'direccion':
        if (valor && valor.trim().length < 5) error = 'Mínimo 5 caracteres';
        break;
      default:
        break;
    }
    setErrores(prev => ({ ...prev, [campo]: error }));
    return error === '';
  };

  const handleCambioCampo = (campo, valor) => {
    // Restricción en tiempo real
    if (campo === 'telefono' && valor && !soloNumeros(valor)) return;
    if ((campo === 'nombre' || campo === 'apellido') && valor && !/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]*$/.test(valor)) return;

    setNuevoCliente(prev => ({ ...prev, [campo]: valor }));
    if (errores[campo]) validarCampo(campo, valor);
  };

  const validarFormularioCompleto = () => {
    const campos = ['nombre', 'telefono'];
    if (nuevoCliente.apellido) campos.push('apellido');
    if (nuevoCliente.correo) campos.push('correo');
    if (nuevoCliente.direccion) campos.push('direccion');

    let valido = true;
    campos.forEach(campo => {
      const ok = validarCampo(campo, nuevoCliente[campo]);
      if (!ok) valido = false;
    });
    return valido;
  };

  const guardarCliente = async () => {
    if (clienteSeleccionado) return true;

    if (!validarFormularioCompleto()) {
      setMensaje('⚠️ Corrige los errores antes de continuar');
      return false;
    }

    try {
      const res = await API.post('/Clientes', nuevoCliente);
      setClienteSeleccionado(String(res.data.idCliente));
      const resClientes = await API.get('/Clientes');
      setClientes(resClientes.data);
      return true;
    } catch (error) {
      console.error(error);
      setMensaje('❌ Error al guardar cliente');
      return false;
    }
  };

  const siguientePaso = async () => {
    setMensaje(null);
    if (paso === 1) {
      const ok = await guardarCliente();
      if (ok) setPaso(2);
    } else if (paso === 2) {
      if (!metodoPago) {
        setMensaje('⚠️ Selecciona un método de pago');
        return;
      }
      setPaso(3);
    }
  };

  const confirmarPedido = async () => {
    setLoading(true);
    try {
      // 1. Guardar carrito en BD
      await API.post('/Carritos', {
        idCliente: parseInt(clienteSeleccionado),
        detalles: carrito.map((p) => ({
          idProducto: p.idProducto,
          cantidad: p.cantidad,
          precioUnitario: p.precio,
        })),
      });

      // 2. Crear venta
      const venta = {
        idCliente: parseInt(clienteSeleccionado),
        idUsuario: 1,
        detalles: carrito.map((p) => ({
          idProducto: p.idProducto,
          cantidad: p.cantidad,
          precioUnitario: p.precio,
          subtotal: p.precio * p.cantidad,
        })),
      };
      const res = await API.post('/Ventas', venta);
      setVentaConfirmada(res.data);
      localStorage.removeItem('carrito');
      setPaso(4);
    } catch (error) {
      console.error(error);
      setMensaje('❌ Error al confirmar pedido');
    } finally {
      setLoading(false);
    }
  };

  
  const clienteActual = clientes.find(c => String(c.idCliente) === clienteSeleccionado);
  const mensajeWhatsapp = encodeURIComponent(`Buenas días, le escribo para generar el link de pago para un mueble. Total a pagar: $${total.toFixed(2)}`);
  const mensajeComprobante = encodeURIComponent(`Hola, realicé una transferencia de $${total.toFixed(2)} para el pedido #${ventaConfirmada?.idVenta}. Adjunto comprobante.`);

  return (
    <div className="checkout-container">

      {paso < 4 && (
        <div className="checkout-progress">
          <div className={`progress-step ${paso >= 1 ? 'activo' : ''} ${paso > 1 ? 'completado' : ''}`}>
            <div className="step-circle">{paso > 1 ? '✓' : <FaUser />}</div>
            <span>Datos</span>
          </div>
          <div className={`progress-linea ${paso > 1 ? 'activa' : ''}`}></div>
          <div className={`progress-step ${paso >= 2 ? 'activo' : ''} ${paso > 2 ? 'completado' : ''}`}>
            <div className="step-circle">{paso > 2 ? '✓' : <FaCreditCard />}</div>
            <span>Pago</span>
          </div>
          <div className={`progress-linea ${paso > 2 ? 'activa' : ''}`}></div>
          <div className={`progress-step ${paso >= 3 ? 'activo' : ''}`}>
            <div className="step-circle"><FaCheckCircle /></div>
            <span>Confirmar</span>
          </div>
        </div>
      )}

      <div className="checkout-layout">

        {/* PASO 1 */}
        {paso === 1 && (
          <div className="checkout-card">
            <h2><FaUser /> Registro del Cliente</h2>
            <p className="checkout-subtitle">Completa tus datos para continuar con el pedido</p>

            <div className="form-grid">
              <div className="form-grupo">
                <label>Nombre *</label>
                <input
                  placeholder="Tu nombre (solo letras)"
                  value={nuevoCliente.nombre}
                  onChange={(e) => handleCambioCampo('nombre', e.target.value)}
                  onBlur={(e) => validarCampo('nombre', e.target.value)}
                  className={errores.nombre ? 'input-error' : ''}
                />
                {errores.nombre && <span className="error-msg">⚠️ {errores.nombre}</span>}
              </div>

              <div className="form-grupo">
                <label>Apellido</label>
                <input
                  placeholder="Tu apellido (solo letras)"
                  value={nuevoCliente.apellido}
                  onChange={(e) => handleCambioCampo('apellido', e.target.value)}
                  onBlur={(e) => validarCampo('apellido', e.target.value)}
                  className={errores.apellido ? 'input-error' : ''}
                />
                {errores.apellido && <span className="error-msg">⚠️ {errores.apellido}</span>}
              </div>

              <div className="form-grupo">
                <label>Teléfono * (10 dígitos)</label>
                <input
                  placeholder="0991234567"
                  value={nuevoCliente.telefono}
                  maxLength={10}
                  onChange={(e) => handleCambioCampo('telefono', e.target.value)}
                  onBlur={(e) => validarCampo('telefono', e.target.value)}
                  className={errores.telefono ? 'input-error' : ''}
                />
                {errores.telefono && <span className="error-msg">⚠️ {errores.telefono}</span>}
              </div>

              <div className="form-grupo">
                <label>Correo</label>
                <input
                  placeholder="tu@correo.com"
                  value={nuevoCliente.correo}
                  onChange={(e) => handleCambioCampo('correo', e.target.value)}
                  onBlur={(e) => validarCampo('correo', e.target.value)}
                  className={errores.correo ? 'input-error' : ''}
                />
                {errores.correo && <span className="error-msg">⚠️ {errores.correo}</span>}
              </div>

              <div className="form-grupo form-full">
                <label>Dirección</label>
                <input
                  placeholder="Tu dirección (mínimo 5 caracteres)"
                  value={nuevoCliente.direccion}
                  onChange={(e) => handleCambioCampo('direccion', e.target.value)}
                  onBlur={(e) => validarCampo('direccion', e.target.value)}
                  className={errores.direccion ? 'input-error' : ''}
                />
                {errores.direccion && <span className="error-msg">⚠️ {errores.direccion}</span>}
              </div>
            </div>

            {/* Cliente existente */}
            <div className="cliente-existente-box">
              <p>¿Ya estás registrado?</p>
              <select
                value={clienteSeleccionado}
                onChange={(e) => {
                  setClienteSeleccionado(e.target.value);
                  setErrores({});
                  if (e.target.value) {
                    const c = clientes.find(c => String(c.idCliente) === e.target.value);
                    if (c) setNuevoCliente({
                      nombre: c.nombre || '',
                      apellido: c.apellido || '',
                      telefono: c.telefono || '',
                      correo: c.correo || '',
                      direccion: c.direccion || '',
                    });
                  }
                }}
                className="checkout-select"
              >
                <option value="">— Selecciona tu nombre —</option>
                {clientes.map((c) => (
                  <option key={c.idCliente} value={c.idCliente}>
                    {c.nombre} {c.apellido} — {c.telefono}
                  </option>
                ))}
              </select>
            </div>

            {mensaje && <p className="checkout-mensaje error">{mensaje}</p>}

            <div className="checkout-acciones">
              <button className="btn-volver-checkout" onClick={() => navigate('/carrito')}>
                <FaArrowLeft /> Volver
              </button>
              <button className="btn-siguiente" onClick={siguientePaso}>
                Siguiente <FaArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2 */}
        {paso === 2 && (
          <div className="checkout-card">
            <h2><FaCreditCard /> Método de Pago</h2>
            <p className="checkout-subtitle">Selecciona cómo deseas pagar</p>

            <div className="metodos-pago">
              <div className={`metodo-card ${metodoPago === 'whatsapp' ? 'seleccionado' : ''}`} onClick={() => setMetodoPago('whatsapp')}>
                <div className="metodo-icon whatsapp-icon"><FaWhatsapp /></div>
                <div className="metodo-info">
                  <h4>Pago con Tarjeta de Crédito</h4>
                  <p>Escríbenos por WhatsApp para generar tu link de pago</p>
                </div>
                <div className={`metodo-check ${metodoPago === 'whatsapp' ? 'activo' : ''}`}>✓</div>
              </div>

              <div className={`metodo-card ${metodoPago === 'pichincha' ? 'seleccionado' : ''}`} onClick={() => setMetodoPago('pichincha')}>
                <div className="metodo-icon pichincha-icon"></div>
                <div className="metodo-info">
                  <h4>Transferencia Banco Pichincha</h4>
                  <p>Cuenta de Ahorros #2205420861</p>
                </div>
                <div className={`metodo-check ${metodoPago === 'pichincha' ? 'activo' : ''}`}>✓</div>
              </div>

              <div className={`metodo-card ${metodoPago === 'guayaquil' ? 'seleccionado' : ''}`} onClick={() => setMetodoPago('guayaquil')}>
                <div className="metodo-icon guayaquil-icon"></div>
                <div className="metodo-info">
                  <h4>Transferencia Banco Guayaquil</h4>
                  <p>Cuenta de Ahorros #35089301</p>
                </div>
                <div className={`metodo-check ${metodoPago === 'guayaquil' ? 'activo' : ''}`}>✓</div>
              </div>
            </div>

            {metodoPago === 'whatsapp' && (
              <div className="metodo-detalle whatsapp-detalle">
                <h4>📱 Pago con Tarjeta de Crédito</h4>
                <p>Al confirmar tu pedido, haz clic en el botón de WhatsApp para generar tu link de pago.</p>
                <p className="detalle-nota">⚠️ El link se genera manualmente y se enviará por WhatsApp.</p>
              </div>
            )}

            {metodoPago === 'pichincha' && (
              <div className="metodo-detalle banco-detalle">
                <h4>🟡 Datos Banco Pichincha</h4>
                <div className="banco-datos-checkout">
                  <div className="bd-item"><span>Tipo:</span><strong>Cuenta de Ahorros</strong></div>
                  <div className="bd-item"><span>Número:</span><strong>#2205420861</strong></div>
                  <div className="bd-item"><span>Nombre:</span><strong>Christian Omar Vásquez Armendáriz</strong></div>
                  <div className="bd-item"><span>Cédula:</span><strong>1804800322</strong></div>
                  <div className="bd-item"><span>Correo:</span><strong>ecologymuebles@gmail.com</strong></div>
                </div>
              </div>
            )}

            {metodoPago === 'guayaquil' && (
              <div className="metodo-detalle banco-detalle">
                <h4>Datos Banco Guayaquil</h4>
                <div className="banco-datos-checkout">
                  <div className="bd-item"><span>Tipo:</span><strong>Cuenta de Ahorros</strong></div>
                  <div className="bd-item"><span>Número:</span><strong>#35089301</strong></div>
                  <div className="bd-item"><span>Nombre:</span><strong>Christian Omar Vasquez Armendariz</strong></div>
                  <div className="bd-item"><span>Cédula:</span><strong>1804800322</strong></div>
                  <div className="bd-item"><span>Correo:</span><strong>ecologymuebles@gmail.com</strong></div>
                </div>
              </div>
            )}

            {mensaje && <p className="checkout-mensaje error">{mensaje}</p>}

            <div className="checkout-acciones">
              <button className="btn-volver-checkout" onClick={() => setPaso(1)}><FaArrowLeft /> Volver</button>
              <button className="btn-siguiente" onClick={siguientePaso}>Siguiente <FaArrowRight /></button>
            </div>
          </div>
        )}

        {/* PASO 3 */}
        {paso === 3 && (
          <div className="checkout-card">
            <h2><FaCheckCircle /> Confirmar Pedido</h2>
            <p className="checkout-subtitle">Revisa tu pedido antes de confirmar</p>

            <div className="resumen-seccion">
              <h4>👤 Cliente</h4>
              <p>{clienteActual?.nombre} {clienteActual?.apellido}</p>
              <p>📞 {clienteActual?.telefono}</p>
              {clienteActual?.correo && <p>✉️ {clienteActual?.correo}</p>}
            </div>

            <div className="resumen-seccion">
              <h4>🛋️ Productos</h4>
              {carrito.map((p, i) => (
                <div key={i} className="resumen-producto">
                  <span>{p.nombre} x{p.cantidad}</span>
                  <span>${(p.precio * p.cantidad).toFixed(2)}</span>
                </div>
              ))}
              <div className="resumen-producto total-line">
                <strong>Total</strong>
                <strong>${total.toFixed(2)}</strong>
              </div>
            </div>

            <div className="resumen-seccion">
              <h4>💳 Método de Pago</h4>
              <p>
                {metodoPago === 'whatsapp' && '📱 Pago con Tarjeta (Link WhatsApp)'}
                {metodoPago === 'pichincha' && '🟡 Transferencia Banco Pichincha'}
                {metodoPago === 'guayaquil' && '💜 Transferencia Banco Guayaquil'}
              </p>
            </div>

            {mensaje && <p className="checkout-mensaje error">{mensaje}</p>}

            <div className="checkout-acciones">
              <button className="btn-volver-checkout" onClick={() => setPaso(2)}><FaArrowLeft /> Volver</button>
              <button className="btn-confirmar-checkout" onClick={confirmarPedido} disabled={loading}>
                {loading ? '⏳ Procesando...' : '✅ Confirmar Pedido'}
              </button>
            </div>
          </div>
        )}

        {/* PASO 4 */}
        {paso === 4 && (
          <div className="checkout-exito">
            <FaCheckCircle className="exito-icon" />
            <h2>¡Pedido Confirmado!</h2>
            <p>Tu pedido #{ventaConfirmada?.idVenta} fue registrado exitosamente.</p>

            {metodoPago === 'whatsapp' && (
              <div className="exito-whatsapp">
                <p>Para completar tu pago con tarjeta, escríbenos por WhatsApp:</p>
                <a href={`https://wa.me/593983221612?text=${mensajeWhatsapp}`} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
                  <FaWhatsapp /> Escribir por WhatsApp
                </a>
              </div>
            )}

            {(metodoPago === 'pichincha' || metodoPago === 'guayaquil') && (
              <div className="exito-transferencia">
                <p>Realiza tu transferencia por <strong>${total.toFixed(2)}</strong> y envía el comprobante por WhatsApp.</p>
                <a href={`https://wa.me/593983221612?text=${mensajeComprobante}`} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
                  <FaWhatsapp /> Enviar Comprobante
                </a>
              </div>
            )}

            <button className="btn-siguiente" onClick={() => navigate('/catalogo')}>
              Seguir Comprando
            </button>
          </div>
        )}

        {/* Resumen lateral */}
        {paso < 4 && (
          <div className="checkout-resumen">
            <h3>Tu Pedido</h3>
            {carrito.map((p, i) => (
              <div key={i} className="checkout-resumen-item">
                <div className="checkout-resumen-imagen">
                  {p.imagenes?.length > 0 ? (
                    <img src={p.imagenes.find(img => img.esPrincipal)?.urlImagen || p.imagenes[0].urlImagen} alt={p.nombre} />
                  ) : (
                    <span>🪑</span>
                  )}
                </div>
                <div className="checkout-resumen-info">
                  <span>{p.nombre}</span>
                  <span>x{p.cantidad}</span>
                </div>
                <span>${(p.precio * p.cantidad).toFixed(2)}</span>
              </div>
            ))}
            <div className="checkout-resumen-total">
              <strong>Total</strong>
              <strong>${total.toFixed(2)}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Checkout;