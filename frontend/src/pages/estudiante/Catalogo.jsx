import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getCursos, agregarAlCarrito, matricularse, getFiltrosCatalogo } from '../../api/cursos';
import Breadcrumbs from '../../components/Breadcrumbs';
import { 
  FaSearch, FaShoppingCart, FaUserGraduate, FaHeart, FaInfoCircle,
  FaTh, FaList, FaSortAmountDown, FaFilter, FaTimes, FaStar,
  FaClock, FaUser, FaCheckCircle, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import './Catalogo.css';

export default function EstudianteCatalogo() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [cursosFiltrados, setCursosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingFiltros, setLoadingFiltros] = useState(true);
  const [vista, setVista] = useState('grid'); // 'grid' o 'list'
  const [ordenarPor, setOrdenarPor] = useState('populares'); // Predeterminado: Más Popular
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const cursosPorPagina = 12;
  
  // Opciones de filtros desde el backend
  const [opcionesFiltros, setOpcionesFiltros] = useState({
    software: [],
    aplicaciones: [],
    aplicaciones_agrupadas: {},
    niveles: [],
    producciones: []
  });
  
  const [filters, setFilters] = useState({
    busqueda: '',
    software_id: '',
    aplicacion_id: '',
    nivel_id: '',
    produccion_id: '',
    precioMin: '',
    precioMax: '',
    calificacion: '',
    duracion: '',
    certificacion: false,
    gratis: false
  });

  useEffect(() => {
    fetchFiltros();
    fetchCursos();
  }, []);

  useEffect(() => {
    fetchCursos();
  }, [filters, ordenarPor]);

  const fetchFiltros = async () => {
    try {
      setLoadingFiltros(true);
      const response = await getFiltrosCatalogo();
      if (response.status === 'success') {
        setOpcionesFiltros({
          software: response.data.software || [],
          aplicaciones: response.data.aplicaciones || [],
          aplicaciones_agrupadas: response.data.aplicaciones_agrupadas || {},
          niveles: response.data.niveles || [],
          producciones: response.data.producciones || []
        });
      }
    } catch (error) {
      console.error('Error cargando filtros:', error);
    } finally {
      setLoadingFiltros(false);
    }
  };

  const fetchCursos = async () => {
    try {
      setLoading(true);
      
      // Construir objeto de filtros para enviar al backend
      const filtrosBackend = {
        estado: 'Publicado'
      };
      
      if (filters.busqueda) filtrosBackend.busqueda = filters.busqueda;
      if (filters.software_id) filtrosBackend.software_id = filters.software_id;
      if (filters.aplicacion_id) filtrosBackend.aplicacion_id = filters.aplicacion_id;
      if (filters.nivel_id) filtrosBackend.nivel_id = filters.nivel_id;
      if (filters.produccion_id) filtrosBackend.produccion_id = filters.produccion_id;
      if (filters.precioMin) filtrosBackend.precio_min = filters.precioMin;
      if (filters.precioMax) filtrosBackend.precio_max = filters.precioMax;
      if (filters.gratis) filtrosBackend.gratis = true;
      
      const response = await getCursos(filtrosBackend);
      
      if (response.status === 'success') {
        const cursosData = response.data || [];
        
        // Aplicar filtros adicionales en el frontend (duración, calificación, certificación)
        let cursosFiltrados = cursosData;
        
        if (filters.calificacion) {
          const minCalificacion = parseFloat(filters.calificacion);
          cursosFiltrados = cursosFiltrados.filter(c => 
            (c.calificacion_promedio || 0) >= minCalificacion
          );
        }
        
        if (filters.duracion) {
          switch (filters.duracion) {
            case 'menos-5':
              cursosFiltrados = cursosFiltrados.filter(c => (c.cantidad_horas || 0) < 5);
              break;
            case '5-10':
              cursosFiltrados = cursosFiltrados.filter(c => {
                const horas = c.cantidad_horas || 0;
                return horas >= 5 && horas <= 10;
              });
              break;
            case 'mas-10':
              cursosFiltrados = cursosFiltrados.filter(c => (c.cantidad_horas || 0) > 10);
              break;
          }
        }
        
        if (filters.certificacion) {
          cursosFiltrados = cursosFiltrados.filter(c => c.incluye_certificado === true);
        }
        
        // Ordenar
        cursosFiltrados = ordenarCursos(cursosFiltrados, ordenarPor);
        
        setCursos(cursosFiltrados);
        setCursosFiltrados(cursosFiltrados);
        setPaginaActual(1);
      }
    } catch (error) {
      console.error('Error cargando cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const ordenarCursos = (cursos, criterio) => {
    const copia = [...cursos];
    
    switch (criterio) {
      case 'populares':
        // Ordenar por número de matriculados (si existe) o por ID
        return copia.sort((a, b) => (b.numero_matriculados || 0) - (a.numero_matriculados || 0));
      case 'recientes':
        return copia.sort((a, b) => 
          new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
      case 'calificacion':
        // Ordenar por calificación promedio (si existe)
        return copia.sort((a, b) => (b.calificacion_promedio || 0) - (a.calificacion_promedio || 0));
      case 'precio-asc':
        return copia.sort((a, b) => (a.precio || 0) - (b.precio || 0));
      case 'precio-desc':
        return copia.sort((a, b) => (b.precio || 0) - (a.precio || 0));
      default:
        return copia;
    }
  };

  // Paginación
  const totalPaginas = Math.ceil(cursosFiltrados.length / cursosPorPagina);
  const inicio = (paginaActual - 1) * cursosPorPagina;
  const fin = inicio + cursosPorPagina;
  const cursosPaginados = cursosFiltrados.slice(inicio, fin);

  const handleVerDetalles = (cursoID) => {
    navigate(`/cursos/${cursoID}`);
  };

  const handleInscribirse = async (cursoID, precio) => {
    if (!isAuthenticated) {
      alert('Debes iniciar sesión para inscribirte en un curso.');
      navigate('/');
      return;
    }

    if (precio > 0) {
      // Si tiene precio, redirigir al carrito
      await handleAgregarCarrito(cursoID);
      return;
    }

    try {
      const response = await matricularse(cursoID);
      if (response.status === 'success') {
        alert('¡Te has inscrito exitosamente en el curso!');
        navigate(`/cursos/${cursoID}`);
      } else {
        alert(response.message || 'Error al inscribirse en el curso');
      }
    } catch (error) {
      console.error('Error inscribiéndose:', error);
      alert('Error al inscribirse en el curso');
    }
  };

  const handleAgregarCarrito = async (cursoID) => {
    if (!isAuthenticated) {
      alert('Debes iniciar sesión para agregar cursos al carrito.');
      navigate('/');
      return;
    }

    try {
      const response = await agregarAlCarrito(cursoID);
      if (response.status === 'success') {
        alert('Curso agregado al carrito');
        navigate('/cursos/carrito');
      } else {
        alert(response.message || 'Error al agregar al carrito');
      }
    } catch (error) {
      console.error('Error agregando al carrito:', error);
      alert('Error al agregar al carrito');
    }
  };

  const handleListaDeseos = (cursoID) => {
    // TODO: Implementar funcionalidad de lista de deseos
    alert('Funcionalidad de lista de deseos próximamente');
  };

  const limpiarFiltros = () => {
    setFilters({
      busqueda: '',
      software_id: '',
      aplicacion_id: '',
      nivel_id: '',
      produccion_id: '',
      precioMin: '',
      precioMax: '',
      calificacion: '',
      duracion: '',
      certificacion: false,
      gratis: false
    });
  };

  const formatMoneda = (valor) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(valor || 0);
  };

  const renderEstrellas = (calificacion) => {
    const calificacionNum = calificacion || 0;
    const estrellasLlenas = Math.floor(calificacionNum);
    const tieneMedia = calificacionNum % 1 >= 0.5;
    
    return (
      <div className="curso-calificacion">
        <div className="estrellas">
          {[...Array(5)].map((_, i) => (
            <FaStar
              key={i}
              className={i < estrellasLlenas ? 'estrella-llena' : i === estrellasLlenas && tieneMedia ? 'estrella-media' : 'estrella-vacia'}
            />
          ))}
        </div>
        <span className="calificacion-numero">{calificacionNum.toFixed(1)}</span>
      </div>
    );
  };

  if (loading || loadingFiltros) {
    return <div className="catalogo-loading">Cargando catálogo de cursos...</div>;
  }

  return (
    <div className="estudiante-catalogo">
      <Breadcrumbs items={[
        { label: 'Dashboard', path: '/estudiante/dashboard' },
        { label: 'Catálogo de Cursos', path: '/estudiante/catalogo' }
      ]} />

      {/* 1. Encabezado y Barra de Búsqueda */}
      <div className="catalogo-header-section">
        <div className="catalogo-header">
          <h1>Catálogo de Cursos</h1>
          <p className="catalogo-subtitle">Explora y encuentra el curso perfecto para ti</p>
        </div>

        {/* Barra de búsqueda destacada */}
        <div className="search-bar-destacada">
          <div className="search-bar-wrapper">
            <FaSearch className="search-icon-large" />
            <input
              type="text"
              placeholder="Buscar cursos por nombre, instructor o palabras clave..."
              value={filters.busqueda}
              onChange={(e) => setFilters({ ...filters, busqueda: e.target.value })}
              className="search-input-large"
            />
          </div>
          
          {/* Sugerencias de software populares */}
          {opcionesFiltros.software.length > 0 && (
            <div className="categorias-sugeridas">
              <span className="sugerencias-label">Software:</span>
              <div className="sugerencias-tags">
                {opcionesFiltros.software.slice(0, 4).map((soft) => (
                  <button
                    key={soft.id}
                    className="tag-sugerencia"
                    onClick={() => setFilters({ ...filters, software_id: soft.id })}
                  >
                    {soft.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="catalogo-main-content">
        {/* 2. Panel Lateral de Filtros */}
        <aside className={`filtros-sidebar ${mostrarFiltros ? 'abierto' : ''}`}>
          <div className="filtros-sidebar-header">
            <h3>Filtros</h3>
            <button className="cerrar-filtros-sidebar" onClick={() => setMostrarFiltros(false)}>
              <FaTimes />
            </button>
          </div>

          <div className="filtros-sidebar-content">
            {/* Filtro por Software Principal (Obligatorio) */}
            <div className="filtro-group">
              <label>Software Principal *</label>
              <select
                value={filters.software_id}
                onChange={(e) => setFilters({ ...filters, software_id: e.target.value })}
              >
                <option value="">Todos los software</option>
                {opcionesFiltros.software.map((soft) => (
                  <option key={soft.id} value={soft.id}>{soft.nombre}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Tipo de Restauración / Aplicación */}
            <div className="filtro-group">
              <label>Tipo de Restauración / Aplicación</label>
              <select
                value={filters.aplicacion_id}
                onChange={(e) => setFilters({ ...filters, aplicacion_id: e.target.value })}
              >
                <option value="">Todas las aplicaciones</option>
                {Object.entries(opcionesFiltros.aplicaciones_agrupadas).map(([categoria, aplicaciones]) => (
                  <optgroup key={categoria} label={categoria}>
                    {aplicaciones.map((app) => (
                      <option key={app.id} value={app.id}>{app.nombre}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Filtro por Nivel de Profundidad */}
            <div className="filtro-group">
              <label>Nivel de Profundidad</label>
              <select
                value={filters.nivel_id}
                onChange={(e) => setFilters({ ...filters, nivel_id: e.target.value })}
              >
                <option value="">Todos los niveles</option>
                {opcionesFiltros.niveles.map((nivel) => (
                  <option key={nivel.id} value={nivel.id}>{nivel.nombre}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Salida de Producción */}
            <div className="filtro-group">
              <label>Salida de Producción</label>
              <select
                value={filters.produccion_id}
                onChange={(e) => setFilters({ ...filters, produccion_id: e.target.value })}
              >
                <option value="">Todas las producciones</option>
                {opcionesFiltros.producciones.map((prod) => (
                  <option key={prod.id} value={prod.id}>{prod.nombre}</option>
                ))}
              </select>
            </div>

            {/* Filtro por Precio */}
            <div className="filtro-group">
              <label>Precio</label>
              <div className="precio-filtros">
                <input
                  type="number"
                  placeholder="Mín"
                  value={filters.precioMin}
                  onChange={(e) => setFilters({ ...filters, precioMin: e.target.value })}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Máx"
                  value={filters.precioMax}
                  onChange={(e) => setFilters({ ...filters, precioMax: e.target.value })}
                />
              </div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.gratis}
                  onChange={(e) => setFilters({ ...filters, gratis: e.target.checked })}
                />
                Gratuito
              </label>
            </div>

            {/* Filtro por Calificación */}
            <div className="filtro-group">
              <label>Calificación</label>
              <select
                value={filters.calificacion}
                onChange={(e) => setFilters({ ...filters, calificacion: e.target.value })}
              >
                <option value="">Todas las calificaciones</option>
                <option value="4">4 estrellas o más</option>
                <option value="4.5">4.5 estrellas o más</option>
              </select>
            </div>

            {/* Filtro por Duración */}
            <div className="filtro-group">
              <label>Duración</label>
              <select
                value={filters.duracion}
                onChange={(e) => setFilters({ ...filters, duracion: e.target.value })}
              >
                <option value="">Todas las duraciones</option>
                <option value="menos-5">Menos de 5 horas</option>
                <option value="5-10">5-10 horas</option>
                <option value="mas-10">Más de 10 horas</option>
              </select>
            </div>

            {/* Filtro por Certificación */}
            <div className="filtro-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.certificacion}
                  onChange={(e) => setFilters({ ...filters, certificacion: e.target.checked })}
                />
                Incluye Certificado
              </label>
            </div>

            <div className="filtros-actions">
              <button className="aplicar-filtros-btn" onClick={() => setMostrarFiltros(false)}>
                Aplicar Filtros
              </button>
              <button className="limpiar-filtros-btn" onClick={limpiarFiltros}>
                Restablecer
              </button>
            </div>
          </div>
        </aside>

        {/* 3. Área de Resultados */}
        <div className="catalogo-resultados">
          {/* Controles de visualización */}
          <div className="resultados-header">
            <div className="resultados-info">
              <span className="contador-resultados">
                Mostrando {cursosPaginados.length} de {cursosFiltrados.length} cursos
              </span>
            </div>
            <div className="resultados-controls">
              <div className="ordenar-container">
                <FaSortAmountDown className="sort-icon" />
                <select
                  value={ordenarPor}
                  onChange={(e) => setOrdenarPor(e.target.value)}
                  className="ordenar-select"
                >
                  <option value="populares">Más Popular</option>
                  <option value="recientes">Más Reciente</option>
                  <option value="calificacion">Mejor Calificado</option>
                  <option value="precio-asc">Precio: Menor a Mayor</option>
                  <option value="precio-desc">Precio: Mayor a Menor</option>
                </select>
              </div>
              <button
                className={`vista-btn ${vista === 'grid' ? 'active' : ''}`}
                onClick={() => setVista('grid')}
                title="Vista de cuadrícula"
              >
                <FaTh />
              </button>
              <button
                className={`vista-btn ${vista === 'list' ? 'active' : ''}`}
                onClick={() => setVista('list')}
                title="Vista de lista"
              >
                <FaList />
              </button>
              <button
                className="filtros-toggle-btn"
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                title="Mostrar/Ocultar filtros"
              >
                <FaFilter /> Filtros
              </button>
            </div>
          </div>

          {/* Grid o Lista de cursos */}
          {cursosPaginados.length === 0 ? (
            <div className="no-cursos">
              <p>No se encontraron cursos con los filtros aplicados</p>
              <button className="limpiar-filtros-btn" onClick={limpiarFiltros}>
                Limpiar Filtros
              </button>
            </div>
          ) : (
            <>
              <div className={`cursos-container ${vista === 'grid' ? 'grid-view' : 'list-view'}`}>
                {cursosPaginados.map((curso) => (
                  <div key={curso.cursoID} className={`curso-card ${vista}`}>
                    {curso.imagen_portada && (
                      <div className="curso-imagen">
                        <img src={`/storage/${curso.imagen_portada}`} alt={curso.nombre} />
                        <button
                          className="lista-deseos-btn"
                          onClick={() => handleListaDeseos(curso.cursoID)}
                          title="Agregar a lista de deseos"
                        >
                          <FaHeart />
                        </button>
                      </div>
                    )}
                    <div className="curso-content">
                      <div className="curso-header">
                        <h3>{curso.nombre}</h3>
                        <span className="curso-nivel">{curso.nivel}</span>
                      </div>
                      
                      {/* Instructor */}
                      {curso.instructor && (
                        <div className="curso-instructor">
                          <FaUser className="instructor-icon" />
                          <span>{curso.instructor}</span>
                        </div>
                      )}

                      {/* Calificación */}
                      {curso.calificacion_promedio && (
                        <div className="curso-calificacion-wrapper">
                          {renderEstrellas(curso.calificacion_promedio)}
                          <span className="numero-resenas">
                            ({curso.numero_resenas || 0} reseñas)
                          </span>
                        </div>
                      )}

                      <p className="curso-descripcion">{curso.descripcion}</p>
                      
                      <div className="curso-info">
                        <span className="curso-duracion">
                          <FaClock /> {curso.cantidad_horas} horas
                        </span>
                        <span className="curso-precio">
                          {curso.precio === 0 ? (
                            <span className="precio-gratis">GRATUITO</span>
                          ) : (
                            formatMoneda(curso.precio)
                          )}
                        </span>
                      </div>

                      {/* Certificación */}
                      {curso.incluye_certificado && (
                        <div className="curso-certificacion">
                          <FaCheckCircle /> Incluye Certificado
                        </div>
                      )}

                      <div className="curso-acciones">
                        <button
                          className="btn-ver-detalles"
                          onClick={() => handleVerDetalles(curso.cursoID)}
                        >
                          <FaInfoCircle /> Ver Detalles
                        </button>
                        {curso.precio > 0 ? (
                          <>
                            <button
                              className="btn-agregar-carrito"
                              onClick={() => handleAgregarCarrito(curso.cursoID)}
                            >
                              <FaShoppingCart /> Añadir a la Cesta
                            </button>
                            <button
                              className="btn-inscribirse btn-primary"
                              onClick={() => handleInscribirse(curso.cursoID, curso.precio)}
                            >
                              <FaUserGraduate /> Inscribirse / Comprar
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn-inscribirse btn-primary"
                            onClick={() => handleInscribirse(curso.cursoID, 0)}
                          >
                            <FaUserGraduate /> Inscribirse Gratis
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="paginacion">
                  <button
                    className="paginacion-btn"
                    onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                  >
                    <FaChevronLeft /> Anterior
                  </button>
                  
                  <div className="paginacion-numeros">
                    {[...Array(totalPaginas)].map((_, i) => {
                      const pagina = i + 1;
                      // Mostrar primera, última, actual y adyacentes
                      if (
                        pagina === 1 ||
                        pagina === totalPaginas ||
                        (pagina >= paginaActual - 1 && pagina <= paginaActual + 1)
                      ) {
                        return (
                          <button
                            key={pagina}
                            className={`paginacion-numero ${pagina === paginaActual ? 'active' : ''}`}
                            onClick={() => setPaginaActual(pagina)}
                          >
                            {pagina}
                          </button>
                        );
                      } else if (pagina === paginaActual - 2 || pagina === paginaActual + 2) {
                        return <span key={pagina} className="paginacion-ellipsis">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    className="paginacion-btn"
                    onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas}
                  >
                    Siguiente <FaChevronRight />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
