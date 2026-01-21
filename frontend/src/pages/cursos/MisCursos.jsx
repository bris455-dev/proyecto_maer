import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMatriculas } from '../../api/cursos';
import Breadcrumbs from '../../components/Breadcrumbs';
import { FaPlayCircle, FaClock, FaCheckCircle, FaBookOpen, FaChartLine } from 'react-icons/fa';
import './MisCursos.css';

export default function MisCursos() {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    enProgreso: 0,
    completados: 0
  });

  useEffect(() => {
    cargarMisCursos();
  }, []);

  const cargarMisCursos = async () => {
    try {
      setLoading(true);
      const response = await getMatriculas();
      if (response.status === 'success') {
        const cursosData = response.data || [];
        setCursos(cursosData);
        
        // Calcular estadísticas
        const total = cursosData.length;
        const completados = cursosData.filter(c => calcularProgreso(c) === 100).length;
        const enProgreso = total - completados;
        
        setStats({ total, enProgreso, completados });
      }
    } catch (error) {
      console.error('Error cargando mis cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularProgreso = (matricula) => {
    if (!matricula.curso) return 0;
    
    const curso = matricula.curso;
    
    // Calcular total de archivos y sesiones
    const archivosGenerales = curso.archivos?.filter(a => !a.sesionID).length || 0;
    const totalSesiones = curso.sesiones?.length || 0;
    const archivosPorSesion = curso.sesiones?.reduce((acc, s) => acc + (s.archivos?.length || 0), 0) || 0;
    const totalArchivos = archivosGenerales + archivosPorSesion;
    
    if (totalArchivos === 0 && totalSesiones === 0) return 0;
    
    // Por ahora, calculamos progreso basado en sesiones visitadas
    // En el futuro, esto se basará en archivos vistos/descargados desde localStorage o backend
    const sesionesVisitadas = curso.sesiones?.filter(s => {
      // Verificar si hay algún indicador de que la sesión fue visitada
      // Por ahora, asumimos que si tiene archivos, puede estar en progreso
      return s.archivos && s.archivos.length > 0;
    }).length || 0;
    
    // Progreso basado en sesiones (50% del total) + archivos (50% del total)
    const progresoSesiones = totalSesiones > 0 ? (sesionesVisitadas / totalSesiones) * 50 : 0;
    const progresoArchivos = totalArchivos > 0 ? Math.min(50, (archivosGenerales / Math.max(1, totalArchivos)) * 50) : 0;
    
    return Math.round(progresoSesiones + progresoArchivos);
  };

  const formatMoneda = (valor) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(valor || 0);
  };

  if (loading) {
    return <div className="mis-cursos-loading">Cargando tus cursos...</div>;
  }

  return (
    <div className="mis-cursos-container">
      <Breadcrumbs items={[
        { label: 'Cursos', path: '/cursos' },
        { label: 'Mis Cursos', path: '/cursos/mis-cursos' }
      ]} />

      <div className="mis-cursos-header">
        <h1>
          <FaBookOpen /> Mis Cursos
        </h1>
        <button 
          className="btn-explorar-cursos"
          onClick={() => navigate('/cursos')}
        >
          Explorar Más Cursos
        </button>
      </div>

      {/* Estadísticas */}
      <div className="mis-cursos-stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <FaBookOpen />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Cursos</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon progreso">
            <FaChartLine />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.enProgreso}</span>
            <span className="stat-label">En Progreso</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon completado">
            <FaCheckCircle />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.completados}</span>
            <span className="stat-label">Completados</span>
          </div>
        </div>
      </div>

      {/* Lista de cursos */}
      {cursos.length === 0 ? (
        <div className="mis-cursos-vacio">
          <FaBookOpen size={64} />
          <h2>No tienes cursos matriculados</h2>
          <p>Explora nuestros cursos y comienza tu aprendizaje</p>
          <button 
            className="btn-explorar"
            onClick={() => navigate('/cursos')}
          >
            Explorar Cursos
          </button>
        </div>
      ) : (
        <div className="mis-cursos-grid">
          {cursos.map((matricula) => {
            const curso = matricula.curso;
            const progreso = calcularProgreso(matricula);
            
            return (
              <div key={matricula.matriculaID} className="curso-matriculado-card">
                {curso.imagen_portada && (
                  <div className="curso-imagen-wrapper">
                    <img 
                      src={`/storage/${curso.imagen_portada}`} 
                      alt={curso.nombre}
                      className="curso-imagen"
                    />
                    <div className="progreso-overlay">
                      <div className="progreso-bar" style={{ width: `${progreso}%` }}></div>
                    </div>
                  </div>
                )}
                <div className="curso-content">
                  <div className="curso-header">
                    <h3>{curso.nombre}</h3>
                    <span className="curso-nivel">{curso.nivel}</span>
                  </div>
                  <p className="curso-descripcion">{curso.descripcion}</p>
                  
                  <div className="curso-progreso">
                    <div className="progreso-info">
                      <span className="progreso-label">Progreso</span>
                      <span className="progreso-porcentaje">{progreso}%</span>
                    </div>
                    <div className="progreso-bar-container">
                      <div 
                        className="progreso-bar-fill" 
                        style={{ width: `${progreso}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="curso-meta">
                    <span><FaClock /> {curso.cantidad_horas} horas</span>
                    <span className="curso-fecha">
                      Matriculado: {new Date(matricula.fecha_matricula).toLocaleDateString()}
                    </span>
                  </div>

                  <button
                    className="btn-continuar-curso"
                    onClick={() => navigate(`/estudiante/curso/${curso.cursoID}`)}
                  >
                    <FaPlayCircle /> {progreso === 0 ? 'Comenzar Curso' : 'Continuar Curso'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

