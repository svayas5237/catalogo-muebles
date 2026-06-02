import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import { FaEnvelope, FaLock, FaUserPlus, FaUser } from 'react-icons/fa';
import './Login.css'; // Esto aplica el mismo estilo elegante del Login

function Registrarse() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validación de contraseñas
    if (form.password !== form.confirmPassword) {
      setError('❌ Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      // Enviamos exactamente lo que pide tu BD SQL Server
      await API.post('/Usuarios', {
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        rol: 'cliente' // O el rol por defecto que manejes
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      console.error(err);
      setError('❌ Error al registrar. Revisa los datos o intenta con otro correo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <span className="login-emoji">📝</span>
          <h1>Crear Cuenta</h1>
          <p>Ingresa tus datos para registrarte</p>
        </div>

        {success ? (
          <div className="login-error" style={{ backgroundColor: '#d4edda', color: '#155724', borderColor: '#c3e6cb' }}>
            ✅ ¡Registro exitoso! Redirigiendo al login...
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            
            <div className="input-group">
              <FaUser className="input-icon" />
              <input
                type="text"
                placeholder="Nombre y apellido completo"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                placeholder="Correo electrónico"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type="password"
                placeholder="Contraseña"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-btn" disabled={loading}>
              <FaUserPlus />
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>
        )}

        <div className="login-footer">
          <p>
            ¿Ya tienes una cuenta? <br/>
            <Link to="/login" style={{ color: 'var(--verde-oscuro)', fontWeight: 'bold', textDecoration: 'none' }}>
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Registrarse;