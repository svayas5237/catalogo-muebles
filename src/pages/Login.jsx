import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';
import './Login.css';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await API.post('/Usuarios/login', form);
        login(res.data);
        if (res.data.rol === 'gerente') {
          navigate('/inventario');
        } else if (res.data.rol === 'vendedor') {
          navigate('/ventas');
        } else {
          navigate('/');
        }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError('❌ Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <span className="login-emoji">🔐</span>
          <h1>Acceso Administrativo</h1>
          <p>Ingresa tus credenciales para continuar</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
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
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-btn" disabled={loading}>
            <FaSignInAlt />
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <p className="login-footer">
          Solo el personal autorizado puede acceder al inventario.
        </p>
      </div>
    </div>
  );
}

export default Login;