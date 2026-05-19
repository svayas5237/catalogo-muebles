import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function RoleRoute({ children, roles }) {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(usuario.rol)) {
    return <Navigate to="/sin-permiso" replace />;
  }

  return children;
}

export default RoleRoute;