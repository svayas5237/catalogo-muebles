import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { FaUser, FaCreditCard, FaCheckCircle, FaArrowLeft, FaArrowRight, FaWhatsapp, FaFileInvoice, FaTruck } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import './Checkout.css';

// ===== VALIDACIONES =====
const soloLetras = (valor) => /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]+$/.test(valor.trim());
const soloNumeros = (valor) => /^\d+$/.test(valor);
const telefonoValido = (valor) => /^\d{10}$/.test(valor);
const correoValido = (valor) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
const cedulaValida = (valor) => /^\d{10,13}$/.test(valor);

function Checkout() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [paso, setPaso] = useState(1);
  const [carrito, setCarrito] = useState([]);
  const [clienteActualData, setClienteActualData] = useState(null);
  const [metodoPago, setMetodoPago] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [ventaConfirmada, setVentaConfirmada] = useState(null);
  const [errores, setErrores] = useState({});
  const [erroresFacturacion, setErroresFacturacion] = useState({});
  const [erroresEnvio, setErroresEnvio] = useState({});
  const [comprobante, setComprobante] = useState(null);
  const [previstaComprobante, setPrevistaComprobante] = useState(null);

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '', apellido: '', telefono: '', direccion: '', correo: ''
  });

  const [facturacion, setFacturacion] = useState({
    nombre: '', apellido: '', cedula: '', telefono: '', direccion: ''
  });

  const [envio, setEnvio] = useState({
    nombre: '', apellido: '', telefono: '', direccion: '',
    linkMaps: '', ubicacionTiempoReal: null
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
      if (usuario) {
        try {
          const res = await API.get('/Clientes');
          const miCliente = res.data.find(
            c => c.correo?.toLowerCase() === usuario.email?.toLowerCase() ||
                 c.nombre?.toLowerCase() === usuario.nombre?.toLowerCase()
          );
          if (miCliente) {
            setClienteActualData(miCliente);
            setNuevoCliente({
              nombre: miCliente.nombre || '',
              apellido: miCliente.apellido || '',
              telefono: miCliente.telefono || '',
              correo: miCliente.correo || '',
              direccion: miCliente.direccion || '',
            });
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }
    };
    inicializar();
  }, []);

  // ===== VALIDAR CLIENTE =====
  const validarCampo = (campo, valor) => {
    let error = '';
    switch (campo) {
      case 'nombre':
        if (!valor.trim()) error = 'El nombre es obligatorio';
        else if (valor.trim().length < 3) error = 'Mínimo 3 caracteres';
        else if (!soloLetras(valor)) error = 'Solo se permiten letras';
        break;
      case 'apellido':
        if (!valor.trim()) error = 'El apellido es obligatorio';
        else if (!soloLetras(valor)) error = 'Solo se permiten letras';
        break;
      case 'telefono':
        if (!valor.trim()) error = 'El teléfono es obligatorio';
        else if (!soloNumeros(valor)) error = 'Solo se permiten números';
        else if (!telefonoValido(valor)) error = 'Debe tener exactamente 10 dígitos';
        break;
      case 'correo':
        if (!valor.trim()) error = 'El correo es obligatorio';
        else if (!correoValido(valor)) error = 'Ingresa un correo válido (ej: nombre@dominio.com)';
        break;
      case 'direccion':
        if (!valor.trim()) error = 'La dirección es obligatoria';
        else if (valor.trim().length < 5) error = 'Mínimo 5 caracteres';
        break;
      default:
        break;
    }
    setErrores(prev => ({ ...prev, [campo]: error }));
    return error === '';
  };

  // ===== VALIDAR FACTURACIÓN =====
  const validarFacturacion = () => {
    const nuevosErrores = {};
    if (!facturacion.nombre.trim()) nuevosErrores.nombre = 'El nombre es obligatorio';
    else if (!soloLetras(facturacion.nombre)) nuevosErrores.nombre = 'Solo letras';
    if (!facturacion.apellido.trim()) nuevosErrores.apellido = 'El apellido es obligatorio';
    else if (!soloLetras(facturacion.apellido)) nuevosErrores.apellido = 'Solo letras';
    if (!facturacion.cedula.trim()) nuevosErrores.cedula = 'La cédula o RUC es obligatoria';
    else if (!cedulaValida(facturacion.cedula)) nuevosErrores.cedula = 'Debe tener entre 10 y 13 dígitos';
    if (!facturacion.telefono.trim()) nuevosErrores.telefono = 'El teléfono es obligatorio';
    else if (!telefonoValido(facturacion.telefono)) nuevosErrores.telefono = 'Debe tener 10 dígitos';
    if (!facturacion.direccion.trim()) nuevosErrores.direccion = 'La dirección es obligatoria';
    else if (facturacion.direccion.trim().length < 5) nuevosErrores.direccion = 'Mínimo 5 caracteres';
    setErroresFacturacion(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // ===== VALIDAR ENVÍO =====
  const validarEnvio = () => {
    const nuevosErrores = {};
    if (!envio.nombre.trim()) nuevosErrores.nombre = 'El nombre es obligatorio';
    else if (!soloLetras(envio.nombre)) nuevosErrores.nombre = 'Solo letras';
    if (!envio.apellido.trim()) nuevosErrores.apellido = 'El apellido es obligatorio';
    else if (!soloLetras(envio.apellido)) nuevosErrores.apellido = 'Solo letras';
    if (!envio.telefono.trim()) nuevosErrores.telefono = 'El teléfono es obligatorio';
    else if (!telefonoValido(envio.telefono)) nuevosErrores.telefono = 'Debe tener 10 dígitos';
    if (!envio.direccion.trim()) nuevosErrores.direccion = 'La dirección es obligatoria';
    else if (envio.direccion.trim().length < 5) nuevosErrores.direccion = 'Mínimo 5 caracteres';
    if (!envio.linkMaps.trim() && !envio.ubicacionTiempoReal) {
      nuevosErrores.ubicacion = 'Debes proporcionar una ubicación (link o ubicación actual)';
    }
    setErroresEnvio(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleCambioCampo = (campo, valor) => {
    if (campo === 'telefono' && valor && !soloNumeros(valor)) return;
    if ((campo === 'nombre' || campo === 'apellido') && valor && !/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]*$/.test(valor)) return;
    setNuevoCliente(prev => ({ ...prev, [campo]: valor }));
    if (errores[campo]) validarCampo(campo, valor);
  };

  const validarFormularioCompleto = () => {
    const campos = ['nombre', 'apellido', 'telefono', 'correo', 'direccion'];
    let valido = true;
    campos.forEach(campo => {
      const ok = validarCampo(campo, nuevoCliente[campo]);
      if (!ok) valido = false;
    });
    return valido;
  };

  const guardarCliente = async () => {
    if (clienteActualData) return clienteActualData.idCliente;
    if (!validarFormularioCompleto()) {
      setMensaje('⚠️ Corrige los errores antes de continuar');
      return null;
    }
    try {
      const res = await API.post('/Clientes', nuevoCliente);
      setClienteActualData(res.data);
      return res.data.idCliente;
    } catch (error) {
      console.error(error);
      setMensaje('❌ Error al guardar cliente');
      return null;
    }
  };

  const obtenerUbicacion = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const link = 'https://maps.google.com/?q=' + latitude + ',' + longitude;
        setEnvio(prev => ({ ...prev, ubicacionTiempoReal: { lat: latitude, lng: longitude }, linkMaps: link }));
        setErroresEnvio(prev => ({ ...prev, ubicacion: '' }));
      },
      () => alert('No se pudo obtener la ubicación. Verifica los permisos del navegador.')
    );
  };

  const siguientePaso = async () => {
    setMensaje(null);
    if (paso === 1) {
      const clienteOk = validarFormularioCompleto();
      const facturacionOk = validarFacturacion();
      const envioOk = validarEnvio();
      if (!clienteOk || !facturacionOk || !envioOk) {
        setMensaje('⚠️ Completa todos los campos obligatorios antes de continuar');
        return;
      }
      const idCliente = await guardarCliente();
      if (idCliente) setPaso(2);
    } else if (paso === 2) {
      if (!metodoPago) {
        setMensaje('⚠️ Selecciona un método de pago');
        return;
      }
      setPaso(3);
    } else if (paso === 3) {
      if (!comprobante) {
        setMensaje('⚠️ Debes subir el comprobante de pago antes de continuar');
        return;
      }
      setPaso(4);
    }
  };

  const confirmarPedido = async () => {
    setLoading(true);
    setMensaje(null);

    try {
      const idCliente = clienteActualData?.idCliente;
      if (!idCliente) {
        setMensaje('❌ No se ha detectado el ID del cliente.');
        setLoading(false);
        return;
      }

      let urlComprobanteFinal = '';

      if (comprobante) {
        const formData = new FormData();
        formData.append('archivo', comprobante);

        try {
          const resArchivo = await API.post('/Archivos/subir', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
          urlComprobanteFinal = resArchivo.data.urlImagen; 
        } catch (errArchivo) {
          console.error('Error al subir la imagen del comprobante:', errArchivo);
          setMensaje('❌ Error crítico al subir el comprobante de pago al servidor.');
          setLoading(false);
          return;
        }
      }

      try {
        await API.post('/Carritos', {
          idCliente,
          detalles: carrito.map((p) => ({
            idProducto: p.idProducto,
            cantidad: p.cantidad,
            precioUnitario: p.precio,
          })),
        });
      } catch (errCarrito) {
        console.warn('Registro de carrito no crítico:', errCarrito);
      }

      const ventaPayload = {
        idCliente: idCliente,
        idUsuario: 1, 
        
        facturacionNombre: facturacion.nombre,
        facturacionApellido: facturacion.apellido,
        facturacionCedula: facturacion.cedula,
        facturacionTelefono: facturacion.telefono,
        facturacionDireccion: facturacion.direccion,

        envioNombre: envio.nombre,
        envioApellido: envio.apellido,
        envioTelefono: envio.telefono,
        envioDireccion: envio.direccion,
        envioLinkMaps: envio.linkMaps || '',

        urlComprobante: urlComprobanteFinal,

        detalles: carrito.map((p) => ({
          idProducto: p.idProducto,
          cantidad: p.cantidad,
          precioUnitario: p.precio,
          subtotal: p.precio * p.cantidad,
        })),
      };

     // (Código existente dentro de confirmarPedido en Checkout.jsx)
      const resVenta = await API.post('/Ventas', ventaPayload);
      setVentaConfirmada(resVenta.data);
      localStorage.removeItem('carrito');
      
      // AÑADE ESTA LÍNEA AQUÍ:
      localStorage.setItem('correoCompraReciente', nuevoCliente.correo); 
      
      setPaso(5);

    } catch (error) {
      console.error('Error general durante la confirmación del pedido:', error);
      setMensaje('❌ Ocurrió un error inesperado al procesar la venta. Verifique los datos.');
    } finally {
      setLoading(false);
    }
  };

  const mensajeWhatsapp = encodeURIComponent(
    'Buenas días, le escribo para generar el link de pago. Total: $' + total.toFixed(2)
  );
  const mensajeComprobante = encodeURIComponent(
    'Hola, realicé una transferencia de $' + total.toFixed(2) + ' para el pedido #' + (ventaConfirmada?.idVenta) + '. Adjunto comprobante.'
  );

  return (
    <div className="checkout-container">

      {/* PROGRESS - 4 pasos */}
      {paso < 5 && (
        <div className="checkout-progress">
          <div className={'progress-step' + (paso >= 1 ? ' activo' : '') + (paso > 1 ? ' completado' : '')}>
            <div className="step-circle">{paso > 1 ? '✓' : <FaUser />}</div>
            <span>Datos</span>
          </div>
          <div className={'progress-linea' + (paso > 1 ? ' activa' : '')}></div>
          <div className={'progress-step' + (paso >= 2 ? ' activo' : '') + (paso > 2 ? ' completado' : '')}>
            <div className="step-circle">{paso > 2 ? '✓' : <FaCreditCard />}</div>
            <span>Pago</span>
          </div>
          <div className={'progress-linea' + (paso > 2 ? ' activa' : '')}></div>
          <div className={'progress-step' + (paso >= 3 ? ' activo' : '') + (paso > 3 ? ' completado' : '')}>
            <div className="step-circle">{paso > 3 ? '✓' : '📎'}</div>
            <span>Comprobante</span>
          </div>
          <div className={'progress-linea' + (paso > 3 ? ' activa' : '')}></div>
          <div className={'progress-step' + (paso >= 4 ? ' activo' : '')}>
            <div className="step-circle"><FaCheckCircle /></div>
            <span>Confirmar</span>
          </div>
        </div>
      )}

      <div className="checkout-layout">

        {/* PASO 1 - DATOS (AQUÍ ESTÁN LAS 3 TARJETAS) */}
        {paso === 1 && (
          <div className="checkout-paso-columna">
            
            {/* TARJETA 1: DATOS PERSONALES */}
            <div className="checkout-card">
              <h2><FaUser /> Datos Personales</h2>
              <p className="checkout-subtitle">Completa tus datos para continuar</p>
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
                  <label>Apellido *</label>
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
                  <label>Correo *</label>
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
                  <label>Dirección *</label>
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
              {clienteActualData && (
                <div className="cliente-ya-registrado">
                  <span className="cliente-registrado-badge">Tus datos fueron cargados automáticamente</span>
                </div>
              )}
            </div>

            {/* TARJETA 2: FACTURACIÓN */}
            <div className="checkout-card">
              <h2><FaFileInvoice /> Datos de Facturación</h2>
              <p className="checkout-subtitle">Información requerida para emitir tu factura</p>
              <div className="form-grid">
                <div className="form-grupo">
                  <label>Nombre *</label>
                  <input
                    placeholder="Nombre para factura"
                    value={facturacion.nombre}
                    onChange={(e) => {
                      if (e.target.value && !/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]*$/.test(e.target.value)) return;
                      setFacturacion({ ...facturacion, nombre: e.target.value });
                      if (erroresFacturacion.nombre) setErroresFacturacion(prev => ({ ...prev, nombre: '' }));
                    }}
                    className={erroresFacturacion.nombre ? 'input-error' : ''}
                  />
                  {erroresFacturacion.nombre && <span className="error-msg">⚠️ {erroresFacturacion.nombre}</span>}
                </div>
                <div className="form-grupo">
                  <label>Apellido *</label>
                  <input
                    placeholder="Apellido para factura"
                    value={facturacion.apellido}
                    onChange={(e) => {
                      if (e.target.value && !/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]*$/.test(e.target.value)) return;
                      setFacturacion({ ...facturacion, apellido: e.target.value });
                      if (erroresFacturacion.apellido) setErroresFacturacion(prev => ({ ...prev, apellido: '' }));
                    }}
                    className={erroresFacturacion.apellido ? 'input-error' : ''}
                  />
                  {erroresFacturacion.apellido && <span className="error-msg">⚠️ {erroresFacturacion.apellido}</span>}
                </div>
                <div className="form-grupo">
                  <label>Cédula / RUC *</label>
                  <input
                    placeholder="Ej: 1804800322"
                    value={facturacion.cedula}
                    maxLength={13}
                    onChange={(e) => {
                      if (e.target.value && !/^\d*$/.test(e.target.value)) return;
                      setFacturacion({ ...facturacion, cedula: e.target.value });
                      if (erroresFacturacion.cedula) setErroresFacturacion(prev => ({ ...prev, cedula: '' }));
                    }}
                    className={erroresFacturacion.cedula ? 'input-error' : ''}
                  />
                  {erroresFacturacion.cedula && <span className="error-msg">⚠️ {erroresFacturacion.cedula}</span>}
                </div>
                <div className="form-grupo">
                  <label>Teléfono *</label>
                  <input
                    placeholder="0991234567"
                    value={facturacion.telefono}
                    maxLength={10}
                    onChange={(e) => {
                      if (e.target.value && !/^\d*$/.test(e.target.value)) return;
                      setFacturacion({ ...facturacion, telefono: e.target.value });
                      if (erroresFacturacion.telefono) setErroresFacturacion(prev => ({ ...prev, telefono: '' }));
                    }}
                    className={erroresFacturacion.telefono ? 'input-error' : ''}
                  />
                  {erroresFacturacion.telefono && <span className="error-msg">⚠️ {erroresFacturacion.telefono}</span>}
                </div>
                <div className="form-grupo form-full">
                  <label>Dirección de facturación *</label>
                  <input
                    placeholder="Dirección para la factura"
                    value={facturacion.direccion}
                    onChange={(e) => {
                      setFacturacion({ ...facturacion, direccion: e.target.value });
                      if (erroresFacturacion.direccion) setErroresFacturacion(prev => ({ ...prev, direccion: '' }));
                    }}
                    className={erroresFacturacion.direccion ? 'input-error' : ''}
                  />
                  {erroresFacturacion.direccion && <span className="error-msg">⚠️ {erroresFacturacion.direccion}</span>}
                </div>
              </div>
            </div>

            {/* TARJETA 3: ENVÍO */}
            <div className="checkout-card">
                <div className="envio-header">
                  <h2><FaTruck /> Datos de Envío</h2>
                  <span className="fecha-maxima-entrega">
                    Entrega máxima: {(() => {
                      let dias = 0;
                      let fecha = new Date();
                      while (dias < 5) {
                        fecha.setDate(fecha.getDate() + 1);
                        const dia = fecha.getDay();
                        if (dia !== 0 && dia !== 6) dias++;
                      }
                      return fecha.toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' });
                    })()}
                  </span>
                </div>
                <p className="checkout-subtitle">Información para la entrega de tu pedido</p>
                <div className="form-grid">
                <div className="form-grupo">
                  <label>Nombre *</label>
                  <input
                    placeholder="Nombre quien recibe"
                    value={envio.nombre}
                    onChange={(e) => {
                      if (e.target.value && !/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]*$/.test(e.target.value)) return;
                      setEnvio({ ...envio, nombre: e.target.value });
                      if (erroresEnvio.nombre) setErroresEnvio(prev => ({ ...prev, nombre: '' }));
                    }}
                    className={erroresEnvio.nombre ? 'input-error' : ''}
                  />
                  {erroresEnvio.nombre && <span className="error-msg">⚠️ {erroresEnvio.nombre}</span>}
                </div>
                <div className="form-grupo">
                  <label>Apellido *</label>
                  <input
                    placeholder="Apellido quien recibe"
                    value={envio.apellido}
                    onChange={(e) => {
                      if (e.target.value && !/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s]*$/.test(e.target.value)) return;
                      setEnvio({ ...envio, apellido: e.target.value });
                      if (erroresEnvio.apellido) setErroresEnvio(prev => ({ ...prev, apellido: '' }));
                    }}
                    className={erroresEnvio.apellido ? 'input-error' : ''}
                  />
                  {erroresEnvio.apellido && <span className="error-msg">⚠️ {erroresEnvio.apellido}</span>}
                </div>
                <div className="form-grupo">
                  <label>Teléfono *</label>
                  <input
                    placeholder="0991234567"
                    value={envio.telefono}
                    maxLength={10}
                    onChange={(e) => {
                      if (e.target.value && !/^\d*$/.test(e.target.value)) return;
                      setEnvio({ ...envio, telefono: e.target.value });
                      if (erroresEnvio.telefono) setErroresEnvio(prev => ({ ...prev, telefono: '' }));
                    }}
                    className={erroresEnvio.telefono ? 'input-error' : ''}
                  />
                  {erroresEnvio.telefono && <span className="error-msg">⚠️ {erroresEnvio.telefono}</span>}
                </div>
                <div className="form-grupo">
                  <label>Dirección de entrega *</label>
                  <input
                    placeholder="Dirección donde entregar"
                    value={envio.direccion}
                    onChange={(e) => {
                      setEnvio({ ...envio, direccion: e.target.value });
                      if (erroresEnvio.direccion) setErroresEnvio(prev => ({ ...prev, direccion: '' }));
                    }}
                    className={erroresEnvio.direccion ? 'input-error' : ''}
                  />
                  {erroresEnvio.direccion && <span className="error-msg">⚠️ {erroresEnvio.direccion}</span>}
                </div>
                <div className="form-grupo form-full">
                  <label>Ubicación de entrega *</label>
                  <div className="ubicacion-opciones">
                    <div className="ubicacion-opcion">
                      <span className="ubicacion-opcion-label">Pegar link de Google Maps</span>
                      <input
                        placeholder="https://maps.google.com/?q=..."
                        value={envio.linkMaps}
                        onChange={(e) => {
                          setEnvio({ ...envio, linkMaps: e.target.value, ubicacionTiempoReal: null });
                          if (erroresEnvio.ubicacion) setErroresEnvio(prev => ({ ...prev, ubicacion: '' }));
                        }}
                        className={erroresEnvio.ubicacion && !envio.ubicacionTiempoReal ? 'input-error' : ''}
                      />
                      {envio.linkMaps && !envio.ubicacionTiempoReal && (
                        <a href={envio.linkMaps} target="_blank" rel="noopener noreferrer" className="btn-ver-mapa">
                          Ver en mapa
                        </a>
                      )}
                    </div>
                    <div className="ubicacion-separador">— o —</div>
                    <div className="ubicacion-opcion">
                      <span className="ubicacion-opcion-label">Compartir mi ubicación actual</span>
                      <button className="btn-ubicacion" onClick={obtenerUbicacion}>
                        Obtener mi ubicación
                      </button>
                      {envio.ubicacionTiempoReal && (
                        <div className="ubicacion-obtenida">
                          <span>Ubicación obtenida correctamente</span>
                          <a
                            href={'https://maps.google.com/?q=' + envio.ubicacionTiempoReal.lat + ',' + envio.ubicacionTiempoReal.lng}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-ver-mapa"
                          >
                            Ver en mapa
                          </a>
                        </div>
                      )}
                    </div>
                    {erroresEnvio.ubicacion && (
                      <span className="error-msg">⚠️ {erroresEnvio.ubicacion}</span>
                    )}
                  </div>
                </div>
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
            </div> 
        )}

        {/* PASO 2 - MÉTODO DE PAGO */}
        {paso === 2 && (
          <div className="checkout-card">
            <h2><FaCreditCard /> Método de Pago</h2>
            <p className="checkout-subtitle">Selecciona cómo deseas pagar</p>
            <div className="metodos-pago">
              <div className={'metodo-card' + (metodoPago === 'whatsapp' ? ' seleccionado' : '')} onClick={() => setMetodoPago('whatsapp')}>
                <div className="metodo-icon whatsapp-icon"><FaWhatsapp /></div>
                <div className="metodo-info">
                  <h4>Pago con Tarjeta de Crédito</h4>
                  <p>Escríbenos por WhatsApp para generar tu link de pago</p>
                </div>
                <div className={'metodo-check' + (metodoPago === 'whatsapp' ? ' activo' : '')}>✓</div>
              </div>
              <div className={'metodo-card' + (metodoPago === 'pichincha' ? ' seleccionado' : '')} onClick={() => setMetodoPago('pichincha')}>
                <div className="metodo-icon pichincha-icon"></div>
                <div className="metodo-info">
                  <h4>Transferencia Banco Pichincha</h4>
                  <p>Cuenta de Ahorros #2205420861</p>
                </div>
                <div className={'metodo-check' + (metodoPago === 'pichincha' ? ' activo' : '')}>✓</div>
              </div>
              <div className={'metodo-card' + (metodoPago === 'guayaquil' ? ' seleccionado' : '')} onClick={() => setMetodoPago('guayaquil')}>
                <div className="metodo-icon guayaquil-icon"></div>
                <div className="metodo-info">
                  <h4>Transferencia Banco Guayaquil</h4>
                  <p>Cuenta de Ahorros #35089301</p>
                </div>
                <div className={'metodo-check' + (metodoPago === 'guayaquil' ? ' activo' : '')}>✓</div>
              </div>
            </div>

            {metodoPago === 'whatsapp' && (
              <div className="metodo-detalle whatsapp-detalle">
                <h4>Pago con Tarjeta de Crédito</h4>
                <p>Al confirmar tu pedido, escríbenos por WhatsApp para generar el link de pago y sube la captura en el siguiente paso.</p>
              </div>
            )}
            {metodoPago === 'pichincha' && (
              <div className="metodo-detalle banco-detalle">
                <h4>Datos Banco Pichincha</h4>
                <div className="banco-datos-checkout">
                  <div className="bd-item"><span>Tipo:</span><strong>Cuenta de Ahorros</strong></div>
                  <div className="bd-item"><span>Número:</span><strong>#2205420861</strong></div>
                  <div className="bd-item"><span>Nombre:</span><strong>Christian Omar Vasquez Armendariz</strong></div>
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

        {/* PASO 3 - COMPROBANTE */}
        {paso === 3 && (
          <div className="checkout-card">
            <h2>Subir Comprobante de Pago</h2>
            <p className="checkout-subtitle">
              {metodoPago === 'whatsapp' && 'Solicita el link, realiza el pago y sube la captura de confirmación'}
              {metodoPago === 'pichincha' && 'Realiza la transferencia al Banco Pichincha y sube el comprobante'}
              {metodoPago === 'guayaquil' && 'Realiza la transferencia al Banco Guayaquil y sube el comprobante'}
            </p>

            <div className="comprobante-recordatorio">
              {metodoPago === 'whatsapp' && (
                <div className="recordatorio-card whatsapp-recordatorio">
                  <FaWhatsapp className="rec-icon" />
                  <div>
                    <strong>Pago con Tarjeta de Crédito</strong>
                    <p>Escríbenos por WhatsApp para recibir el link de pago, realiza el pago y sube aquí la captura de confirmación.</p>
                    <a
                      href={'https://wa.me/593983221612?text=' + mensajeWhatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-whatsapp-pequeno"
                    >
                      <FaWhatsapp /> Solicitar link de pago
                    </a>
                  </div>
                </div>
              )}
              {(metodoPago === 'pichincha' || metodoPago === 'guayaquil') && (
                <div className="recordatorio-card banco-recordatorio">
                  <div className="rec-datos">
                    <strong>{metodoPago === 'pichincha' ? 'Banco Pichincha' : 'Banco Guayaquil'}</strong>
                    <p>Cuenta: <strong>{metodoPago === 'pichincha' ? '#2205420861' : '#35089301'}</strong></p>
                    <p>Nombre: <strong>Christian Omar Vasquez Armendariz</strong></p>
                    <p>Total a transferir: <strong className="total-destacado">${total.toFixed(2)}</strong></p>
                  </div>
                </div>
              )}
            </div>

            <div className="comprobante-zona">
              <h3 className="checkout-seccion-titulo">Comprobante de pago *</h3>
              {!previstaComprobante ? (
                <label className="comprobante-upload-area">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setComprobante(file);
                        if (file.type.startsWith('image/')) {
                          setPrevistaComprobante(URL.createObjectURL(file));
                        } else {
                          setPrevistaComprobante('pdf');
                        }
                        setMensaje(null);
                      }
                    }}
                  />
                  <div className="comprobante-upload-content">
                    <span className="comprobante-upload-icono">📁</span>
                    <span className="comprobante-upload-texto">Toca aquí para subir tu comprobante</span>
                    <span className="comprobante-upload-hint">Imagen (JPG, PNG) o PDF</span>
                  </div>
                </label>
              ) : (
                <div className="comprobante-preview">
                  {previstaComprobante === 'pdf' ? (
                    <div className="comprobante-pdf">
                      <span className="pdf-icono">📄</span>
                      <span className="pdf-nombre">{comprobante?.name}</span>
                    </div>
                  ) : (
                    <img src={previstaComprobante} alt="Comprobante" className="comprobante-imagen" />
                  )}
                  <button
                    className="btn-cambiar-comprobante"
                    onClick={() => { setComprobante(null); setPrevistaComprobante(null); }}
                  >
                    Cambiar comprobante
                  </button>
                </div>
              )}
            </div>

            {mensaje && <p className="checkout-mensaje error">{mensaje}</p>}
            <div className="checkout-acciones">
              <button className="btn-volver-checkout" onClick={() => setPaso(2)}>
                <FaArrowLeft /> Volver
              </button>
              <button className="btn-siguiente" onClick={siguientePaso}>
                Siguiente <FaArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* PASO 4 - CONFIRMAR */}
        {paso === 4 && (
          <div className="checkout-card">
            <h2><FaCheckCircle /> Confirmar Pedido</h2>
            <p className="checkout-subtitle">Revisa tu pedido antes de confirmar</p>

            <div className="resumen-seccion">
              <h4>Cliente</h4>
              <p>{nuevoCliente.nombre} {nuevoCliente.apellido}</p>
              <p>{nuevoCliente.telefono}</p>
              <p>{nuevoCliente.correo}</p>
            </div>

            <div className="resumen-seccion">
              <h4>Facturación</h4>
              <p>{facturacion.nombre} {facturacion.apellido}</p>
              <p>Cédula/RUC: {facturacion.cedula}</p>
              <p>Tel: {facturacion.telefono}</p>
              <p>{facturacion.direccion}</p>
            </div>

            <div className="resumen-seccion">
              <h4>Envío</h4>
              <p>{envio.nombre} {envio.apellido}</p>
              <p>Tel: {envio.telefono}</p>
              <p>{envio.direccion}</p>
              {envio.linkMaps && (
                <a href={envio.linkMaps} target="_blank" rel="noopener noreferrer" className="btn-ver-mapa">
                  Ver ubicación en mapa
                </a>
              )}
            </div>

            <div className="resumen-seccion">
              <h4>Comprobante</h4>
              {previstaComprobante === 'pdf' ? (
                <p>PDF subido: {comprobante?.name}</p>
              ) : (
                <img src={previstaComprobante} alt="Comprobante" className="comprobante-thumb" />
              )}
            </div>

            <div className="resumen-seccion">
              <h4>Productos</h4>
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
              <h4>Método de Pago</h4>
              <p>
                {metodoPago === 'whatsapp' && 'Pago con Tarjeta (Link WhatsApp)'}
                {metodoPago === 'pichincha' && 'Transferencia Banco Pichincha'}
                {metodoPago === 'guayaquil' && 'Transferencia Banco Guayaquil'}
              </p>
            </div>

            {mensaje && <p className="checkout-mensaje error">{mensaje}</p>}
            <div className="checkout-acciones">
              <button className="btn-volver-checkout" onClick={() => setPaso(3)}><FaArrowLeft /> Volver</button>
              <button className="btn-confirmar-checkout" onClick={confirmarPedido} disabled={loading}>
                {loading ? 'Procesando...' : 'Confirmar Pedido'}
              </button>
            </div>
          </div>
        )}

       {/* PASO 5 - ÉXITO */}
        {paso === 5 && (
          <div className="checkout-exito">
            <FaCheckCircle className="exito-icon" />
            <h2>Pedido Confirmado!</h2>
            <p>Tu pedido #{ventaConfirmada?.idVenta} fue registrado exitosamente.</p>
            <p>Nos pondremos en contacto contigo pronto.</p>
            
            {/* Contenedor de acciones para el cliente */}
            <div className="checkout-acciones" style={{ width: '100%', maxWidth: '400px', display: 'flex', gap: '10px' }}>
              <button className="btn-siguiente" onClick={() => navigate('/compras')}>
                Ver Mis Compras
              </button>
              <button className="btn-volver-checkout" onClick={() => navigate('/catalogo')}>
                Seguir Comprando
              </button>
            </div>
          </div>
        )}

        {/* RESUMEN LATERAL */}
        {paso < 5 && (
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