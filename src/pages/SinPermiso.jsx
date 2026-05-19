import { useNavigate } from 'react-router-dom';
import { FaLock, FaHome } from 'react-icons/fa';
import './SinPermiso.css';

function SinPermiso() {
  const navigate = useNavigate();

  return (
    <div className="sinpermiso-container">
      <div className="sinpermiso-card">
        <FaLock className="sinpermiso-icon" />
        <h1>Acceso Denegado</h1>
        <p>No tienes permisos para acceder a esta sección.</p>
        <p className="sinpermiso-sub">Contacta al gerente si necesitas acceso.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>
          <FaHome /> Volver al Inicio
        </button>
      </div>
    </div>
  );
}

export default SinPermiso;