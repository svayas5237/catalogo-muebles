import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const saved = localStorage.getItem('usuario');
    return saved ? JSON.parse(saved) : null;
  });

  const [permisos, setPermisos] = useState(() => {
    const saved = localStorage.getItem('permisos');
    return saved ? JSON.parse(saved) : [];
  });

  const cargarPermisos = async (idUsuario, rol) => {
    if (rol === 'gerente') {
      const todosPermisos = [
        'inicio', 'catalogo', 'carrito', 'ventas',
        'inventario', 'usuarios', 'categorias',
        'registro-mueble', 'gestion-muebles'
      ];
      setPermisos(todosPermisos);
      localStorage.setItem('permisos', JSON.stringify(todosPermisos));
    } else {
      try {
        // Primero carga permisos del usuario
        const res = await API.get(`/UsuarioPermisos/usuario/${idUsuario}`);
        let permisosFinales = res.data;

        // Si no tiene permisos individuales busca los del rol
        if (permisosFinales.length === 0) {
          try {
            const resRol = await API.get(`/Roles`);
            const rolData = resRol.data.find(r => r.nombre === rol);
            if (rolData?.permisos?.length > 0) {
              permisosFinales = rolData.permisos.map(p => p.permiso);
            }
          } catch (e) {
            console.error('Error cargando permisos del rol:', e);
          }
        }

        setPermisos(permisosFinales);
        localStorage.setItem('permisos', JSON.stringify(permisosFinales));
      } catch (error) {
        console.error('Error cargando permisos:', error);
        setPermisos(['ventas']);
        localStorage.setItem('permisos', JSON.stringify(['ventas']));
      }
    }
  };

  const login = async (usuarioData) => {
    setUsuario(usuarioData);
    localStorage.setItem('usuario', JSON.stringify(usuarioData));
    await cargarPermisos(usuarioData.idUsuario, usuarioData.rol);
  };

  const logout = () => {
    setUsuario(null);
    setPermisos([]);
    localStorage.removeItem('usuario');
    localStorage.removeItem('permisos');
  };

  const esGerente = () => usuario?.rol === 'gerente';
  const esVendedor = () => usuario?.rol === 'vendedor';
  const tienePermiso = (permiso) => {
    if (usuario?.rol === 'gerente') return true;
    return permisos.includes(permiso);
  };

  return (
    <AuthContext.Provider value={{
      usuario, permisos, login, logout,
      esGerente, esVendedor, tienePermiso
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}