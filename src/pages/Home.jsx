import { Link } from 'react-router-dom';
import mueble1 from '../assets/mueble1.png';
import mueble2 from '../assets/mueble2.png';
import mueble3 from '../assets/mueble3.png';
import mueble4 from '../assets/mueble4.png';
import { FaStore, FaShoppingCart, FaEnvelope, FaMapMarkerAlt, FaWhatsapp, FaClock, FaBible, FaFacebook, FaInstagram, FaYoutube, FaTiktok } from 'react-icons/fa';
import './Home.css';
import imgClosets from '../assets/Closets.png';
import imgTv from '../assets/Tv.png';
import imgEspejo from '../assets/Espejo.png';
import imgCajonera from '../assets/Cajonera.png';
import imgPeinadora from '../assets/Peinadora.png';
import imgVitrina from '../assets/Vitrina.png';

const categorias = [
  { nombre: 'Closets', imagen: imgClosets, descripcion: 'Closets modernos y elegantes' },
  { nombre: 'Tv', imagen: imgTv, descripcion: 'Muebles para televisor' },
  { nombre: 'Espejo', imagen: imgEspejo, descripcion: 'Espejos decorativos' },
  { nombre: 'Cajonera', imagen: imgCajonera, descripcion: 'Cajoneras funcionales' },
  { nombre: 'Peinadora', imagen: imgPeinadora, descripcion: 'Peinadoras con espejo' },
  { nombre: 'Vitrina', imagen: imgVitrina, descripcion: 'Vitrinas de exhibición' },
];

function Home() {
  return (
    <div className="home-container">

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-tag">🌿 Muebles de calidad</span>
          <h1>Transforma tu hogar con <span>Ecology Muebles</span></h1>
          <p>Somos vendedores comprometidos con el bienestar de nuestros clientes. Con muebles que combinan estilo, funcionalidad y sostenibilidad.</p>
          <div className="hero-btns">
          <Link to="/catalogo" className="hero-btn-primary">
            <FaStore /> Ver Catálogo
          </Link>
          <Link to="/carrito" className="hero-btn-secondary">
            <FaShoppingCart /> Mi Carrito
          </Link>
          <a href="https://www.facebook.com/ecologymuebles" target="_blank" rel="noopener noreferrer" className="red-social facebook">
            <FaFacebook />
          </a>
          <a href="https://www.instagram.com/ecologymuebles" target="_blank" rel="noopener noreferrer" className="red-social instagram">
            <FaInstagram />
          </a>
          <a href="https://www.youtube.com/@EcologyMuebles" target="_blank" rel="noopener noreferrer" className="red-social youtube">
            <FaYoutube />
          </a>
          <a href="https://www.tiktok.com/@ecology.muebles" target="_blank" rel="noopener noreferrer" className="red-social tiktok">
            <FaTiktok />
          </a>
        </div>
        </div>
        <div className="hero-imagen">
          <div className="hero-imagen-grid">
            <img src={mueble1} alt="mueble 1" className="hero-img-item" />
            <img src={mueble2} alt="mueble 2" className="hero-img-item" />
            <img src={mueble3} alt="mueble 3" className="hero-img-item" />
            <img src={mueble4} alt="mueble 4" className="hero-img-item" />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        <div className="stat-item">
          <span className="stat-numero">10+</span>
          <span className="stat-label">Productos</span>
        </div>
        <div className="stat-item">
          <span className="stat-numero">1000+</span>
          <span className="stat-label">Clientes satisfechos</span>
        </div>
        <div className="stat-item">
          <span className="stat-numero">10+</span>
          <span className="stat-label">Años de experiencia en ventas</span>
        </div>
        <div className="stat-item">
          <span className="stat-numero">100%</span>
          <span className="stat-label">Garantía de calidad</span>
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="categorias-section">
        <h2 className="section-title">Nuestros Productos</h2>
        <p className="section-subtitle">Encuentra el mueble perfecto para cada espacio de tu hogar</p>
        <div className="categorias-grid">
          {categorias.map((cat) => (
            <Link to="/catalogo" key={cat.nombre} className="categoria-card">
              <div className="cat-imagen-wrapper">
                <img src={cat.imagen} alt={cat.nombre} className="cat-imagen" />
              </div>
              <h3>{cat.nombre}</h3>
              <p>{cat.descripcion}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* POR QUÉ ELEGIRNOS */}
      <section className="porque-section">
        <h2 className="section-title">¿Por qué elegirnos?</h2>
        <div className="porque-grid">
          <div className="porque-card">
            <span className="porque-icon">🏭</span>
            <h3>Experiencia en ventas</h3>
            <p>Materiales de alta calidad y procesos sostenibles.</p>
          </div>
          <div className="porque-card">
            <span className="porque-icon">💰</span>
            <h3>Precios justos</h3>
            <p>Al ser fabricantes directos, te ofrecemos los mejores precios del mercado.</p>
          </div>
          <div className="porque-card">
            <span className="porque-icon">🚚</span>
            <h3>Entrega a domicilio</h3>
            <p>Llevamos tus muebles hasta la puerta de tu casa con total seguridad.</p>
          </div>
          <div className="porque-card">
            <span className="porque-icon">🛡️</span>
            <h3>Garantía total</h3>
            <p>Todos nuestros productos tienen garantía y soporte postventa.</p>
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section className="contacto-section">
        <div className="contacto-info">
          <h2>Encuéntranos</h2>
          <p>Visítanos en nuestro taller o contáctanos por cualquiera de estos medios.</p>
          <div className="contacto-items">
            <div className="contacto-item">
              <FaMapMarkerAlt className="contacto-icon" />
              <span>Av. Alaska, Huachi Grande vía a la libertad</span>
            </div>
            <div className="contacto-item">
              <FaEnvelope className="contacto-icon" />
              <span>ecologymuebles@gmail.com</span>
            </div>
            <div className="contacto-item">
              <FaWhatsapp className="contacto-icon" />
              <span>WhatsApp: 0983221612</span>
            </div>
            <div className="contacto-item">
              <FaClock className="contacto-icon" />
              <span>Lunes a Sábado — 8:00 AM a 6:00 PM</span>
            </div>
            <div className="contacto-item">
              <FaBible  className="contacto-icon" />
              <span> “Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres.” - Colosenses 3:23</span>
            </div>
          </div>
        </div>
        <div className="contacto-mapa">
          <iframe
            title="Ubicación Ecology Muebles"
            src="https://maps.google.com/maps?q=-1.3149000,-78.6463000&z=16&output=embed"
            width="100%"
            height="300"
            style={{ border: 0, borderRadius: '12px' }}
            allowFullScreen=""
            loading="lazy"
          ></iframe>
        </div>
      </section>

      {/* BOTÓN FLOTANTE WHATSAPP */}
      
        <a href="https://wa.me/593983221612" target="_blank" rel="noopener noreferrer" className="whatsapp-flotante" title="Contáctanos por WhatsApp"><FaWhatsapp /></a>
    </div>
  );
}

export default Home;