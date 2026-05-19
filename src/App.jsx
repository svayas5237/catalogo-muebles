import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RoleRoute from './components/RoleRoute';
import Home from './pages/Home';
import Catalogo from './pages/Catalogo';
import Inventario from './pages/Inventario';
import Carrito from './pages/Carrito';
import Login from './pages/Login';
import ProductoDetalle from './pages/ProductoDetalle';
import SinPermiso from './pages/SinPermiso';
import Ventas from './pages/Ventas';
import Checkout from './pages/Checkout';
import Usuarios from './pages/Usuarios';
import Categorias from './pages/Categorias';
import RegistroMueble from './pages/RegistroMueble';
import GestionMuebles from './pages/GestionMuebles';
import './App.css';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="app-wrapper">
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Público */}
            <Route path="/" element={<Home />} />
            <Route path="/catalogo" element={<Catalogo />} />
            <Route path="/producto/:id" element={<ProductoDetalle />} />
            <Route path="/carrito" element={<Carrito />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/login" element={<Login />} />
            <Route path="/sin-permiso" element={<SinPermiso />} />

            {/* Ventas — vendedor con permiso o gerente */}
            <Route path="/ventas" element={
              <RoleRoute roles={['vendedor', 'gerente']} permiso="ventas">
                <Ventas />
              </RoleRoute>
            } />

            {/* Solo Gerente */}
            <Route path="/inventario" element={
              <RoleRoute roles={['gerente']}>
                <Inventario />
              </RoleRoute>
            } />

            <Route path="/usuarios" element={
              <RoleRoute roles={['gerente']}>
                <Usuarios />
              </RoleRoute>
            } />

            {/* Gerente o vendedor con permiso */}
            <Route path="/categorias" element={
              <RoleRoute roles={['gerente', 'vendedor']} permiso="categorias">
                <Categorias />
              </RoleRoute>
            } />

            <Route path="/registro-mueble" element={
              <RoleRoute roles={['gerente', 'vendedor']} permiso="registro-mueble">
                <RegistroMueble />
              </RoleRoute>
            } />

            <Route path="/gestion-muebles" element={
              <RoleRoute roles={['gerente', 'vendedor']} permiso="gestion-muebles">
                <GestionMuebles />
              </RoleRoute>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;